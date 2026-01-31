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
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})
const prisma = new PrismaClient({ adapter })

/* =========================
   CONFIG
========================= */

const SEED_CONFIG = {
  users: 20,
  restaurants: 10,
  categoriesPerRestaurant: 12,
  menuItemsPerRestaurant: 15,
  ordersPerUser: 20,
  reviewsPerRestaurant: 5,
  drivers: 30,
}

/* =========================
   DATA POOLS
========================= */

const FOOD_CATEGORIES = [
  { name: 'Pizza', description: 'Italian pizza', iconUrl: null },
  { name: 'Burgers', description: 'Burgers & sandwiches', iconUrl: null },
  { name: 'Sushi', description: 'Japanese sushi', iconUrl: null },
  { name: 'Mexican', description: 'Mexican food', iconUrl: null },
  { name: 'Chinese', description: 'Chinese cuisine', iconUrl: null },
  { name: 'Indian', description: 'Indian dishes', iconUrl: null },
  { name: 'Thai', description: 'Thai cuisine', iconUrl: null },
  { name: 'Korean', description: 'Korean cuisine', iconUrl: null },
  { name: 'Vietnamese', description: 'Vietnamese food', iconUrl: null },
  { name: 'Mediterranean', description: 'Mediterranean cuisine', iconUrl: null },
  { name: 'Greek', description: 'Greek dishes', iconUrl: null },
  { name: 'Italian', description: 'Italian cuisine', iconUrl: null },
  { name: 'French', description: 'French cuisine', iconUrl: null },
  { name: 'BBQ', description: 'Grilled meats', iconUrl: null },
  { name: 'Seafood', description: 'Fish & seafood', iconUrl: null },
  { name: 'Salads', description: 'Healthy salads', iconUrl: null },
  { name: 'Vegan', description: 'Plant based', iconUrl: null },
  { name: 'Vegetarian', description: 'Vegetarian dishes', iconUrl: null },
  { name: 'Breakfast', description: 'Morning meals', iconUrl: null },
  { name: 'Brunch', description: 'Late morning meals', iconUrl: null },
  { name: 'Desserts', description: 'Sweet desserts', iconUrl: null },
  { name: 'Bakery', description: 'Baked goods', iconUrl: null },
  { name: 'Drinks', description: 'Beverages', iconUrl: null },
  { name: 'Coffee', description: 'Coffee & espresso', iconUrl: null },
  { name: 'Street Food', description: 'Street-style food', iconUrl: null },
  { name: 'Fast Food', description: 'Quick meals', iconUrl: null },
  { name: 'Healthy', description: 'Low-calorie meals', iconUrl: null },
  { name: 'Pasta', description: 'Pasta dishes', iconUrl: null },
  { name: 'Ramen', description: 'Japanese ramen', iconUrl: null },
  { name: 'Middle Eastern', description: 'Middle Eastern food', iconUrl: null },
]

