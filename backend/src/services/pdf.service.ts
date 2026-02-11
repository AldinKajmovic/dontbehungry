import PDFDocument from 'pdfkit'
import path from 'path'

const LOGO_PATH = path.join(__dirname, '..', 'assets', 'logo.png')

const COLORS = {
  primary: '#d9432a',
  headerBg: '#f8f9fa',
  text: '#333333',
  textLight: '#666666',
  border: '#dee2e6',
  rowEven: '#f9f9f9',
  rowOdd: '#ffffff',
}

const FONT_REGULAR = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
const FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

interface TableColumn {
  header: string
  key: string
  width: number
  align?: 'left' | 'center' | 'right'
  format?: (value: unknown) => string
}

interface ReportOptions {
  title: string
  dateRange?: { from?: Date; to?: Date }
  filters?: Record<string, string>
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return `$${num.toFixed(2)}`
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

function generateHeader(
  doc: PDFKit.PDFDocument,
  options: ReportOptions
): void {
  const startY = doc.page.margins.top

  // Logo
  try {
    doc.image(LOGO_PATH, doc.page.margins.left, startY, { width: 200, height: 200 })
  } catch {
    // If logo fails, skip it
  }

  // Brand name + report title (positioned to the right of the logo)
  const textX = doc.page.margins.left + 210

  doc.font(FONT_BOLD)
    .fontSize(14)
    .fillColor(COLORS.primary)
    .text('Najedise', textX, startY + 70, { continued: true })
    .fillColor(COLORS.text)
    .text(` — ${options.title}`)

  let infoLine = `Generated: ${formatDate(new Date())}`
  if (options.filters && Object.keys(options.filters).length > 0) {
    const filterText = Object.entries(options.filters)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ')
    if (filterText) {
      infoLine += `  |  ${truncateText(filterText, 80)}`
    }
  }

  doc.font(FONT_REGULAR)
    .fontSize(8)
    .fillColor(COLORS.textLight)
    .text(infoLine, textX)

  // Move below the logo
  doc.y = startY + 210
}

function generateTable(
  doc: PDFKit.PDFDocument,
  columns: TableColumn[],
  data: Record<string, unknown>[],
  startY?: number
): number {
  const tableTop = startY || doc.y
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
  const rowHeight = 28
  const headerHeight = 22

  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0)
  const widthMultiplier = pageWidth / totalWidth

  let currentX = doc.page.margins.left
  const columnPositions: number[] = []
  const columnWidths: number[] = []

  columns.forEach((col) => {
    columnPositions.push(currentX)
    const width = col.width * widthMultiplier
    columnWidths.push(width)
    currentX += width
  })

  // Draw header background
  doc.rect(doc.page.margins.left, tableTop, pageWidth, headerHeight)
    .fill(COLORS.primary)

  // Draw header text
  doc.font(FONT_BOLD)
    .fontSize(8)
    .fillColor('#ffffff')

  columns.forEach((col, i) => {
    const align = col.align || 'left'
    const textOptions: PDFKit.Mixins.TextOptions = {
      width: columnWidths[i] - 4,
      align,
    }
    doc.text(col.header, columnPositions[i] + 2, tableTop + 4, textOptions)
  })

  // Draw data rows
  let currentY = tableTop + headerHeight

  data.forEach((row, rowIndex) => {
    // Check if we need a new page
    if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom - 10) {
      doc.addPage()
      currentY = doc.page.margins.top

      // Redraw header on new page
      doc.rect(doc.page.margins.left, currentY, pageWidth, headerHeight)
        .fill(COLORS.primary)

      doc.font(FONT_BOLD)
        .fontSize(12)
        .fillColor('#ffffff')

      columns.forEach((col, i) => {
        const align = col.align || 'left'
        const textOptions: PDFKit.Mixins.TextOptions = {
          width: columnWidths[i] - 4,
          align,
        }
        doc.text(col.header, columnPositions[i] + 2, currentY + 4, textOptions)
      })

      currentY += headerHeight
    }

    const bgColor = rowIndex % 2 === 0 ? COLORS.rowEven : COLORS.rowOdd
    doc.rect(doc.page.margins.left, currentY, pageWidth, rowHeight)
      .fill(bgColor)

    doc.font(FONT_REGULAR)
      .fontSize(10)
      .fillColor(COLORS.text)

    columns.forEach((col, i) => {
      let value = row[col.key]

      if (col.format && value !== undefined && value !== null) {
        value = col.format(value)
      }

      const displayValue = value !== null && value !== undefined ? String(value) : '-'
      const truncated = truncateText(displayValue, Math.floor(columnWidths[i] / 4))

      const align = col.align || 'left'
      const textOptions: PDFKit.Mixins.TextOptions = {
        width: columnWidths[i] - 4,
        align,
        lineBreak: false,
      }

      doc.text(truncated, columnPositions[i] + 2, currentY + 4, textOptions)
    })

    currentY += rowHeight
  })

  return currentY
}

