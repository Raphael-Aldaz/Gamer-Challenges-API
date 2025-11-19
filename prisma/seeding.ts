import { Game, Platform, Genre } from "@prisma/client"
import { prismaClient } from "./index.js"
import argon2 from "argon2"
import axios from "axios"
import { ur } from "zod/locales"
const {
  media,
  game,
  genre,
  platform,
  user,
  challenge,
  participation,
  participationLike,
  challengeLike,
  genreGame,
  platformGame,
} = prismaClient
interface platformAPI {
  count: number
  next: string
  results: Platform[]
}
interface typeAPI {
  count: number
  next: string
  results: [
    {
      name: string
      image_background: string
    },
  ]
}
interface RawgGame {
  id: number
  name: string
  released: string
  background_image: string
  metacritic: number
  genres: Array<{ id: number; name: string; image_background: string }>
  platforms: Array<{ platform: { id: number; name: string } }>
}

interface RawgGameDetails extends RawgGame {
  description_raw: string
}
const hashedPassword = await argon2.hash("test")
const RAWG_API_KEY = process.env.RAWG_KEY
const RAWG_BASE_URL = "https://api.rawg.io/api"
const GAMES_TO_FETCH = 500
const GAMES_PER_REQUEST = 40 // Max par requête RAWG
const DELAY_BETWEEN_REQUESTS = 1000
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
export const shuffleData = <T>(data: T[], count: number): T[] => {
  const shuffle = [...data]
  for (let index = shuffle.length - 1; index > 0; index--) {
    const j: number = Math.floor(Math.random() * (index + 1))
    ;[shuffle[index], shuffle[j]] = [shuffle[j], shuffle[index]]
  }
  return shuffle.slice(0, count)
}
const createMediaFromUrl = async (url: string, name: string) => {
  if (!url) return null
  let mimetype = "image/jpeg"
  let size = 0
  const filename = url.split("/").pop() || `${name}.jpg`
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    })
    const ct = res.headers.get("content-type")
    const cl = res.headers.get("content-length")
    if (ct) mimetype = ct
    if (cl) size = parseInt(cl, 10)
    const mediaResponse = await media.create({
      data: {
        filename,
        original_name: name,
        mimetype,
        size,
        path: url,
      },
    })

    return mediaResponse.media_id
  } catch (e) {
    console.warn(`HEAD request failed for ${url}:`, e)
    return null
  }
}
const fetchGameList = async (pageSize: number, totalGames: number): Promise<RawgGame[]> => {
  const games: RawgGame[] = []
  let page = 1
  const totalPages = Math.ceil(totalGames / pageSize)

  console.log(`📥 Récupération de ${totalGames} jeux depuis RAWG...`)

  while (games.length < totalGames) {
    try {
      const response = await axios.get(`${RAWG_BASE_URL}/games`, {
        params: {
          key: RAWG_API_KEY,
          page,
          page_size: pageSize,
          ordering: "-metacritic,-rating", // Les mieux notés en premier
          metacritic: "70,100",
        },
      })
      const results = response.data.results || []
      games.push(...results)
      console.log(`   Page ${page}/${totalPages} - ${games.length}/${totalGames} jeux récupérés`)
      page++
      await sleep(DELAY_BETWEEN_REQUESTS)
    } catch (error) {
      console.error(`❌ Erreur page ${page}:`, (error as Error).message)
      await sleep(1000) // Attente plus longue en cas d'erreur
    }
  }
  return games.slice(0, totalGames)
}
const fetchGameDetails = async (gameId: number): Promise<RawgGameDetails | null> => {
  try {
    const response = await axios.get(`${RAWG_BASE_URL}/games/${gameId}`, {
      params: { key: RAWG_API_KEY },
    })
    await sleep(DELAY_BETWEEN_REQUESTS)
    return response.data
  } catch (error) {
    console.error(`❌ Erreur détails jeu ${gameId}:`, (error as Error).message)
    return null
  }
}
const upsertGenre = async (genreData: { id: number; name: string; image_background: string }) => {
  try {
    // Vérifier si le genre existe déjà
    let genreResponse = await genre.findUnique({
      where: { name: genreData.name },
    })

    if (!genreResponse) {
      // Créer le media pour l'image du genre si disponible
      let mediaId: number | null = null
      if (genreData.image_background) {
        const createdMediaId = await createMediaFromUrl(genreData.image_background, `genre_${genreData.name}`)
        if (createdMediaId) {
          mediaId = createdMediaId
        }
      }

      genreResponse = await genre.create({
        data: {
          name: genreData.name,
          image_background_id: mediaId,
        },
      })
      console.log(`   ✅ Genre créé: ${genreData.name}`)
    }

    return genreResponse
  } catch (error) {
    console.error(`❌ Erreur upsert genre ${genreData.name}:`, (error as Error).message)
    return null
  }
}
const upsertPlatform = async (platformName: string) => {
  try {
    let platformResponse = await platform.findUnique({
      where: { name: platformName },
    })

    if (!platformResponse) {
      platformResponse = await platform.create({
        data: { name: platformName },
      })
      console.log(`   ✅ Plateforme créée: ${platformName}`)
    }

    return platformResponse
  } catch (error) {
    console.error(`❌ Erreur upsert plateforme ${platformName}:`, (error as Error).message)
    return null
  }
}
const insertGame = async (gameBasic: RawgGame) => {
  try {
    console.log(`\n🎮 Traitement: ${gameBasic.name}`)

    // Vérifier si le jeu existe déjà
    const existingGame = await game.findUnique({
      where: { name: gameBasic.name },
    })

    if (existingGame) {
      console.log(`   ⏭️  Jeu déjà existant, ignoré`)
      return existingGame
    }

    // Récupérer les détails complets
    const gameDetails = await fetchGameDetails(gameBasic.id)
    if (!gameDetails) {
      console.log(`   ❌ Impossible de récupérer les détails`)
      return null
    }
    // Créer le media pour l'image du jeu
    let mediaId: number | null = null
    if (gameDetails.background_image) {
      mediaId = await createMediaFromUrl(gameDetails.background_image, gameBasic.name)
      if (mediaId) {
        console.log(`   📷 Media créé avec l'URL de l'image`)
      }
    }

    // Créer le jeu
    const gameResponse = await game.create({
      data: {
        name: gameBasic.name,
        metacritic: gameDetails.metacritic || 0,
        released_date: gameDetails.released ? new Date(gameDetails.released) : new Date(),
        game_media_id: mediaId,
      },
    })

    console.log(`   ✅ Jeu créé: ${gameResponse.name}`)

    // Ajouter les genres
    if (gameDetails.genres && gameDetails.genres.length > 0) {
      for (const genreData of gameDetails.genres) {
        const genreResponse = await upsertGenre(genreData)
        if (genreResponse) {
          await genreGame.create({
            data: {
              game_id: gameResponse.game_id,
              genre_id: genreResponse.genre_id,
            },
          })
        }
      }
      console.log(`   🏷️  ${gameDetails.genres.length} genres liés`)
    }

    // Ajouter les plateformes
    if (gameDetails.platforms && gameDetails.platforms.length > 0) {
      for (const platformData of gameDetails.platforms) {
        const platform = await upsertPlatform(platformData.platform.name)
        if (platform) {
          await platformGame.create({
            data: {
              game_id: gameResponse.game_id,
              platform_id: platform.platform_id,
            },
          })
        }
      }
      console.log(`   🎯 ${gameDetails.platforms.length} plateformes liées`)
    }

    return gameResponse
  } catch (error) {
    console.error(`❌ Erreur insertion ${gameBasic.name}:`, (error as Error).message)
    return null
  }
}

