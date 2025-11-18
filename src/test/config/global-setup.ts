import { execa } from "execa"
import { Server } from "node:http"
import path from "node:path"
import { after, before } from "node:test"

import { fileURLToPath } from "node:url" // Importe fileURLToPath pour convertir les URLs en chemins de fichiers Windows
import { prismaTest } from "./prisma-test.js"
import { app } from "../../app.js"

// ⚠️ Sur Windows avec Node.js, import.meta.dirname n'existe pas toujours
// Il faut utiliser cette alternative compatible
const __filename = fileURLToPath(import.meta.url) // Convertit l'URL du module en chemin de fichier (C:\Users\...)
const __dirname = path.dirname(__filename) // Extrait le répertoire du fichier actuel

let server: Server
const COMPOSE_FILE = path.resolve(__dirname, "compose.test.yml")
const PROJECT_NAME = "gamerchallengetestdb"

// Fonction helper pour attendre que PostgreSQL soit opérationnel
async function waitForPostgres(maxRetries = 30): Promise<void> {
  // Accepte un nombre max de tentatives (défaut: 30)
  for (let i = 0; i < maxRetries; i++) {
    try {
      await execa(
        // Exécute une commande Docker
        "docker",
        [
          // Arguments de la commande
          "compose",
          "-f",
          COMPOSE_FILE,
          "-p",
          PROJECT_NAME, // Spécifie le fichier compose et le nom du projet
          "exec",
          "-T",
          "gamerChallenge_test_db",
          "pg_isready",
          "-U",
          process.env.PG_USER || "gamerChallenge_test_db",
          "-d",
          process.env.PG_DATABASE || "gamerchallengedb",
        ],
        {
          stdio: "ignore", // Supprime toute sortie console (stdout/stderr)
          shell: true, // ⚠️ IMPORTANT sur Windows : force l'utilisation du shell (cmd.exe ou PowerShell)
        }
      )
      console.log("✅ PostgreSQL prêt")
      return
    } catch {
      // Si pg_isready échoue (DB pas encore prête)
      if (i === maxRetries - 1) {
        // Si c'était la dernière tentative
        throw new Error(`PostgreSQL not ready after ${maxRetries} seconds`)
      }
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Attend 1 seconde avant de réessayer
    }
  }
}

before(async () => {
  try {
    console.log("🚀 Démarrage de l'environnement de test...")

    // 1. Démarrer les conteneurs Docker
    await execa(
      // Exécute une commande et attend qu'elle se termine
      "docker", // Commande principale
      ["compose", "-f", COMPOSE_FILE, "-p", PROJECT_NAME, "up", "-d"],
      {
        stdio: "ignore",
        shell: true,
      }
    )

    await waitForPostgres()

    // 3. Appliquer les migrations Prisma pour créer les tables dans la DB de test
    console.log("📦 Application des migrations Prisma...")
    await execa("npx", ["prisma", "migrate", "deploy"], {
      // Exécute les migrations Prisma via npx
      stdio: "inherit", // Affiche les logs Prisma dans la console (utile pour débugger)
      env: process.env, // Passe les variables d'environnement (DATABASE_URL, etc.)
      shell: true,
    })
    // 🆕 4. Seeding de la base de données de test
    console.log("🌱 Seeding de la base de données...")
    await execa("npx", ["tsx", "--env-file=./src/test/config/.env.test", "./src/test/config/seeding.test.ts"], {
      stdio: "inherit",
      env: process.env,
      shell: true,
    })
    console.log("✅ Seeding terminé")

    // 5. Démarrer le serveur HTTP de l'application
    const port = process.env.PORT || 7357
    await new Promise<void>((resolve) => {
      server = app.listen(port, () => {
        console.log(`✅ Serveur de test démarré sur le port ${port}`)
        resolve()
      })
    })
  } catch (error) {
    console.error("❌ Erreur lors du setup:", error)
    // Cleanup en cas d'erreur pour ne pas laisser des ressources ouvertes
    if (server) server.close() // Ferme le serveur s'il a été démarré
    await execa("docker", ["compose", "-f", COMPOSE_FILE, "-p", PROJECT_NAME, "down", "-v"], {
      shell: true,
    })
    throw error
  }
})

// Hook after : s'exécute UNE FOIS après l'ensemble des tests
after(async () => {
  // Fonction asynchrone pour utiliser await
  console.log("🧹 Nettoyage de l'environnement de test...")

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        // Promisifie server.close qui utilise des callbacks
        server.close((err) => {
          // Ferme le serveur et attend que toutes les connexions soient terminées
          if (err) {
            // Si une erreur survient pendant la fermeture
            console.warn("⚠️ Erreur lors de la fermeture du serveur:", err)
            reject(err) // Rejette la Promise
          } else {
            // Si la fermeture réussit
            console.log("✅ Serveur fermé")
            resolve() // Résout la Promise
          }
        })
      })
    }
    // 2. Déconnecter Prisma Client de la base de données
    await prismaTest.$disconnect() // Ferme proprement toutes les connexions Prisma à la DB
    console.log("✅ Prisma déconnecté") // Log de confirmation

    // 3. Nettoyer les conteneurs Docker et les volumes
    await execa("docker", ["compose", "-f", COMPOSE_FILE, "-p", PROJECT_NAME, "down", "-v"], {
      stdio: "ignore",
      shell: true,
    })
    console.log("✅ Conteneurs Docker nettoyés")
  } catch (error) {
    console.error("❌ Erreur lors du cleanup:", error)
  }
})
