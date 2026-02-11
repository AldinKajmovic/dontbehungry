import 'dotenv/config'
import {
  PrismaClient,
  UserRole,
  PaymentMethod,
  PaymentStatus,
  OrderStatus,
} from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { faker } from '@faker-js/faker'
import { fakerHR } from '@faker-js/faker'
import bcrypt from 'bcryptjs'

const localFaker = fakerHR

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})
const prisma = new PrismaClient({ adapter })

/* =========================
   CONFIG
========================= */

const SEED_CONFIG = {
  usersPerCity: 20,
  restaurantsPerCity: 10,
  categoriesPerRestaurant: 12,
  menuItemsPerRestaurant: 15,
  ordersPerUser: 20,
  reviewsPerRestaurant: 5,
  driversPerCity: 8,
}

// Sarajevo city center coordinates
const CITY_CLUSTERS = [
  { name: 'Sarajevo', country: 'Bosna i Hercegovina', lat: 43.8486, lng: 18.3564 },
]

// Generate random coordinates within ~1km of city center (to stay on roads)
function getRandomCoordsInCity(city: typeof CITY_CLUSTERS[0]): { lat: number; lng: number } {
  // ~0.009 degrees ≈ 1km - keeps points in urban areas with roads
  const latOffset = (Math.random() - 0.5) * 0.018
  const lngOffset = (Math.random() - 0.5) * 0.018
  return {
    lat: city.lat + latOffset,
    lng: city.lng + lngOffset,
  }
}

function generateStreetAddress(): string {
  const streets = [
    'Titova', 'Safvet-bega Bašagića', 'Mula Mustafe Bašeskije', 'Zelenih Beretki', 'Veljka Mladenca',
    'Maršala Tita', 'Bazar', 'Hamdije Kreševljakovića', 'Muzejski trg', 'Drvenija',
    'Obala Kulina Bana', 'Banjalučka', 'Koševska', 'Nusreta Čauševića', 'Hamza Balića',
  ]
  const streetNumber = faker.number.int({ min: 1, max: 150 })
  return `${faker.helpers.arrayElement(streets)} ${streetNumber}`
}

/* =========================
   DATA POOLS
========================= */

const RESTAURANT_LOGOS = [
  'https://storage.googleapis.com/portfolio-delivery-app/restaurants/4d962fec-5a31-49a8-9580-c8d5b6f176e7/21bce9b4-f3ca-40e0-9f12-26707b6e417f.webp',
  'https://storage.googleapis.com/portfolio-delivery-app/restaurants/4d962fec-5a31-49a8-9580-c8d5b6f176e7/74fd4ec1-3d55-4299-a5ef-5a9f9fb9da65.webp',
  'https://storage.googleapis.com/portfolio-delivery-app/restaurants/61b66e74-083d-4815-b59f-e5c85f540441/c5ad52b7-4981-490f-8cd2-98ce1d06921f.webp',
]

const RESTAURANT_IMAGES = [
  'https://storage.googleapis.com/portfolio-delivery-app/restaurants/4d962fec-5a31-49a8-9580-c8d5b6f176e7/43a51563-c421-427b-9eed-3d6148141de0.webp',
  'https://storage.googleapis.com/portfolio-delivery-app/restaurants/4d962fec-5a31-49a8-9580-c8d5b6f176e7/b069c2fa-1e22-4d85-9200-df7f4205c9e1.webp',
  'https://storage.googleapis.com/portfolio-delivery-app/restaurants/4d962fec-5a31-49a8-9580-c8d5b6f176e7/b49d3e2c-d87c-48fe-8980-8e8e5250330e.webp',
  'https://storage.googleapis.com/portfolio-delivery-app/restaurants/4d962fec-5a31-49a8-9580-c8d5b6f176e7/d4869b87-8f65-4f71-9c2a-d6e120cd9057.webp',
  'https://storage.googleapis.com/portfolio-delivery-app/restaurants/61b66e74-083d-4815-b59f-e5c85f540441/7e10e923-2aa2-4a68-a3a3-645dc645a3cc.webp',
  'https://storage.googleapis.com/portfolio-delivery-app/restaurants/61b66e74-083d-4815-b59f-e5c85f540441/9c7e3b40-8dd7-4ab6-adf8-23eccab90829.webp',
  'https://storage.googleapis.com/portfolio-delivery-app/restaurants/61b66e74-083d-4815-b59f-e5c85f540441/adba4cd8-f8f8-45da-a583-dca10017dc3d.webp',
  'https://storage.googleapis.com/portfolio-delivery-app/restaurants/61b66e74-083d-4815-b59f-e5c85f540441/c1dcf3a7-fd02-4a70-9d7f-654eb290fc15.webp',
]