const clearSeeding = async () => {
  console.log("🧹 Nettoyage de la base de données...")
  await prismaClient.$transaction(async (tx) => {
    await tx.challengeLike.deleteMany()
    await tx.participationLike.deleteMany()
    await tx.userRole.deleteMany()
    await tx.genreGame.deleteMany()
    await tx.platformGame.deleteMany()
    // 2. Supprimer les entités qui dépendent d'autres
    await tx.participation.deleteMany()
    await tx.challenge.deleteMany()

    // 3. Supprimer les entités principales
    await tx.user.deleteMany()
    await tx.game.deleteMany()
    await tx.role.deleteMany()
    await tx.genre.deleteMany()
    await tx.platform.deleteMany()

    // 4. ENFIN supprimer les médias (plus de références)
    await tx.media.deleteMany()
  })
}
const seedPlatforms = async () => {
  let url = `${RAWG_BASE_URL}/platforms?key=${RAWG_API_KEY}`
  let totalInserted = 0
  while (url) {
    const { data } = await axios.get<platformAPI>(url)

    await Promise.all(
      data.results.map((item) => {
        return platform.create({
          data: {
            name: item.name,
          },
        })
      })
    )
    totalInserted += data.results.length
    url = data.next
  }
  console.log(`Created ${totalInserted} platform`)
}
const seedGenre = async () => {
  let url = `${RAWG_BASE_URL}/genres?key=${RAWG_API_KEY}`
  let totalInserted = 0

  while (url) {
    try {
      const { data } = await axios.get<typeAPI>(url)
      const results = await Promise.all(
        data.results.map(async (item) => {
          let mimetype = "image/jpeg"
          let size = 0
          try {
            const res = await fetch(item.image_background, {
              method: "HEAD",
              signal: AbortSignal.timeout(5000), // Timeout de 5s
            })
            const ct = res.headers.get("content-type")
            const cl = res.headers.get("content-length")
            if (ct) mimetype = ct
            if (cl) size = parseInt(cl, 10)
          } catch (err) {
            console.warn(`HEAD request failed for ${item.name}:`, err)
          }

          // Créer le type avec son media
          return genre.create({
            data: {
              name: item.name,
              image_background: {
                create: {
                  path: item.image_background,
                  size,
                  mimetype,
                  filename: `type-${item.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${Date.now()}.jpg`,
                  original_name: item.image_background.split("/").pop() || "image.jpg",
                },
              },
            },
            select: {
              genre_id: true,
              name: true,
            },
          })
        })
      )

      totalInserted += results.length

      console.log(`Batch inserted:${data.results.length}`)

      url = data.next
    } catch (err) {
      console.error("Error fetching page:", err)
      break
    }
  }

  console.log(`✅ Total created: ${totalInserted} types`)
  const totalCount = await genre.count()
  console.log(`📊 Total types in DB: ${totalCount}`)
}
const seedRoles = async () => {
  await prismaClient.role.createMany({
    data: [{ role_name: "ADMIN" }, { role_name: "MEMBER" }],
  })
  console.log(`✅ Created roles`)
}
const SeedUsers = async () => {
  const roles = await prismaClient.role.findMany()

  if (roles.length === 0) {
    throw new Error("No roles found. Please run seedRoles first.")
  }
  const avatars = [
    "https://i.pravatar.cc/150?img=1",
    "https://i.pravatar.cc/150?img=2",
    "https://i.pravatar.cc/150?img=3",
    "https://i.pravatar.cc/150?img=4",
    "https://i.pravatar.cc/150?img=5",
    "https://i.pravatar.cc/150?img=6",
    "https://i.pravatar.cc/150?img=7",
    "https://i.pravatar.cc/150?img=8",
    "https://i.pravatar.cc/150?img=9",
    "https://i.pravatar.cc/150?img=10",
  ]

  const users = Array.from({ length: avatars.length }).map((_, i) => ({
    pseudo: `User${i}`,
    email: `user${i}@example.com`,
    password: hashedPassword,
  }))

  for (let i = 0; i < users.length; i++) {
    const userUnique = users[i]
    const avatarUrl = avatars[i]
    let mimetype = "image/jpeg"
    let size = 0

    try {
      const res = await fetch(avatarUrl, { method: "HEAD" })
      const ct = res.headers.get("content-type")
      const cl = res.headers.get("content-length")

      if (ct) mimetype = ct
      if (cl) size = parseInt(cl, 10)
    } catch (err) {
      console.warn("HEAD request failed for", avatarUrl, err)
    }
    // Assigner 1 à 2 rôles aléatoirement
    const roleCount = Math.floor(Math.random() * 2) + 1 // 1 ou 2 rôles
    const shuffledRoles = roles.sort(() => Math.random() - 0.5)
    const selectedRoles = shuffledRoles.slice(0, roleCount)

    await prismaClient.user.create({
      data: {
        ...userUnique,
        user_avatar_media: {
          create: {
            filename: `user-${users[i].pseudo}-${Date.now()}.jpg`,
            original_name: users[i].pseudo.split("/").pop() || "image.jpg",
            mimetype: mimetype,
            size: size,
            path: avatars[i],
          },
        },
        roles: {
          create: selectedRoles.map((role) => ({ role_id: role.role_id })),
        },
      },
    })
  }
  console.log(`✅ Created ${users.length} users`)
}
const SeedGames = async () => {
  console.log("🚀 Début du seeding des jeux RAWG\n")

  try {
    // 1. Récupérer la liste des jeux
    const gamesList = await fetchGameList(GAMES_PER_REQUEST, GAMES_TO_FETCH)
    console.log(`\n✅ ${gamesList.length} jeux récupérés\n`)

    // 2. Insérer chaque jeu un par un
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < gamesList.length; i++) {
      const game = gamesList[i]
      console.log(`\n[${i + 1}/${gamesList.length}]`)

      const result = await insertGame(game)
      if (result) {
        successCount++
      } else {
        errorCount++
      }
    }

    console.log("\n\n🎉 Seeding terminé!")
    console.log(`✅ ${successCount} jeux insérés avec succès`)
    console.log(`❌ ${errorCount} erreurs`)
  } catch (error) {
    console.error("❌ Erreur fatale:", error)
  }
}
const SeedChallenges = async () => {
  const games = await game.findMany({ take: 20 })
  const users = await user.findMany({ take: 3 })
  if (games.length === 0 || users.length === 0) {
    console.log("Pas de challenges ou d’utilisateurs pour créer des participations")
    return
  }
  const sampleTitles = [
    "Speedrun Madness",
    "No Damage Run",
    "Pacifist Mode",
    "Hardcore Survival",
    "Time Attack",
    "Ironman Challenge",
    "One Weapon Only",
    "Stealth Assassin",
    "Marathon Mode",
    "Boss Rush",
  ]

  const sampleDescriptions = [
    "Complète le jeu sans perdre une seule vie.",
    "Finis le niveau en moins de 5 minutes.",
    "Utilise uniquement ton arme de départ.",
    "Survis le plus longtemps possible sans sauvegarde.",
    "Atteins le boss final avec moins de 3 items.",
    "Complète le mode difficile sans checkpoint.",
  ]

  const sampleRules = [
    "Pas de triche autorisée.",
    "Capture vidéo obligatoire.",
    "Multijoueur interdit.",
    "Difficulté minimum : Normal.",
    "Aucune pause acceptée.",
  ]

  const challenges = Array.from({ length: 100 }).map((_, index) => {
    const randomGame = games[Math.floor(Math.random() * games.length)]
    const randomUser = users[Math.floor(Math.random() * users.length)]
    return {
      title: sampleTitles[index % sampleTitles.length],
      description: sampleDescriptions[index % sampleDescriptions.length],
      rules: sampleRules[index % sampleRules.length],
      user_id: randomUser.user_id,
      game_id: randomGame.game_id,
      created_at: new Date(Date.now() - (20 - index) * 1000),
    }
  })

  await challenge.createMany({
    data: challenges,
    skipDuplicates: true,
  })
  console.log(`✅ Created ${challenges.length} challenges`)
}
const SeedParticipation = async () => {
  const [challenges, users] = await Promise.all([challenge.findMany(), user.findMany()])

  if (challenges.length === 0 || users.length === 0) {
    console.log("Pas de challenges ou d'utilisateurs pour créer des participations")
    return
  }

  const sampleTitles = ["First Try Run", "Ultimate Speedrun", "No Hit Clear", "Pro Gamer Attempt", "Clutch Finish"]

  const sampleVideos: string[] = [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com/watch?v=3JZ_D3ELwOQ",
    "https://www.youtube.com/watch?v=V-_O7nl0Ii0",
  ]

  // 🎲 Préparer toutes les participations avec un ID unique
  const participationsData = []
  let uniqueCounter = 0 // ← Compteur global

  for (const challenge of challenges) {
    const nbParticipation = Math.floor(Math.random() * 4)

    for (let i = 0; i < nbParticipation; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)]
      const randomTitle = sampleTitles[Math.floor(Math.random() * sampleTitles.length)]
      const randomVideoData = sampleVideos[Math.floor(Math.random() * sampleVideos.length)]

      participationsData.push({
        title: randomTitle,
        challenge_id: challenge.challenge_id,
        user_id: randomUser.user_id,
        participation_url: randomVideoData,
      })
    }
  }

  // 💾 Insertion en masse (par batch)
  await participation.createMany({
    data: participationsData.map((p) => ({
      title: p.title,
      challenge_id: p.challenge_id,
      user_id: p.user_id,
      participation_url: p.participation_url,
    })),
    skipDuplicates: true,
  })

  console.log(`✅ Created ${participationsData.length} participations`)
}
const SeedVoteUserChallenge = async () => {
  const [allUsers, allChallenges] = await Promise.all([user.findMany(), challenge.findMany()])
  const allVotes = allUsers.flatMap((user) => {
    const nbVotes = Math.floor(Math.random() * 20)
    const shuffleChallenges = shuffleData(allChallenges, nbVotes)

    return shuffleChallenges.map((challenge) => ({
      user_id: user.user_id,
      challenge_id: challenge.challenge_id,
    }))
  })
  await challengeLike.createMany({
    data: allVotes,
    skipDuplicates: true,
  })
  console.log(`✅ Created ${allVotes.length} challenge likes`)
}
const SeedVoteUserParticipation = async () => {
  const [allUsers, allParticipations] = await Promise.all([user.findMany(), participation.findMany()])
  const allVotes = allUsers.flatMap((user) => {
    const nbVotes = Math.floor(Math.random() * 20)
    const shuffleParticipations = shuffleData(allParticipations, nbVotes)

    return shuffleParticipations.map((participation) => ({
      user_id: user.user_id,
      participation_id: participation.participation_id,
    }))
  })
  await participationLike.createMany({
    data: allVotes,
    skipDuplicates: true,
  })
  console.log(`✅ Created ${allVotes.length} participations likes`)
}
await clearSeeding()
await seedPlatforms()
await seedGenre()
await seedRoles()
await SeedGames()
await SeedUsers()
await SeedChallenges()
await SeedParticipation()
await SeedVoteUserChallenge()
await SeedVoteUserParticipation()
console.log("🎉 Seeding completed!")
