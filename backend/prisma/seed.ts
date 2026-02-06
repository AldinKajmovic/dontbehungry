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

const FOOD_CATEGORIES = [
  { name: 'Pizza', description: 'Talijanska pizza', iconUrl: null },
  { name: 'Burgeri', description: 'Burgeri i sendviči', iconUrl: null },
  { name: 'Sushi', description: 'Japanski sushi', iconUrl: null },
  { name: 'Meksička hrana', description: 'Meksička kuhinja', iconUrl: null },
  { name: 'Kineska hrana', description: 'Kineska kuhinja', iconUrl: null },
  { name: 'Roštilj', description: 'Roštiljano meso', iconUrl: null },
  { name: 'Morski plodovi', description: 'Riba i morski plodovi', iconUrl: null },
  { name: 'Salate', description: 'Zdrave salate', iconUrl: null },
  { name: 'Vegetarijanska hrana', description: 'Vegetarijanska jela', iconUrl: null },
  { name: 'Doručak', description: 'Jutarnji obroci', iconUrl: null },
  { name: 'Deserti', description: 'Slatki deserti', iconUrl: null },
  { name: 'Pekara', description: 'Pekarski proizvodi', iconUrl: null },
  { name: 'Pića', description: 'Napitci', iconUrl: null },
  { name: 'Kafa', description: 'Kafa i espresso', iconUrl: null },
  { name: 'Tjestenina', description: 'Jela od tjestenine', iconUrl: null },
  { name: 'Ćevapi', description: 'Tradicionalni bosanski ćevapi', iconUrl: null },
  { name: 'Pite', description: 'Domaće pite', iconUrl: null },
]

const MENU_ITEMS_BY_CATEGORY: Record<string, string[]> = {
  'Pizza': [
    'Margherita', 'Pepperoni', 'Quattro Formaggi', 'Diavola', 'Capricciosa',
    'Prosciutto', 'Vegetarijanska', 'BBQ Piletina', 'Šunka i gljive', 'Tonno'
  ],
  'Burgeri': [
    'Klasični burger', 'Cheeseburger', 'BBQ burger', 'Smash burger',
    'Burger sa gljivama', 'Dupli burger', 'Ljuti burger', 'Veggie burger'
  ],
  'Sushi': [
    'California Roll', 'Dragon Roll', 'Rainbow Roll', 'Spicy Tuna Roll',
    'Salmon Nigiri', 'Tuna Nigiri', 'Eel Roll', 'Tempura Roll'
  ],
  'Meksička hrana': [
    'Tacos', 'Burrito', 'Quesadilla', 'Nachos', 'Fajitas',
    'Enchiladas', 'Chimichanga', 'Taquitos'
  ],
  'Kineska hrana': [
    'Pržena riža', 'Chow Mein', 'Kung Pao piletina', 'Slatko-kisela svinjetina',
    'Mapo Tofu', 'Proljetne rolice', 'Knedle'
  ],
  'Tjestenina': [
    'Špageti Bolognese', 'Carbonara', 'Alfredo',
    'Pesto tjestenina', 'Lazanje', 'Ravioli'
  ],
  'Salate': [
    'Caesar salata', 'Grčka salata', 'Šopska salata',
    'Salata sa piletinom', 'Sezonska salata'
  ],
  'Deserti': [
    'Čizkejk', 'Čokoladni brownie', 'Sladoled',
    'Tiramisu', 'Baklava', 'Tufahije', 'Hurmašice'
  ],
  'Pekara': [
    'Kroasan', 'Čokoladni kroasan', 'Kifla',
    'Mafin', 'Somun', 'Lepinja'
  ],
  'Pića': [
    'Coca-Cola', 'Limunada', 'Ledeni čaj',
    'Kisela voda', 'Milkshake', 'Cedevita'
  ],
  'Kafa': [
    'Espresso', 'Americano', 'Latte',
    'Cappuccino', 'Bosanska kafa', 'Turska kafa'
  ],
  'Roštilj': [
    'Ćevapi', 'Pljeskavica', 'Ražnjići', 'Kobasice',
    'Piletina sa roštilja', 'Miješano meso'
  ],
  'Pite': [
    'Burek', 'Sirnica', 'Zeljanica', 'Krompiruša',
    'Tikvenica', 'Učkur pita'
  ],
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
  await prisma.restaurantCategory.deleteMany()
  await prisma.restaurant.deleteMany()
  await prisma.category.deleteMany()
  await prisma.userAddress.deleteMany()
  await prisma.place.deleteMany()
  await prisma.user.deleteMany()

  /* PASSWORD HASHES (REUSED) */
  const customerHash = await hash('password123')
  const ownerHash = await hash('owner123')
  const driverHash = await hash('driver123')
  const adminHash = await hash('admin123')

  /* CATEGORIES */
  const categories = await Promise.all(
    FOOD_CATEGORIES.map((c) => prisma.category.create({ data: c }))
  )

  /* ADMIN */
  await prisma.user.create({
    data: {
      email: 'admin@glovo.com',
      passwordHash: adminHash,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      emailVerified: true,
      phoneVerified: true,
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
            phoneVerified: true,
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
          phoneVerified: true,
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
          rating: faker.number.float({ min: 3, max: 5 }),
          minOrderAmount: 10,
          deliveryFee: 3,
        },
      })

      restaurants.push({ id: restaurant.id, cityIndex: cityIdx })

      const assignedCategories = faker.helpers.arrayElements(
        categories,
        SEED_CONFIG.categoriesPerRestaurant
      )

      for (const c of assignedCategories) {
        await prisma.restaurantCategory.create({
          data: { restaurantId: restaurant.id, categoryId: c.id },
        })
      }

      const items: { id: string; price: number }[] = []

      for (let j = 0; j < SEED_CONFIG.menuItemsPerRestaurant; j++) {
        const c = faker.helpers.arrayElement(assignedCategories)
        const names = MENU_ITEMS_BY_CATEGORY[c.name] ?? ['Special']
        const price = faker.number.float({ min: 5, max: 30 })

        const item = await prisma.menuItem.create({
          data: {
            name: `${faker.helpers.arrayElement(names)} #${j}`,
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
          phoneVerified: true,
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
