import { Game, Platform, Type } from "@prisma/client"
import { prismaClient } from "./index.js"
import argon2 from "argon2"
import axios from "axios"
import { ur } from "zod/locales"
const { game, type, platform, user, challenge, participation, participationLike, challengeLike } = prismaClient
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
interface GameResponseApi {
  count: number
  next: string
  previous: string
  results: Game[]
  id: number
  title: string
  short_description: string
  thumbnail: string
  genre: string
  platform: string
}
const hashedPassword = await argon2.hash("test")
const RAWG_API_KEY = process.env.RAWG_KEY
const RAWG_BASE_URL = "https://api.rawg.io/api"
export const shuffleData = <T>(data: T[], count: number): T[] => {
  const shuffle = [...data]
  for (let index = shuffle.length - 1; index > 0; index--) {
    const j: number = Math.floor(Math.random() * (index + 1))
    ;[shuffle[index], shuffle[j]] = [shuffle[j], shuffle[index]]
  }
  return shuffle.slice(0, count)
}
const clearSeeding = async () => {
  console.log("🧹 Nettoyage de la base de données...")
  await prismaClient.$transaction(async (tx) => {
    await tx.challengeLike.deleteMany()
    await tx.participationLike.deleteMany()
    await tx.userRole.deleteMany()
    await tx.typeGame.deleteMany()
    await tx.platformGame.deleteMany()
    // 2. Supprimer les entités qui dépendent d'autres
    await tx.participation.deleteMany()
    await tx.challenge.deleteMany()

    // 3. Supprimer les entités principales
    await tx.user.deleteMany()
    await tx.game.deleteMany()
    await tx.role.deleteMany()
    await tx.type.deleteMany()
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
const seedType = async () => {
  let url = `${RAWG_BASE_URL}/genres?key=${RAWG_API_KEY}`
  let totalInserted = 0
  let mimetype = ""
  let size = 0
  while (url) {
    const { data } = await axios.get<typeAPI>(url)

    await Promise.all(
      data.results.map(async (item) => {
        try {
          const res = await fetch(item.image_background, { method: "HEAD" })
          const ct = res.headers.get("content-type")
          const cl = res.headers.get("content-length")

          if (ct) mimetype = ct
          if (cl) size = parseInt(cl, 10)
        } catch (err) {
          console.warn("HEAD request failed for", err)
        }
        return type.create({
          data: {
            name: item.name,
            image_background: {
              create: {
                path: item.image_background,
                size,
                mimetype,
                filename: `type-${item.name}-${Date.now()}.jpg`,
                original_name: item.name.split("/").pop() || "image.jpg",
              },
            },
          },
        })
      })
    )
    totalInserted += data.results.length
    url = data.next
  }
  const x = await type.findFirst({
    where: {
      type_id: 115,
    },
    select: {
      name: true,
      image_background: {
        select: {},
      },
    },
  })
  console.log(`Created ${x} types`)
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
        user_avatar: {
          create: {
            media: {
              create: {
                filename: `user-${users[i].pseudo}-${Date.now()}.jpg`,
                original_name: users[i].pseudo.split("/").pop() || "image.jpg",
                mimetype: mimetype,
                size: size,
                path: avatars[i],
                type: "IMAGE",
              },
            },
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
  const response = await fetch("https://www.freetogame.com/api/games")
  const games: GameResponseApi[] = await response.json()

  // Extraire tous les genres (split par virgule si plusieurs)
  const allGenres = games.flatMap((g) => g.genre.split(",").map((genre) => genre.trim().toLowerCase()))

  const uniqueGenres = [...new Set(allGenres.filter((g) => g.length > 0))]
  // Extraire tous les genres (split par virgule si plusieurs)
  const allPlatforms = games.flatMap((g) => g.platform.split(",").map((platform) => platform.trim().toLowerCase()))
  const uniquePlatforms = [...new Set(allPlatforms.filter((g) => g.length > 0))]

  console.log("📦 Seeding types and platforms...")
  console.log(`Found ${uniqueGenres.length} unique genres`)
  console.log(`Found ${uniquePlatforms.length} unique platforms`)

  // Créer les types (genres)
  await type.createMany({
    data: uniqueGenres.map((name) => ({ name })),
    skipDuplicates: true,
  })

  // Créer les platforms
  await platform.createMany({
    data: uniquePlatforms.map((name) => ({ name })),
    skipDuplicates: true,
  })

  // Récupérer les types et platforms avec leurs IDs
  const types = await type.findMany()
  const platforms = await platform.findMany()

  console.log("🎲 Creating games with relations...")

  // Créer les games en batch
  const batchSize = 50
  for (let i = 0; i < games.length; i += batchSize) {
    const batch = games.slice(i, i + batchSize)
    const avatarUrl = games[i].thumbnail
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

    await prismaClient.$transaction(
      batch.map((gameData) => {
        // Récupérer tous les types du jeu
        const gameGenres = gameData.genre
          .split(",")
          .map((g) => g.trim().toLowerCase())
          .filter((g) => g.length > 0)

        const gameTypes = types.filter((type) => gameGenres.includes(type.name))
        const gamePlatformArray = gameData.platform
          .split(",")
          .map((g) => g.trim().toLowerCase())
          .filter((g) => g.length > 0)
        const gamePlatform = platforms.filter((platform) => gamePlatformArray.includes(platform.name))

        return game.create({
          data: {
            title: gameData.title,
            description: gameData.short_description,
            gameImages: {
              create: {
                media: {
                  create: {
                    filename: `game-${gameData.title}-${Date.now()}.jpg`,
                    original_name: gameData.thumbnail.split("/").pop() || "image.jpg",
                    mimetype: mimetype,
                    size: size,
                    path: gameData.thumbnail,
                    type: "IMAGE",
                  },
                },
              },
            },
            ...(gameTypes.length > 0 && {
              type: {
                create: gameTypes.map((t) => ({
                  type: {
                    connect: { type_id: t.type_id },
                  },
                })),
              },
            }),
            ...(gamePlatform && {
              platform: {
                create: gamePlatform.map((plateform) => ({
                  platform: {
                    connect: { platform_id: plateform.platform_id },
                  },
                })),
              },
            }),
          },
        })
      })
    )

    console.log(`✅ Created ${Math.min(i + batchSize, games.length)}/${games.length} games`)
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

  const challenges = Array.from({ length: 20 }).map((_, index) => {
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

  // 📡 Récupérer métadonnées en parallèle
  const videoMetadata = await Promise.all(
    sampleVideos.map(async (url) => {
      try {
        const res = await fetch(url, { method: "HEAD" })
        return {
          url,
          mimetype: res.headers.get("content-type") || "video/mp4",
          size: parseInt(res.headers.get("content-length") || "0", 10),
        }
      } catch (err) {
        console.warn("HEAD request failed for", url)
        return { url, mimetype: "video/mp4", size: 0 }
      }
    })
  )

  // 🎲 Préparer toutes les participations avec un ID unique
  const participationsData = []
  let uniqueCounter = 0 // ← Compteur global

  for (const challenge of challenges) {
    const nbParticipation = Math.floor(Math.random() * 4)

    for (let i = 0; i < nbParticipation; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)]
      const randomTitle = sampleTitles[Math.floor(Math.random() * sampleTitles.length)]
      const randomVideoData = videoMetadata[Math.floor(Math.random() * videoMetadata.length)]

      participationsData.push({
        title: randomTitle,
        challenge_id: challenge.challenge_id,
        user_id: randomUser.user_id,
        video: {
          create: {
            media: {
              create: {
                size: randomVideoData.size,
                mimetype: randomVideoData.mimetype,
                type: "VIDEO" as const,
                path: randomVideoData.url,
                original_name: randomVideoData.url,
                filename: `participation-video-${Date.now()}-${uniqueCounter++}`, // ← Unique !
              },
            },
          },
        },
      })
    }
  }

  // 💾 Insertion en masse (par batch)
  const BATCH_SIZE = 50
  for (let i = 0; i < participationsData.length; i += BATCH_SIZE) {
    const batch = participationsData.slice(i, i + BATCH_SIZE)
    await Promise.all(batch.map((data) => participation.create({ data })))
  }

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
//await seedPlatforms()
await seedType()
// await seedRoles()
// await SeedGames()
// await SeedUsers()
// await SeedChallenges()
// await SeedParticipation()
// await SeedVoteUserChallenge()
// await SeedVoteUserParticipation()
console.log("🎉 Seeding completed!")