export function createOrdersReport(
  data: Record<string, unknown>[],
  filters?: Record<string, string>,
  dateRange?: { from?: Date; to?: Date }
): PDFKit.PDFDocument {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' })

  generateHeader(doc, {
    title: 'Orders Report',
    filters,
    dateRange,
  })

  const columns: TableColumn[] = [
    { header: 'Order ID', key: 'id', width: 80, format: (v) => String(v).slice(0, 8) + '...' },
    { header: 'Customer', key: 'customerName', width: 100 },
    { header: 'Restaurant', key: 'restaurantName', width: 100 },
    { header: 'Status', key: 'status', width: 80 },
    { header: 'Total', key: 'totalAmount', width: 60, align: 'right', format: (v) => formatCurrency(v as number | string) },
    { header: 'Payment', key: 'paymentStatus', width: 70 },
    { header: 'Driver', key: 'driverName', width: 80 },
    { header: 'Date', key: 'createdAt', width: 90, format: (v) => formatDateShort(new Date(v as string)) },
  ]

  // Transform data for display
  const transformedData = data.map((order) => ({
    id: order.id,
    customerName: order.user ? `${(order.user as { firstName: string }).firstName} ${(order.user as { lastName: string }).lastName}` : '-',
    restaurantName: order.restaurant ? (order.restaurant as { name: string }).name : '-',
    status: String(order.status).replace(/_/g, ' '),
    totalAmount: order.totalAmount,
    paymentStatus: order.payment ? (order.payment as { status: string }).status : '-',
    driverName: order.driver ? `${(order.driver as { firstName: string }).firstName} ${(order.driver as { lastName: string }).lastName}` : 'Unassigned',
    createdAt: order.createdAt,
  }))

  generateTable(doc, columns, transformedData)

  return doc
}

export function createRestaurantsReport(
  data: Record<string, unknown>[],
  filters?: Record<string, string>
): PDFKit.PDFDocument {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' })

  generateHeader(doc, {
    title: 'Restaurants Report',
    filters,
  })

  const columns: TableColumn[] = [
    { header: 'Name', key: 'name', width: 120 },
    { header: 'Owner', key: 'ownerName', width: 100 },
    { header: 'Email', key: 'email', width: 120 },
    { header: 'Phone', key: 'phone', width: 90 },
    { header: 'Rating', key: 'rating', width: 50, align: 'center' },
    { header: 'Min Order', key: 'minOrderAmount', width: 70, align: 'right', format: (v) => v ? formatCurrency(v as number | string) : '-' },
    { header: 'Delivery Fee', key: 'deliveryFee', width: 70, align: 'right', format: (v) => v ? formatCurrency(v as number | string) : '-' },
    { header: 'Location', key: 'location', width: 120 },
  ]

  const transformedData = data.map((restaurant) => ({
    name: restaurant.name,
    ownerName: restaurant.owner ? `${(restaurant.owner as { firstName: string }).firstName} ${(restaurant.owner as { lastName: string }).lastName}` : '-',
    email: restaurant.email || '-',
    phone: restaurant.phone || '-',
    rating: restaurant.rating ? parseFloat(String(restaurant.rating)).toFixed(1) : '-',
    minOrderAmount: restaurant.minOrderAmount,
    deliveryFee: restaurant.deliveryFee,
    location: restaurant.place ? `${(restaurant.place as { city: string }).city}, ${(restaurant.place as { country: string }).country}` : '-',
  }))

  generateTable(doc, columns, transformedData)

  return doc
}

export function createUsersReport(
  data: Record<string, unknown>[],
  filters?: Record<string, string>
): PDFKit.PDFDocument {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' })

  generateHeader(doc, {
    title: 'Users Report',
    filters,
  })

  const columns: TableColumn[] = [
    { header: 'Name', key: 'name', width: 120 },
    { header: 'Email', key: 'email', width: 150 },
    { header: 'Phone', key: 'phone', width: 100 },
    { header: 'Role', key: 'role', width: 100 },
    { header: 'Email Verified', key: 'emailVerified', width: 80, align: 'center' },
  ]

  const transformedData = data.map((user) => ({
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    phone: user.phone || '-',
    role: String(user.role).replace(/_/g, ' '),
    emailVerified: user.emailVerified ? 'Yes' : 'No',
  }))

  generateTable(doc, columns, transformedData)

  return doc
}

