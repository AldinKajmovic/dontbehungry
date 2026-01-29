import 'dotenv/config'
import { PrismaClient, UserRole, PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { faker } from '@faker-js/faker'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})
const prisma = new PrismaClient({ adapter })

// Configuration
const SEED_CONFIG = {
  users: 20,
  restaurants: 10,
  categoriesPerRestaurant: 3,
  menuItemsPerRestaurant: 15,
  ordersPerUser: 3,
  reviewsPerRestaurant: 8,
}

// Food categories for restaurants
const FOOD_CATEGORIES = [
  { name: 'Pizza', description: 'Italian pizza and flatbreads', iconUrl: null },
  { name: 'Burgers', description: 'Burgers and sandwiches', iconUrl: null },
  { name: 'Sushi', description: 'Japanese sushi and rolls', iconUrl: null },
  { name: 'Mexican', description: 'Tacos, burritos, and more', iconUrl: null },
  { name: 'Chinese', description: 'Chinese cuisine', iconUrl: null },
  { name: 'Indian', description: 'Indian curries and dishes', iconUrl: null },
  { name: 'Thai', description: 'Thai food and noodles', iconUrl: null },
  { name: 'Salads', description: 'Fresh salads and healthy options', iconUrl: null },
  { name: 'Desserts', description: 'Sweets and desserts', iconUrl: null },
  { name: 'Drinks', description: 'Beverages and refreshments', iconUrl: null },
]