const FOOD_CATEGORIES = [
  { name: 'Pizza', description: 'Talijanska pizza', iconUrl: "https://storage.googleapis.com/portfolio-delivery-app/categories/38f88229-b4ac-4896-833b-05671fb9c47b.webp" },
  { name: 'Burgeri', description: 'Burgeri i sendviči', iconUrl: "https://storage.googleapis.com/portfolio-delivery-app/categories/2e3305e3-601b-4827-acd5-ac9d65da4694.webp" },
  { name: 'Sushi', description: 'Japanski sushi', iconUrl: "https://storage.googleapis.com/portfolio-delivery-app/categories/7a0b9173-c456-4c9e-be65-4a3b614bf8e6.webp" },
  { name: 'Salate', description: 'Zdrave salate', iconUrl: "https://storage.googleapis.com/portfolio-delivery-app/categories/27d25090-8d94-4270-a6f0-b8ad47d7c63b.webp" },
  { name: 'Vegetarijanska hrana', description: 'Vegetarijanska jela', iconUrl: "https://storage.googleapis.com/portfolio-delivery-app/categories/c43e1b54-12bd-47d5-986b-3ea0664129c3.webp" },
  { name: 'Doručak', description: 'Jutarnji obroci', iconUrl: "https://storage.googleapis.com/portfolio-delivery-app/categories/326f7ad0-a955-4d38-b104-b0f68b83263c.webp" },
  { name: 'Deserti', description: 'Slatki deserti', iconUrl: "https://storage.googleapis.com/portfolio-delivery-app/categories/1719128d-c267-4c8b-8024-dce0fb0b2e77.webp" },
  { name: 'Pekara', description: 'Pekarski proizvodi', iconUrl: "https://storage.googleapis.com/portfolio-delivery-app/categories/2d89cf27-1dbf-418b-9d86-24a637e8fd88.webp" },
  { name: 'Pića', description: 'Napitci', iconUrl: "https://storage.googleapis.com/portfolio-delivery-app/categories/b2d16c31-4e5c-46cd-adc5-59b7b8fb4030.webp" },
  { name: 'Kafa', description: 'Kafa i espresso', iconUrl: "https://storage.googleapis.com/portfolio-delivery-app/categories/7f35542f-2779-4837-bd8a-82eb0318ed93.webp" },
  { name: 'Pite', description: 'Domaće pite', iconUrl: "https://storage.googleapis.com/portfolio-delivery-app/categories/b003d427-0429-479d-9f24-20802e675ff2.webp" },
]

type MenuSeedItem = {
  name: string
  imageUrl: string | null
}