export function createReviewsReport(
  data: Record<string, unknown>[],
  filters?: Record<string, string>
): PDFKit.PDFDocument {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' })

  generateHeader(doc, {
    title: 'Reviews Report',
    filters,
  })

  const columns: TableColumn[] = [
    { header: 'Restaurant', key: 'restaurantName', width: 120 },
    { header: 'User', key: 'userName', width: 100 },
    { header: 'Rating', key: 'rating', width: 50, align: 'center' },
    { header: 'Title', key: 'title', width: 150 },
    { header: 'Content', key: 'content', width: 250 },
  ]

  const transformedData = data.map((review) => ({
    restaurantName: review.restaurant ? (review.restaurant as { name: string }).name : '-',
    userName: review.user ? `${(review.user as { firstName: string }).firstName} ${(review.user as { lastName: string }).lastName}` : '-',
    rating: `${review.rating}/5`,
    title: review.title || '-',
    content: review.content || '-',
  }))

  generateTable(doc, columns, transformedData)

  return doc
}

export function createCategoriesReport(
  data: Record<string, unknown>[]
): PDFKit.PDFDocument {
  const doc = new PDFDocument({ margin: 40, size: 'A4' })

  generateHeader(doc, {
    title: 'Categories Report',
  })

  const columns: TableColumn[] = [
    { header: 'Name', key: 'name', width: 150 },
    { header: 'Description', key: 'description', width: 300 },
  ]

  const transformedData = data.map((category) => ({
    name: category.name,
    description: category.description || '-',
  }))

  generateTable(doc, columns, transformedData)

  return doc
}

export function createMenuItemsReport(
  data: Record<string, unknown>[],
  filters?: Record<string, string>
): PDFKit.PDFDocument {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' })

  generateHeader(doc, {
    title: 'Menu Items Report',
    filters,
  })

  const columns: TableColumn[] = [
    { header: 'Name', key: 'name', width: 120 },
    { header: 'Restaurant', key: 'restaurantName', width: 100 },
    { header: 'Category', key: 'categoryName', width: 80 },
    { header: 'Price', key: 'price', width: 60, align: 'right', format: (v) => formatCurrency(v as number | string) },
    { header: 'Available', key: 'isAvailable', width: 60, align: 'center' },
    { header: 'Prep Time', key: 'preparationTime', width: 60, align: 'center', format: (v) => v ? `${v} min` : '-' },
    { header: 'Description', key: 'description', width: 180 },
  ]

  const transformedData = data.map((item) => ({
    name: item.name,
    restaurantName: item.restaurant ? (item.restaurant as { name: string }).name : '-',
    categoryName: item.category ? (item.category as { name: string }).name : '-',
    price: item.price,
    isAvailable: item.isAvailable ? 'Yes' : 'No',
    preparationTime: item.preparationTime,
    description: item.description || '-',
  }))

  generateTable(doc, columns, transformedData)

  return doc
}

export function createPlacesReport(
  data: Record<string, unknown>[],
  filters?: Record<string, string>
): PDFKit.PDFDocument {
  const doc = new PDFDocument({ margin: 40, size: 'A4' })

  generateHeader(doc, {
    title: 'Places Report',
    filters,
  })

  const columns: TableColumn[] = [
    { header: 'Address', key: 'address', width: 180 },
    { header: 'City', key: 'city', width: 100 },
    { header: 'State', key: 'state', width: 80 },
    { header: 'Country', key: 'country', width: 80 },
    { header: 'Postal Code', key: 'postalCode', width: 80 },
  ]

  const transformedData = data.map((place) => ({
    address: place.address,
    city: place.city,
    state: place.state || '-',
    country: place.country,
    postalCode: place.postalCode || '-',
  }))

  generateTable(doc, columns, transformedData)

  return doc
}