// Menu items by category
const MENU_ITEMS_BY_CATEGORY: Record<string, string[]> = {
  Pizza: ['Margherita', 'Pepperoni', 'Four Cheese', 'Hawaiian', 'Veggie Supreme'],
  Burgers: ['Classic Burger', 'Cheese Burger', 'Bacon Burger', 'Veggie Burger', 'Double Stack'],
  Sushi: ['California Roll', 'Salmon Nigiri', 'Tuna Roll', 'Dragon Roll', 'Tempura Roll'],
  Mexican: ['Beef Tacos', 'Chicken Burrito', 'Quesadilla', 'Nachos Grande', 'Enchiladas'],
  Chinese: ['Kung Pao Chicken', 'Sweet and Sour Pork', 'Fried Rice', 'Chow Mein', 'Spring Rolls'],
  Indian: ['Butter Chicken', 'Tikka Masala', 'Biryani', 'Samosas', 'Naan Bread'],
  Thai: ['Pad Thai', 'Green Curry', 'Tom Yum Soup', 'Mango Sticky Rice', 'Thai Fried Rice'],
  Salads: ['Caesar Salad', 'Greek Salad', 'Cobb Salad', 'Garden Salad', 'Quinoa Bowl'],
  Desserts: ['Chocolate Cake', 'Cheesecake', 'Ice Cream', 'Tiramisu', 'Brownie'],
  Drinks: ['Coca Cola', 'Fresh Lemonade', 'Iced Tea', 'Smoothie', 'Coffee'],
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data
  console.log('🧹 Cleaning existing data...')
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

  // Create categories
  console.log('📁 Creating categories...')
  const categories = await Promise.all(
    FOOD_CATEGORIES.map((cat) =>
      prisma.category.create({
        data: cat,
      })
    )
  )

  // Create admin user
  console.log('👤 Creating admin user...')
  const adminPassword = await hashPassword('admin123')
  const admin = await prisma.user.create({
    data: {
      email: 'admin@glovo.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1234567890',
      role: UserRole.ADMIN,
      emailVerified: true,
      phoneVerified: true,
    },
  })

  // Create test customer
  console.log('👤 Creating test customer...')
  const testPassword = await hashPassword('test123')
  const testCustomer = await prisma.user.create({
    data: {
      email: 'customer@test.com',
      passwordHash: testPassword,
      firstName: 'Test',
      lastName: 'Customer',
      phone: '+1987654321',
      role: UserRole.CUSTOMER,
      emailVerified: true,
      phoneVerified: true,
    },
  })

  // Create customers
  console.log('👥 Creating customers...')
  const customers: { id: string }[] = [testCustomer]
  for (let i = 0; i < SEED_CONFIG.users; i++) {
    const password = await hashPassword('password123')
    const customer = await prisma.user.create({
      data: {
        email: faker.internet.email().toLowerCase(),
        passwordHash: password,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        phone: faker.phone.number(),
        role: UserRole.CUSTOMER,
        emailVerified: faker.datatype.boolean(),
        phoneVerified: faker.datatype.boolean(),
      },
    })
    customers.push(customer)
  }

  // Create restaurant owners and restaurants
  console.log('🍽️ Creating restaurants...')
  const restaurants: { id: string; placeId: string }[] = []
  const restaurantMenuItems: Map<string, { id: string; price: number }[]> = new Map()

  for (let i = 0; i < SEED_CONFIG.restaurants; i++) {
    const ownerPassword = await hashPassword('owner123')
    const owner = await prisma.user.create({
      data: {
        email: faker.internet.email().toLowerCase(),
        passwordHash: ownerPassword,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        phone: faker.phone.number(),
        role: UserRole.RESTAURANT_OWNER,
        emailVerified: true,
        phoneVerified: true,
      },
    })

    // Create place for restaurant
    const place = await prisma.place.create({
      data: {
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        country: faker.location.country(),
        postalCode: faker.location.zipCode(),
      },
    })

    // Create restaurant
    const restaurant = await prisma.restaurant.create({
      data: {
        name: faker.company.name() + ' ' + faker.helpers.arrayElement(['Kitchen', 'Grill', 'Bistro', 'Cafe', 'Restaurant']),
        description: faker.company.catchPhrase(),
        phone: faker.phone.number(),
        email: faker.internet.email().toLowerCase(),
        ownerId: owner.id,
        placeId: place.id,
        rating: faker.number.float({ min: 3, max: 5, fractionDigits: 1 }),
        minOrderAmount: faker.number.float({ min: 10, max: 25, fractionDigits: 2 }),
        deliveryFee: faker.number.float({ min: 1, max: 5, fractionDigits: 2 }),
      },
    })

    restaurants.push({ id: restaurant.id, placeId: place.id })

    // Assign random categories to restaurant
    const restaurantCategories = faker.helpers.arrayElements(categories, SEED_CONFIG.categoriesPerRestaurant)
    for (const category of restaurantCategories) {
      await prisma.restaurantCategory.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: category.id,
        },
      })
    }

    // Create opening hours (7 days)
    for (let day = 0; day < 7; day++) {
      await prisma.openingHours.create({
        data: {
          restaurantId: restaurant.id,
          dayOfWeek: day,
          openTime: '09:00',
          closeTime: '22:00',
          isClosed: day === 0, // Closed on Sunday
        },
      })
    }

    // Create menu items
    const menuItems: { id: string; price: number }[] = []
    const itemCategories = faker.helpers.arrayElements(categories, 3)

    for (let j = 0; j < SEED_CONFIG.menuItemsPerRestaurant; j++) {
      const category = faker.helpers.arrayElement(itemCategories)
      const categoryItems = MENU_ITEMS_BY_CATEGORY[category.name] || ['Special Item']
      const itemName = faker.helpers.arrayElement(categoryItems)
      const price = faker.number.float({ min: 5, max: 30, fractionDigits: 2 })

      const menuItem = await prisma.menuItem.create({
        data: {
          name: itemName + (j > 4 ? ` #${j}` : ''),
          description: faker.commerce.productDescription(),
          price: price,
          restaurantId: restaurant.id,
          categoryId: category.id,
          isAvailable: faker.datatype.boolean({ probability: 0.9 }),
          preparationTime: faker.number.int({ min: 10, max: 45 }),
        },
      })
      menuItems.push({ id: menuItem.id, price })
    }
    restaurantMenuItems.set(restaurant.id, menuItems)
  }

  // Create places for customer addresses
  console.log('📍 Creating customer addresses...')
  for (const customer of customers) {
    const place = await prisma.place.create({
      data: {
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        country: faker.location.country(),
        postalCode: faker.location.zipCode(),
      },
    })

    await prisma.userAddress.create({
      data: {
        userId: customer.id,
        placeId: place.id,
        isDefault: true,
        notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
      },
    })
  }

  // Create delivery drivers
  console.log('🚗 Creating delivery drivers...')
  const drivers: { id: string }[] = []
  for (let i = 0; i < 5; i++) {
    const driverPassword = await hashPassword('driver123')
    const driver = await prisma.user.create({
      data: {
        email: faker.internet.email().toLowerCase(),
        passwordHash: driverPassword,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        phone: faker.phone.number(),
        role: UserRole.DELIVERY_DRIVER,
        emailVerified: true,
        phoneVerified: true,
      },
    })
    drivers.push(driver)
  }

  // Create orders
  console.log('📦 Creating orders...')
  for (const customer of customers) {
    for (let i = 0; i < SEED_CONFIG.ordersPerUser; i++) {
      const restaurant = faker.helpers.arrayElement(restaurants)
      const menuItems = restaurantMenuItems.get(restaurant.id) || []

      if (menuItems.length === 0) continue

      // Get customer's address
      const customerAddress = await prisma.userAddress.findFirst({
        where: { userId: customer.id },
        include: { place: true },
      })

      if (!customerAddress) continue

      // Create delivery place (same as customer address for simplicity)
      const deliveryPlace = await prisma.place.create({
        data: {
          address: customerAddress.place.address,
          city: customerAddress.place.city,
          state: customerAddress.place.state,
          country: customerAddress.place.country,
          postalCode: customerAddress.place.postalCode,
        },
      })

      // Select random items for order
      const orderItemsData = faker.helpers.arrayElements(menuItems, faker.number.int({ min: 1, max: 4 }))

      let subtotal = 0
      const orderItems = orderItemsData.map((item) => {
        const quantity = faker.number.int({ min: 1, max: 3 })
        const totalPrice = item.price * quantity
        subtotal += totalPrice
        return {
          menuItemId: item.id,
          quantity,
          unitPrice: item.price,
          totalPrice,
          notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.2 }),
        }
      })

      const deliveryFee = faker.number.float({ min: 2, max: 5, fractionDigits: 2 })
      const tax = subtotal * 0.1
      const totalAmount = subtotal + deliveryFee + tax

      const status = faker.helpers.arrayElement(Object.values(OrderStatus))
      const driver = status !== OrderStatus.PENDING && status !== OrderStatus.CANCELLED
        ? faker.helpers.arrayElement(drivers)
        : null

      const order = await prisma.order.create({
        data: {
          userId: customer.id,
          restaurantId: restaurant.id,
          deliveryPlaceId: deliveryPlace.id,
          driverId: driver?.id,
          status,
          subtotal,
          deliveryFee,
          tax,
          totalAmount,
          notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
          estimatedDelivery: faker.date.soon({ days: 1 }),
          deliveredAt: status === OrderStatus.DELIVERED ? faker.date.recent({ days: 7 }) : null,
          orderItems: {
            create: orderItems,
          },
        },
      })

      // Create payment for order
      const paymentStatus = status === OrderStatus.CANCELLED
        ? PaymentStatus.REFUNDED
        : status === OrderStatus.DELIVERED
          ? PaymentStatus.COMPLETED
          : PaymentStatus.PENDING

      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: totalAmount,
          method: faker.helpers.arrayElement(Object.values(PaymentMethod)),
          status: paymentStatus,
        },
      })
    }
  }

  // Create reviews
  console.log('⭐ Creating reviews...')
  for (const restaurant of restaurants) {
    const reviewers = faker.helpers.arrayElements(customers, SEED_CONFIG.reviewsPerRestaurant)

    for (const reviewer of reviewers) {
      try {
        await prisma.review.create({
          data: {
            userId: reviewer.id,
            restaurantId: restaurant.id,
            rating: faker.number.int({ min: 1, max: 5 }),
            title: faker.helpers.maybe(() => faker.lorem.words({ min: 2, max: 5 }), { probability: 0.7 }),
            content: faker.helpers.maybe(() => faker.lorem.paragraph(), { probability: 0.8 }),
          },
        })
      } catch {
        // Skip if duplicate review (unique constraint)
      }
    }
  }

  console.log('✅ Seed completed successfully!')
  console.log('')
  console.log('📋 Test accounts:')
  console.log('  Admin: admin@glovo.com / admin123')
  console.log('  Customer: customer@test.com / test123')
  console.log('  All other users: password123')
  console.log('  Restaurant owners: owner123')
  console.log('  Drivers: driver123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
