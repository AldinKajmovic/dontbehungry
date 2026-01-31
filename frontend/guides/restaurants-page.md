# Restaurants Page Guide

This guide documents the restaurants listing page that displays all available restaurants with category filtering, search, and meal modal.

## Overview

The restaurants page (`/restaurants`) is a **public route** accessible to all users. It displays:
- Category icons with horizontal scrolling for filtering
- Restaurant cards in a responsive grid
- Search functionality
- Meal modal with categorized menu items

**Note:** The "Add to cart" button (+) on menu items is only visible to authenticated users.

## Components

### Location

```
frontend/
├── app/restaurants/page.tsx           # Main page component
├── components/restaurants/
│   ├── index.ts                       # Barrel export
│   ├── RestaurantCard.tsx             # Restaurant card component
│   ├── CategoryIcon.tsx               # Category icon button
│   └── MealModal.tsx                  # Meal details modal
└── services/public/
    ├── index.ts                       # Barrel export
    ├── types.ts                       # TypeScript types
    └── service.ts                     # API service
```

---

## RestaurantCard

A reusable card component for displaying restaurant information.

### Props

```typescript
interface RestaurantCardProps {
  restaurant: PublicRestaurant
  onClick: (restaurant: PublicRestaurant) => void
}

interface PublicRestaurant {
  id: string
  name: string
  description: string | null
  logoUrl: string | null
  coverUrl: string | null
  rating: string | number
  deliveryFee: string | number | null
  minOrderAmount: string | number | null
  categories: RestaurantCategory[]
  place: { city: string; address: string }
}
```

### Features

- Cover image with fallback gradient
- Logo overlay with fallback initial
- Discount badge (randomly displayed for demo)
- Rating display (converted to percentage)
- Delivery time (randomly generated for demo)
- Free delivery badge when deliveryFee is 0
- Category tags (max 3 displayed)
- Zoom-in hover effect on the entire card
- Zoom-in hover effect on the logo

### Usage

```tsx
import { RestaurantCard } from '@/components/restaurants'

<RestaurantCard
  restaurant={restaurant}
  onClick={(r) => setSelectedRestaurant(r)}
/>
```

---

## CategoryIcon

A button component for category filtering with icon display.

### Props

```typescript
interface CategoryIconProps {
  category: Category
  isSelected: boolean
  onClick: (categoryId: string | null) => void
}

interface Category {
  id: string
  name: string
  description: string | null
  iconUrl: string | null
}
```

### Features

- Displays category icon (from URL or fallback emoji)
- Selected state with primary color ring
- Zoom-in hover effect
- Automatic emoji mapping for common food categories

### Emoji Mapping

The component includes automatic emoji mapping for common category names:

| Category | Emoji |
|----------|-------|
| Pizza | 🍕 |
| Burger/Burgers | 🍔 |
| Chicken/Piletina | 🍗 |
| Pasta | 🍝 |
| Sandwich/Sendvici | 🥪 |
| Kebab/Halal/Doner | 🥙 |
| Dessert/Deserti | 🍰 |
| Salad/Salate | 🥗 |
| Default | 🍽️ |

### Usage

```tsx
import { CategoryIcon } from '@/components/restaurants'

<CategoryIcon
  category={category}
  isSelected={selectedCategory === category.id}
  onClick={handleCategoryClick}
/>
```

---

## MealModal

A full-screen modal for displaying restaurant menu items organized by category.

### Props

```typescript
interface MealModalProps {
  restaurant: PublicRestaurant | null
  isOpen: boolean
  onClose: () => void
  showAddButton?: boolean  // Only show add button for authenticated users
}
```

### Features

- Restaurant header with cover image and logo
- Category tabs for filtering menu items
- Menu item cards with image, description, price
- Add to cart button (only visible when `showAddButton` is true)
- Escape key to close
- Backdrop click to close
- Loading state with spinner
- Empty state message
- Fast 0.2s modal animation

### Usage

```tsx
import { MealModal } from '@/components/restaurants'

const [selectedRestaurant, setSelectedRestaurant] = useState<PublicRestaurant | null>(null)
const [isModalOpen, setIsModalOpen] = useState(false)

<MealModal
  restaurant={selectedRestaurant}
  isOpen={isModalOpen}
  onClose={() => {
    setIsModalOpen(false)
    setSelectedRestaurant(null)
  }}
/>
```

---

## Public Service

API service for fetching public restaurant data.

### Methods

```typescript
class PublicService {
  // Get paginated list of restaurants
  getRestaurants(params?: GetRestaurantsParams): Promise<PaginatedResponse<PublicRestaurant>>

  // Get single restaurant by ID
  getRestaurantById(id: string): Promise<PublicRestaurant>

  // Get all categories
  getCategories(): Promise<Category[]>

  // Get menu items for a restaurant, optionally filtered by category
  getRestaurantMenuItems(restaurantId: string, categoryId?: string): Promise<MenuCategory[]>
}

interface GetRestaurantsParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  categoryId?: string
  minRating?: number
}
```

### Usage

```tsx
import { publicService } from '@/services/public'

// Fetch restaurants
const response = await publicService.getRestaurants({
  page: 1,
  limit: 12,
  categoryId: selectedCategory,
  search: searchQuery,
})

// Fetch categories
const categories = await publicService.getCategories()

// Fetch menu items
const menuItems = await publicService.getRestaurantMenuItems(restaurantId)
```

---

## Page Features

### Authentication

The page requires authentication. Unauthenticated users are redirected to `/auth/login`.

```tsx
const { isAuthenticated, isLoading } = useAuth()

useEffect(() => {
  if (!authLoading && !isAuthenticated) {
    router.push('/auth/login')
  }
}, [authLoading, isAuthenticated, router])
```

### Category Scrolling

Categories display in a horizontally scrollable container with navigation arrows.

```tsx
const categoryScrollRef = useRef<HTMLDivElement>(null)

const scrollCategories = (direction: 'left' | 'right') => {
  if (categoryScrollRef.current) {
    const scrollAmount = 200
    categoryScrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }
}
```

### Filtering

- **Category Filter**: Click category icon to filter restaurants by category
- **Search**: Type in search bar to filter by name/description
- **Pagination**: Navigate through pages of results

---

## API Endpoints

The page uses the public API endpoints (no authentication required for API calls):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/public/restaurants` | GET | List restaurants with pagination, search, filters |
| `/api/public/restaurants/:id` | GET | Get single restaurant details |
| `/api/public/restaurants/:id/menu-items` | GET | Get menu items for a restaurant |
| `/api/public/categories` | GET | Get all categories |

---

## Styling

The page uses Tailwind CSS with the project's custom color theme:

- **Primary (Orange)**: Used for selected states, buttons, accents
- **Secondary (Green)**: Used for "free delivery" badge
- **Animations**:
  - `hover:scale-[1.02]` for card hover
  - `hover:scale-110` for icon/logo hover
  - `animate-modal-in` for fast modal appearance (0.2s scale + fade)

---

## Design Decisions

1. **Horizontal category scroll**: Matches the reference Glovo design, allows many categories without taking vertical space
2. **Card zoom effect**: Provides visual feedback on hover, indicates interactivity
3. **Modal for meals**: Keeps user on the same page while browsing menu, reduces navigation
4. **Category tabs in modal**: Allows quick navigation between meal categories
5. **Fallback icons**: Ensures categories display even without iconUrl data

---

*Last updated: January 2026*