const MENU_ITEMS_BY_CATEGORY: Record<string, string[]> = {
  Pizza: [
    'Margherita', 'Pepperoni', 'Four Cheese', 'Diavola', 'Truffle',
    'Prosciutto', 'Vegetarian', 'BBQ Chicken', 'Hawaiian', 'Buffalo'
  ],
  Burgers: [
    'Classic', 'Cheeseburger', 'Bacon Burger', 'BBQ Burger', 'Smash Burger',
    'Mushroom Swiss', 'Double Stack', 'Spicy Chicken', 'Veggie Burger'
  ],
  Sushi: [
    'California Roll', 'Dragon Roll', 'Rainbow Roll', 'Spicy Tuna Roll',
    'Salmon Nigiri', 'Tuna Nigiri', 'Eel Roll', 'Tempura Roll'
  ],
  Mexican: [
    'Tacos', 'Burrito', 'Quesadilla', 'Nachos', 'Fajitas',
    'Enchiladas', 'Chimichanga', 'Taquitos'
  ],
  Chinese: [
    'Fried Rice', 'Chow Mein', 'Kung Pao Chicken', 'Sweet & Sour Pork',
    'Mapo Tofu', 'Spring Rolls', 'Dumplings'
  ],
  Indian: [
    'Butter Chicken', 'Chicken Tikka Masala', 'Biryani', 'Dal Tadka',
    'Saag Paneer', 'Rogan Josh', 'Naan'
  ],
  Thai: [
    'Pad Thai', 'Pad See Ew', 'Green Curry', 'Red Curry',
    'Massaman Curry', 'Tom Yum Soup'
  ],
  Korean: [
    'Bibimbap', 'Bulgogi', 'Kimchi Fried Rice',
    'Korean Fried Chicken', 'Japchae'
  ],
  Vietnamese: [
    'Pho Bo', 'Pho Ga', 'Banh Mi', 'Spring Rolls', 'Bun Cha'
  ],
  Mediterranean: [
    'Gyros', 'Falafel', 'Hummus Plate', 'Shawarma', 'Grilled Halloumi'
  ],
  Pasta: [
    'Spaghetti Bolognese', 'Carbonara', 'Alfredo',
    'Pesto Pasta', 'Lasagna', 'Ravioli'
  ],
  Ramen: [
    'Tonkotsu Ramen', 'Shoyu Ramen', 'Miso Ramen',
    'Spicy Ramen', 'Chicken Ramen'
  ],
  Salads: [
    'Caesar Salad', 'Greek Salad', 'Cobb Salad',
    'Quinoa Salad', 'Kale Salad'
  ],
  Desserts: [
    'Cheesecake', 'Chocolate Brownie', 'Ice Cream',
    'Tiramisu', 'Creme Brulee', 'Apple Pie'
  ],
  Bakery: [
    'Croissant', 'Pain au Chocolat', 'Bagel',
    'Muffin', 'Sourdough Bread'
  ],
  Drinks: [
    'Cola', 'Lemonade', 'Iced Tea',
    'Sparkling Water', 'Milkshake'
  ],
  Coffee: [
    'Espresso', 'Americano', 'Latte',
    'Cappuccino', 'Flat White'
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

  /* USERS */
  const customers: { id: string }[] = []
  for (let i = 0; i < SEED_CONFIG.users; i++) {
    const user = await prisma.user.create({
      data: {
        email: `user${i}@test.com`,
        passwordHash: customerHash,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        phone: faker.phone.number(),
        role: UserRole.CUSTOMER,
        emailVerified: true,
        phoneVerified: true,
      },
    })
    customers.push(user)
  }

  /* DRIVERS */
  const drivers: { id: string }[] = []
  for (let i = 0; i < SEED_CONFIG.drivers; i++) {
    drivers.push(
      await prisma.user.create({
        data: {
          email: `driver${i}@test.com`,
          passwordHash: driverHash,
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          role: UserRole.DELIVERY_DRIVER,
          emailVerified: true,
          phoneVerified: true,
        },
      })
    )
  }

  /* RESTAURANTS + MENU */
  const restaurants: { id: string }[] = []
  const menuMap = new Map<string, { id: string; price: number }[]>()

  for (let i = 0; i < SEED_CONFIG.restaurants; i++) {
    const owner = await prisma.user.create({
      data: {
        email: `owner${i}@test.com`,
        passwordHash: ownerHash,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role: UserRole.RESTAURANT_OWNER,
        emailVerified: true,
        phoneVerified: true,
      },
    })

    const place = await prisma.place.create({
      data: {
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        country: faker.location.country(),
      },
    })

    const restaurant = await prisma.restaurant.create({
      data: {
        name: `${faker.company.name()} Restaurant`,
        ownerId: owner.id,
        placeId: place.id,
        rating: faker.number.float({ min: 3, max: 5 }),
        minOrderAmount: 10,
        deliveryFee: 3,
      },
    })

    restaurants.push(restaurant)

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

  /* ADDRESSES */
  for (const c of customers) {
    const place = await prisma.place.create({
      data: {
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        country: faker.location.country(),
      },
    })

    await prisma.userAddress.create({
      data: { userId: c.id, placeId: place.id, isDefault: true },
    })
  }

  /* ORDERS */
  for (const c of customers) {
    const address = await prisma.userAddress.findFirst({
      where: { userId: c.id },
      include: { place: true },
    })
    if (!address) continue

    for (let i = 0; i < SEED_CONFIG.ordersPerUser; i++) {
      const restaurant = faker.helpers.arrayElement(restaurants)
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

  console.log('✅ Massive seed completed')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