const MENU_ITEMS_BY_CATEGORY: Record<string, MenuSeedItem[]> = {
  'Pizza': [
    { name: 'Margherita', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/798a9e47-f649-4fa8-b29e-f028022b48c6.webp' },
    { name: 'Pepperoni', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/2e4b8182-15e6-447b-815f-8c7955971d17.webp' },
    { name: 'Diavola', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/85588143-438f-4702-9cc2-b8d9f2227d78.webp' },
    { name: 'Capricciosa', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/8a377413-61c4-4a6e-a505-cee7c8d572b4.webp' },
    { name: 'Tonno', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/51a598a4-4c06-4af0-9500-5d4f7aa77e17.webp' },
  ],
  'Burgeri': [
    { name: 'Klasični burger', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/55b8a603-f7ae-4851-858d-0ea783b88af7.webp' },
    { name: 'Cheeseburger', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/03b1e2db-9018-4936-ab7a-c7948a53f847.webp' },
    { name: 'BBQ burger', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/55b8a603-f7ae-4851-858d-0ea783b88af7.webp' },
    { name: 'Dupli burger', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/6080eaf0-f233-4211-859b-09490127f0da.webp' },
    { name: 'Ljuti burger', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/55b8a603-f7ae-4851-858d-0ea783b88af7.webp' },
  ],
  'Sushi': [
    { name: 'California Roll', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/937de43f-2072-44b6-8c54-7f96797251cd.webp' },
    { name: 'Dragon Roll', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/a30bb2f1-2da2-403c-bdeb-46829e1f5875.webp' },
    { name: 'Rainbow Roll', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/4a7d6d69-b950-47ba-9cb7-e94a50c274b5.webp' },
    { name: 'Salmon Nigiri', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/c0ae1571-3d0c-48bd-a115-91b505bd3725.webp' },
  ],
  'Salate': [
    { name: 'Caesar salata', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/bc904b33-b4f6-48fe-80ab-c196bab39fc7.webp' },
    { name: 'Grčka salata', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/425b7677-7f1a-4f87-b4f3-641e1ad584db.webp' },
    { name: 'Šopska salata', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/900ca628-12ee-450f-9f0b-79a728f12aef.webp' },
    { name: 'Sezonska salata', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/1b91f185-905d-469b-b1a9-c9aff1f7ae94.webp' },
  ],
  'Deserti': [
    { name: 'Čizkejk', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/636eebc8-6be1-4e77-847b-6cf438dc5b43.webp' },
    { name: 'Čokoladni brownie', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/5b1c4277-103e-4263-ad3a-1a165353ad96.webp' },
    { name: 'Sladoled', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/5476ad6b-1856-4008-bb51-fda8fa70a95b.webp' },
    { name: 'Baklava', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/9bfd05e9-f3a0-4350-9ddb-ed6a06dfcd41.webp' },
  ],
  'Pekara': [
    { name: 'Kroasan', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/0610f1d9-91ea-4b81-8700-f52e9f7710f9.webp' },
    { name: 'Kifla', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/5afa15e7-4546-43fa-aaf7-8035ae11e3b8.webp' },
    { name: 'Somun', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/26837817-fff8-4564-bb2f-7a1f8bf47aee.webp' },
  ],
  'Pića': [
    { name: 'Coca-Cola', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/d743e5f3-6cf9-44c1-8160-7251eac9934c.webp' },
    { name: 'Limunada', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/b87893e2-f533-4d66-b200-41224bfae655.webp' },
    { name: 'Ledeni čaj', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/2cd9fccc-56e8-4bc2-9139-1e232614a873.webp' },
    { name: 'Mineralna voda', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/6aa40601-2dd6-4973-a788-2c2e4950a66e.webp' },
  ],
  'Kafa': [
    { name: 'Espresso', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/16785061-63aa-4545-af89-131bdae38188.webp' },
    { name: 'Americano', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/fe46660c-3b2e-452f-8b2e-dac0a36ac62c.webp' },
    { name: 'Iced Matcha Latte', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/70cafcd8-f513-4976-8c28-1d1cc5468e55.webp' },
    { name: 'Bosanska kafa', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/57f8598e-d016-4fc2-bfaf-6287c3840bee.webp' },
  ],
  'Pite': [
    { name: 'Burek', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/c06a7b7b-c88c-48a0-83fb-21287aa42e81.webp' },
    { name: 'Sirnica', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/d08986c8-3e21-4553-81c6-8586d1a227e7.webp' },
    { name: 'Zeljanica', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/d08986c8-3e21-4553-81c6-8586d1a227e7.webp' },
    { name: 'Krompiruša', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/d08986c8-3e21-4553-81c6-8586d1a227e7.webp' },
    { name: 'Tikvenica', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/d08986c8-3e21-4553-81c6-8586d1a227e7.webp' },
    { name: 'Učkur pita', imageUrl: 'https://storage.googleapis.com/portfolio-delivery-app/menu-items/d08986c8-3e21-4553-81c6-8586d1a227e7.webp' },
  ]
}


/* =========================
   UTIL
========================= */

const hash = (pwd: string) => bcrypt.hash(pwd, 12)

/* =========================
   SEED
========================= */

async function main() {
  console.log('🌱 Massive seed started')

  /* CLEAN */
  await prisma.payment.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.review.deleteMany()
  await prisma.menuItem.deleteMany()
  await prisma.openingHours.deleteMany()
  await prisma.restaurantImage.deleteMany()
  await prisma.restaurantCategory.deleteMany()
  await prisma.restaurant.deleteMany()
  await prisma.category.deleteMany()
  await prisma.userAddress.deleteMany()
  await prisma.place.deleteMany()
  await prisma.user.deleteMany()

  /* PASSWORD HASHES (REUSED) — required env variables */
  const requiredSeedVars = ['SEED_CUSTOMER_PASSWORD', 'SEED_OWNER_PASSWORD', 'SEED_DRIVER_PASSWORD', 'SEED_ADMIN_PASSWORD'] as const
  const missingSeedVars = requiredSeedVars.filter((v) => !process.env[v])
  if (missingSeedVars.length > 0) {
    throw new Error(`Missing required seed environment variables: ${missingSeedVars.join(', ')}`)
  }

  const customerHash = await hash(process.env.SEED_CUSTOMER_PASSWORD!)
  const ownerHash = await hash(process.env.SEED_OWNER_PASSWORD!)
  const driverHash = await hash(process.env.SEED_DRIVER_PASSWORD!)
  const adminHash = await hash(process.env.SEED_ADMIN_PASSWORD!)

  /* CATEGORIES */
  const categories = await Promise.all(
    FOOD_CATEGORIES.map((c) => prisma.category.create({ data: c }))
  )

  const mappedCategories = categories.filter(
    (c) => (MENU_ITEMS_BY_CATEGORY[c.name]?.length ?? 0) > 0
  )
  if (mappedCategories.length === 0) {
    throw new Error('No menu items defined for the available categories')
  }

  /* ADMIN */
  await prisma.user.create({
    data: {
      email: 'admin@najedise.com',
      passwordHash: adminHash,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      emailVerified: true,
      avatarUrl:'https://storage.cloud.google.com/portfolio-delivery-app/avatars/18cab87d-6fd2-48e2-b153-cc3816339a90/36c73ec3-f6e0-49f7-847b-abf1d0e7a2fb.webp'
    },
  })

  /* SEED BY CITY CLUSTERS */
  const customers: { id: string; cityIndex: number }[] = []
  const drivers: { id: string }[] = []
  const restaurants: { id: string; cityIndex: number }[] = []
  const menuMap = new Map<string, { id: string; price: number }[]>()

  let userIndex = 0
  let driverIndex = 0
  let ownerIndex = 0

  for (let cityIdx = 0; cityIdx < CITY_CLUSTERS.length; cityIdx++) {
    const city = CITY_CLUSTERS[cityIdx]
    console.log(`\n🏙️  Seeding ${city.name}...`)

    /* DRIVERS for this city */
    for (let i = 0; i < SEED_CONFIG.driversPerCity; i++) {
      drivers.push(
        await prisma.user.create({
          data: {
            email: `driver${driverIndex}@test.com`,
            passwordHash: driverHash,
            firstName: localFaker.person.firstName(),
            lastName: localFaker.person.lastName(),
            phone: localFaker.phone.number(),
            role: UserRole.DELIVERY_DRIVER,
            emailVerified: true,
            avatarUrl:'https://storage.googleapis.com/portfolio-delivery-app/avatars/b6e1e90d-b121-49ea-8580-b460a9835417/e6e8d586-88a6-450d-a8f7-981cd39391b7.webp'
          },
        })
      )
      driverIndex++
    }

    /* RESTAURANTS for this city */
    console.log(`  📍 Creating ${SEED_CONFIG.restaurantsPerCity} restaurants in ${city.name}...`)
    for (let i = 0; i < SEED_CONFIG.restaurantsPerCity; i++) {
      const owner = await prisma.user.create({
        data: {
          email: `owner${ownerIndex}@test.com`,
          passwordHash: ownerHash,
          firstName: localFaker.person.firstName(),
          lastName: localFaker.person.lastName(),
          phone: localFaker.phone.number(),
          role: UserRole.RESTAURANT_OWNER,
          emailVerified: true,
          avatarUrl:'https://storage.googleapis.com/portfolio-delivery-app/avatars/a4a54859-0fc4-4c6b-b1c8-626b974c9e16/49916aa0-95f6-42ee-9a7e-f37a38c1fdaa.webp'
        },
      })
      ownerIndex++

      const coords = getRandomCoordsInCity(city)
      const place = await prisma.place.create({
        data: {
          address: generateStreetAddress(),
          city: city.name,
          country: city.country,
          latitude: coords.lat,
          longitude: coords.lng,
        },
      })

      const restaurant = await prisma.restaurant.create({
        data: {
          name: `${localFaker.company.name()} Restoran`,
          ownerId: owner.id,
          placeId: place.id,
          logoUrl: faker.helpers.arrayElement(RESTAURANT_LOGOS),
          coverUrl: faker.helpers.arrayElement(RESTAURANT_IMAGES),
          rating: faker.number.float({ min: 3, max: 5 }),
          minOrderAmount: 10,
          deliveryFee: 3,
        },
      })

      restaurants.push({ id: restaurant.id, cityIndex: cityIdx })

      // Gallery images: 5 random images
      const galleryImages = faker.helpers.arrayElements(RESTAURANT_IMAGES, 5)
      for (let gi = 0; gi < galleryImages.length; gi++) {
        await prisma.restaurantImage.create({
          data: {
            restaurantId: restaurant.id,
            imageUrl: galleryImages[gi],
            sortOrder: gi,
          },
        })
      }

      // Opening hours with randomized schedules
      const openTimes = ['07:00', '08:00', '09:00', '10:00', '11:00']
      const closeTimes = ['20:00', '21:00', '22:00', '23:00', '00:00']
      const baseOpen = faker.helpers.arrayElement(openTimes)
      const baseClose = faker.helpers.arrayElement(closeTimes)

      // Pick a schedule pattern
      const schedulePattern = faker.helpers.arrayElement([
        'every_day',
        'closed_sunday',
        'closed_sunday',
        'closed_sat_sun',
        'closed_monday',
      ])

      const closedDays = new Set<number>()
      if (schedulePattern === 'closed_sunday') closedDays.add(6)
      if (schedulePattern === 'closed_sat_sun') { closedDays.add(5); closedDays.add(6) }
      if (schedulePattern === 'closed_monday') closedDays.add(0)

      for (let day = 0; day < 7; day++) {
        const isClosed = closedDays.has(day)
        // Weekends may open an hour later
        let dayOpen = baseOpen
        if (!isClosed && (day === 5 || day === 6) && Math.random() > 0.5) {
          const idx = openTimes.indexOf(baseOpen)
          dayOpen = openTimes[Math.min(idx + 1, openTimes.length - 1)]
        }

        await prisma.openingHours.create({
          data: {
            restaurantId: restaurant.id,
            dayOfWeek: day,
            openTime: isClosed ? '00:00' : dayOpen,
            closeTime: isClosed ? '00:00' : baseClose,
            isClosed,
          },
        })
      }

      const assignedCategories = faker.helpers.arrayElements(
        mappedCategories,
        Math.min(SEED_CONFIG.categoriesPerRestaurant, mappedCategories.length)
      )

      for (const c of assignedCategories) {
        await prisma.restaurantCategory.create({
          data: { restaurantId: restaurant.id, categoryId: c.id },
        })
      }

      const items: { id: string; price: number }[] = []

      for (let j = 0; j < SEED_CONFIG.menuItemsPerRestaurant; j++) {
        const c = faker.helpers.arrayElement(assignedCategories)
        const categoryMenu = MENU_ITEMS_BY_CATEGORY[c.name]
        if (!categoryMenu || !categoryMenu.length) {
          continue
        }
        const menuTemplate = faker.helpers.arrayElement(categoryMenu)
        const price = faker.number.float({ min: 5, max: 30 })

        const item = await prisma.menuItem.create({
          data: {
            name: `${menuTemplate.name} #${j}`,
            imageUrl: menuTemplate.imageUrl,
            price,
            restaurantId: restaurant.id,
            categoryId: c.id,
            isAvailable: true,
            preparationTime: faker.number.int({ min: 5, max: 45 }),
          },
        })

        items.push({ id: item.id, price })
      }

      menuMap.set(restaurant.id, items)
    }

    /* USERS + ADDRESSES for this city */
    console.log(`  👥 Creating ${SEED_CONFIG.usersPerCity} users in ${city.name}...`)
    for (let i = 0; i < SEED_CONFIG.usersPerCity; i++) {
      const user = await prisma.user.create({
        data: {
          email: `user${userIndex}@test.com`,
          passwordHash: customerHash,
          firstName: localFaker.person.firstName(),
          lastName: localFaker.person.lastName(),
          phone: localFaker.phone.number(),
          role: UserRole.CUSTOMER,
          emailVerified: true,
          avatarUrl:'https://storage.googleapis.com/portfolio-delivery-app/avatars/2f7eaf58-38a2-4c05-9f6c-ff7ade551c60/376a86f3-713a-47a7-bf13-51c41d773229.webp'
        },
      })
      customers.push({ id: user.id, cityIndex: cityIdx })
      userIndex++

      // Create address near this city
      const coords = getRandomCoordsInCity(city)
      const place = await prisma.place.create({
        data: {
          address: generateStreetAddress(),
          city: city.name,
          country: city.country,
          latitude: coords.lat,
          longitude: coords.lng,
        },
      })

      await prisma.userAddress.create({
        data: { userId: user.id, placeId: place.id, isDefault: true },
      })
    }
  }

  /* ORDERS */
  console.log('\n📦 Creating orders...')
  for (const c of customers) {
    const address = await prisma.userAddress.findFirst({
      where: { userId: c.id },
      include: { place: true },
    })
    if (!address) continue

    // Get restaurants in the same city as this user
    const cityRestaurants = restaurants.filter((r) => r.cityIndex === c.cityIndex)

    for (let i = 0; i < SEED_CONFIG.ordersPerUser; i++) {
      const restaurant = faker.helpers.arrayElement(cityRestaurants)
      const menuItems = menuMap.get(restaurant.id)!
      const picked = faker.helpers.arrayElements(menuItems, 3)

      let subtotal = 0
      const orderItems = picked.map((m) => {
        const qty = faker.number.int({ min: 1, max: 3 })
        const total = m.price * qty
        subtotal += total
        return {
          menuItemId: m.id,
          quantity: qty,
          unitPrice: m.price,
          totalPrice: total,
        }
      })

      const status = faker.helpers.arrayElement(Object.values(OrderStatus))
      const driver =
        status === OrderStatus.PENDING || status === OrderStatus.CANCELLED
          ? null
          : faker.helpers.arrayElement(drivers)

      const order = await prisma.order.create({
        data: {
          userId: c.id,
          restaurantId: restaurant.id,
          deliveryPlaceId: address.placeId,
          driverId: driver?.id,
          status,
          subtotal,
          deliveryFee: 3,
          tax: subtotal * 0.1,
          totalAmount: subtotal * 1.1 + 3,
          orderItems: { create: orderItems },
        },
      })

      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: order.totalAmount,
          method: faker.helpers.arrayElement(Object.values(PaymentMethod)),
          status:
            status === OrderStatus.DELIVERED
              ? PaymentStatus.COMPLETED
              : PaymentStatus.PENDING,
        },
      })
    }
  }

  /* REVIEWS */
  const reviewTitles = [
    'Amazing food!',
    'Great experience',
    'Will order again',
    'Delicious meals',
    'Fast delivery',
    'Good quality',
    'Highly recommend',
    'Perfect dinner',
    'Loved it!',
    'Excellent service',
    'Tasty and fresh',
    'Best in town',
    'Decent food',
    'Not bad',
    'Could be better',
    'Average experience',
    'Disappointing',
  ]

  const reviewContents = [
    'The food was absolutely delicious and arrived hot. Will definitely order again!',
    'Great portion sizes and authentic flavors. The delivery was quick too.',
    'One of the best meals I\'ve had delivered. Everything was fresh and tasty.',
    'Really enjoyed the food quality. The packaging kept everything in perfect condition.',
    'Exceeded my expectations! The flavors were incredible and well-balanced.',
    'Good food but delivery took a bit longer than expected. Still worth it though.',
    'Solid choice for a weeknight dinner. Will be ordering from here regularly.',
    'The dishes were flavorful and the portions were generous. Great value for money.',
    'Fast delivery and the food was still hot when it arrived. Very satisfied!',
    'Tried this place for the first time and was impressed. Great menu variety.',
    'The food was okay but nothing special. Might try again with different items.',
    'Decent quality but I\'ve had better. The delivery was prompt at least.',
    'Not my favorite but the price was reasonable. Average overall experience.',
  ]

  for (const restaurant of restaurants) {
    // Get customers who have ordered from this restaurant
    const ordersFromRestaurant = await prisma.order.findMany({
      where: { restaurantId: restaurant.id },
      select: { userId: true },
      distinct: ['userId'],
      take: SEED_CONFIG.reviewsPerRestaurant,
    })

    for (const order of ordersFromRestaurant) {
      const rating = faker.number.int({ min: 1, max: 5 })

      // Higher ratings get positive titles/content, lower get negative
      const titlePool = rating >= 4
        ? reviewTitles.slice(0, 12)
        : rating >= 3
          ? reviewTitles.slice(10, 16)
          : reviewTitles.slice(14)

      const contentPool = rating >= 4
        ? reviewContents.slice(0, 10)
        : reviewContents.slice(10)

      await prisma.review.create({
        data: {
          userId: order.userId,
          restaurantId: restaurant.id,
          rating,
          title: faker.helpers.arrayElement(titlePool),
          content: faker.helpers.arrayElement(contentPool),
        },
      })
    }
  }

  console.log('✅ Massive seed completed')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