export function createCombinedReport(
  sections: {
    type: string
    title: string
    data: Record<string, unknown>[]
  }[]
): PDFKit.PDFDocument {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' })

  generateHeader(doc, {
    title: 'Combined Admin Report',
  })

  sections.forEach((section, index) => {
    // Check if we need a new page (need at least 100px for section header + some rows)
    const spaceNeeded = 100
    if (index > 0 && doc.y + spaceNeeded > doc.page.height - doc.page.margins.bottom - 40) {
      doc.addPage()
      doc.y = doc.page.margins.top
    }

    // Section header with spacing
    if (index > 0) {
      doc.y += 15 // Add spacing between sections
    }

    doc.font(FONT_BOLD)
      .fontSize(12)
      .fillColor(COLORS.primary)
      .text(section.title, doc.page.margins.left, doc.y)

    doc.y += 18 // Move past section header

    // Generate table based on section type
    let columns: TableColumn[] = []
    let transformedData: Record<string, unknown>[] = []

    switch (section.type) {
      case 'orders':
        columns = [
          { header: 'Order ID', key: 'id', width: 80, format: (v) => String(v).slice(0, 8) + '...' },
          { header: 'Customer', key: 'customerName', width: 100 },
          { header: 'Status', key: 'status', width: 80 },
          { header: 'Total', key: 'totalAmount', width: 60, align: 'right', format: (v) => formatCurrency(v as number | string) },
          { header: 'Date', key: 'createdAt', width: 90, format: (v) => formatDateShort(new Date(v as string)) },
        ]
        transformedData = section.data.map((order) => ({
          id: order.id,
          customerName: order.user ? `${(order.user as { firstName: string }).firstName} ${(order.user as { lastName: string }).lastName}` : '-',
          status: String(order.status).replace(/_/g, ' '),
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
        }))
        break

      case 'restaurants':
        columns = [
          { header: 'Name', key: 'name', width: 150 },
          { header: 'Owner', key: 'ownerName', width: 120 },
          { header: 'Rating', key: 'rating', width: 60, align: 'center' },
          { header: 'Location', key: 'location', width: 150 },
        ]
        transformedData = section.data.map((r) => ({
          name: r.name,
          ownerName: r.owner ? `${(r.owner as { firstName: string }).firstName} ${(r.owner as { lastName: string }).lastName}` : '-',
          rating: r.rating ? parseFloat(String(r.rating)).toFixed(1) : '-',
          location: r.place ? `${(r.place as { city: string }).city}, ${(r.place as { country: string }).country}` : '-',
        }))
        break

      case 'users':
        columns = [
          { header: 'Name', key: 'name', width: 150 },
          { header: 'Email', key: 'email', width: 180 },
          { header: 'Role', key: 'role', width: 100 },
        ]
        transformedData = section.data.map((u) => ({
          name: `${u.firstName} ${u.lastName}`,
          email: u.email,
          role: String(u.role).replace(/_/g, ' '),
        }))
        break

      case 'reviews':
        columns = [
          { header: 'Restaurant', key: 'restaurantName', width: 150 },
          { header: 'User', key: 'userName', width: 120 },
          { header: 'Rating', key: 'rating', width: 60, align: 'center' },
          { header: 'Title', key: 'title', width: 150 },
        ]
        transformedData = section.data.map((r) => ({
          restaurantName: r.restaurant ? (r.restaurant as { name: string }).name : '-',
          userName: r.user ? `${(r.user as { firstName: string }).firstName} ${(r.user as { lastName: string }).lastName}` : '-',
          rating: `${r.rating}/5`,
          title: r.title || '-',
        }))
        break

      case 'categories':
        columns = [
          { header: 'Name', key: 'name', width: 200 },
          { header: 'Description', key: 'description', width: 300 },
        ]
        transformedData = section.data.map((c) => ({
          name: c.name,
          description: c.description || '-',
        }))
        break

      case 'menuItems':
        columns = [
          { header: 'Name', key: 'name', width: 150 },
          { header: 'Restaurant', key: 'restaurantName', width: 120 },
          { header: 'Price', key: 'price', width: 70, align: 'right', format: (v) => formatCurrency(v as number | string) },
          { header: 'Available', key: 'isAvailable', width: 70, align: 'center' },
        ]
        transformedData = section.data.map((item) => ({
          name: item.name,
          restaurantName: item.restaurant ? (item.restaurant as { name: string }).name : '-',
          price: item.price,
          isAvailable: item.isAvailable ? 'Yes' : 'No',
        }))
        break

      case 'places':
        columns = [
          { header: 'Address', key: 'address', width: 200 },
          { header: 'City', key: 'city', width: 120 },
          { header: 'Country', key: 'country', width: 100 },
        ]
        transformedData = section.data.map((p) => ({
          address: p.address,
          city: p.city,
          country: p.country,
        }))
        break

      default:
        break
    }

    if (columns.length > 0 && transformedData.length > 0) {
      const endY = generateTable(doc, columns, transformedData)
      doc.y = endY // Update doc.y for next section
    } else {
      doc.font(FONT_REGULAR)
        .fontSize(10)
        .fillColor(COLORS.textLight)
        .text('No data available for this section.')
      doc.y += 20
    }
  })


  return doc
}

export function pdfToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.end()
  })
}
