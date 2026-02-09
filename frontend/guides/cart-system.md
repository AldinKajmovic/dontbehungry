# Shopping Cart System

This guide documents the shopping cart functionality for the Najedise food delivery application.

## Overview

The cart system allows customers to:
- Add menu items to their cart from restaurant menus
- View cart contents and totals
- Select a delivery address
- Choose a payment method (pay on delivery)
- Place orders

## Key Components

### Cart Provider (`/providers/CartProvider.tsx`)

A React Context provider that manages cart state globally across the application.

**Features:**
- Persists cart to localStorage
- Manages items, restaurant, and payment method
- Calculates subtotal, delivery fee, and total
- Enforces single-restaurant cart (prompts user if adding from different restaurant)

**Context Values:**
```typescript
interface CartContextType {
  items: CartItem[]              // Cart items
  restaurant: CartRestaurant     // Current restaurant
  paymentMethod: PaymentMethod   // CASH, CREDIT_CARD
  itemCount: number              // Total item count
  subtotal: number               // Sum of item prices
  deliveryFee: number            // Restaurant delivery fee
  tax: number                    // 20% tax on subtotal
  minOrderFee: number            // $5 fee if below minimum order amount
  total: number                  // subtotal + deliveryFee + tax + minOrderFee
  isCartOpen: boolean            // Cart drawer visibility
  addItem: Function              // Add item to cart
  removeItem: Function           // Remove item from cart
  updateQuantity: Function       // Change item quantity
  setPaymentMethod: Function     // Set payment method
  clearCart: Function            // Clear all items
  openCart/closeCart/toggleCart  // Cart drawer controls
}
```

### Cart Hook (`/hooks/useCart.ts`)

Custom hook to access cart context from any component.

**Usage:**
```typescript
import { useCart } from '@/hooks/useCart'

function MyComponent() {
  const { items, addItem, itemCount, openCart } = useCart()
  // ...
}
```

### Cart Drawer (`/components/cart/CartDrawer.tsx`)

A slide-in drawer component that displays:
- Cart items with quantity controls
- Delivery address selection with ability to add new addresses
- Payment method selection
- Order summary (subtotal, delivery fee, total)
- Place order button

**Address Management:**
- Users can select from their saved addresses
- An "Add new" button allows creating a new address directly from the cart
- The address modal reuses the same form pattern from my-profile page
- Newly created addresses are automatically selected for delivery

### Guest Banner (`/components/ui/GuestBanner.tsx`)

A dismissible banner shown on the `/restaurants` page when the user is not logged in, prompting them to create an account to place orders.

## User Flow

1. **Browse Restaurants** (`/restaurants`)
   - Guest users see a banner prompting them to sign up
   - Authenticated users see a cart icon in the header

2. **View Menu** (MealModal)
   - Click a restaurant card to open the menu modal
   - Each menu item shows a quantity selector and "Add" button (authenticated users only)
   - Adding items updates the cart count in header

3. **Different Restaurant Warning**
   - If cart has items from Restaurant A and user tries to add from Restaurant B
   - A confirmation modal appears: "Start a new order?"
   - User can keep current cart or clear and start new order

4. **Checkout** (CartDrawer)
   - Click cart icon to open drawer
   - Select delivery address from saved addresses, or click "Add new" to create one
   - The address modal allows entering: street address, city, state/province, country, postal code, and delivery notes
   - Choose payment method (Cash, Credit Card, Digital Wallet)
   - Add optional order notes
   - Click "Place Order"

5. **Order Placed**
   - Success message shown
   - Cart cleared
   - Redirect to `/orders` page

## Payment Methods

All payments are collected upon delivery:
- **CASH**: Pay with cash when order arrives
- **CREDIT_CARD**: Pay with credit card on delivery
- **DIGITAL_WALLET**: Pay with digital wallet (Apple Pay, Google Pay, etc.)

## Address Management

### Address Selection
When selecting a delivery address, any notes associated with the address (e.g., "Ring the doorbell twice", "Leave at door", "Gate code: 1234") are displayed below the address. This helps drivers find the delivery location and follow special instructions.

### In-Cart Address Creation
Users can create a new delivery address directly from the cart without leaving the checkout flow:

1. Click the "Add new" button next to the "Delivery Address" heading
2. A modal appears with a form matching the my-profile address form
3. Fill in required fields (address, city, country) and optional fields (state, postal code, delivery notes)
4. Click "Add Address" to save
5. The new address is automatically selected for the current order

This feature improves the checkout experience by eliminating the need to navigate away to add an address.

## Single Restaurant Constraint

The cart is limited to one restaurant at a time. This is enforced because:
- Each order goes to a single restaurant
- Delivery logistics are per-restaurant
- Menu items belong to specific restaurants

If a user tries to add items from a different restaurant, they must either:
1. Keep their current cart
2. Clear cart and start a new order

## Data Persistence

Cart data is stored in `localStorage` under the key `dontbehungry_cart`:
```json
{
  "items": [...],
  "restaurant": { "id": "...", "name": "...", "deliveryFee": 0, "minOrderAmount": 0 },
  "paymentMethod": "CASH"
}
```

This persists the cart across page refreshes and browser sessions.

## Minimum Order Amount & Small Order Fee

Restaurants can set a minimum order amount. If the cart subtotal is below this threshold:
- A $5 "Small Order Fee" is automatically added to the order
- The fee is displayed as a separate line item in the order summary
- An informational notice explains why the fee was applied
- Users can still place the order without adding more items

**Order Summary Display:**
```
Subtotal (3 items)      $45.00
Tax (20%)               $9.00
Delivery Fee            $3.00
Small Order Fee         $5.00    ← Only shown when below minimum
─────────────────────────────────
Total                   $62.00
```

## API Endpoint

Orders are created via:
```
POST /api/profile/orders
```

**Request Body:**
```json
{
  "restaurantId": "uuid",
  "deliveryAddressId": "uuid",
  "paymentMethod": "CASH" | "CREDIT_CARD",
  "notes": "optional notes",
  "items": [
    {
      "menuItemId": "uuid",
      "quantity": 1,
      "notes": "optional item notes"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Order placed successfully",
  "order": {
    "id": "uuid",
    "status": "PENDING",
    "totalAmount": "25.99",
    "createdAt": "2024-01-15T10:30:00Z",
    "restaurant": { "id": "uuid", "name": "Pizza Place" },
    "deliveryPlace": { "address": "123 Main St", "city": "New York" },
    "orderItems": [...],
    "payment": { "status": "PENDING", "method": "CASH" }
  }
}
```

## Error Handling

The cart drawer handles common errors:
- No delivery address selected
- Below minimum order amount
- Network/API errors during order placement
- Invalid or unavailable menu items

## Integration

The cart system is integrated in:
- `/app/layout.tsx` - CartProvider wraps the app
- `/app/restaurants/page.tsx` - Cart button, drawer, guest banner
- `/components/restaurants/MealModal.tsx` - Add to cart functionality
