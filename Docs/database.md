# RMSR Database Documentation

## Overview

RMSR uses MongoDB Atlas as its primary database.

The application follows a document-based data model using Mongoose. The database is organized into collections representing users, restaurants, menu items, orders, reviews, notifications, messages, loyalty information, and riders.

---

## Database Architecture

The main collections are:

- `users`
- `restaurants`
- `menuitems`
- `orders`
- `reviews`
- `notifications`
- `messages`
- `loyalties`
- `riders`

Relationships between documents are primarily implemented using MongoDB `ObjectId` references.

---

## 1. User Collection

**Model:** `User`

The User collection stores authentication, profile, role, notification, and account-related information.

### Main Fields

| Field | Type | Description |
|---|---|---|
| `name` | String | User's name |
| `email` | String | Unique email address |
| `phone` | String | Phone number |
| `password` | String | Hashed password |
| `role` | String | `customer`, `restaurant_owner`, `rider`, or `admin` |
| `avatar` | String | Profile image URL |
| `address` | String | User address |
| `isActive` | Boolean | Account activation status |
| `isVerified` | Boolean | Account verification status |
| `fcmToken` | String | Firebase Cloud Messaging token |
| `loyaltyPoints` | Number | Current loyalty points |
| `totalOrders` | Number | Total number of orders |
| `totalSpent` | Number | Total amount spent |
| `otp` | String | Verification/reset OTP |
| `otpExpire` | Date | OTP expiration time |
| `otpAttempts` | Number | Number of OTP attempts |
| `resetPasswordToken` | String | Password reset token |
| `resetPasswordExpire` | Date | Password reset token expiration |

### Security

Passwords are hashed using bcrypt before being stored.

The password field is configured so that it is not returned in normal queries unless explicitly requested.

---

## 2. Restaurant Collection

**Model:** `Restaurant`

The Restaurant collection stores restaurant information and business statistics.

### Main Fields

| Field | Type | Description |
|---|---|---|
| `owner` | ObjectId → User | Restaurant owner |
| `name` | String | Restaurant name |
| `description` | String | Restaurant description |
| `logo` | String | Restaurant logo URL |
| `coverImage` | String | Cover image URL |
| `cuisine` | Array | Cuisine categories |
| `address` | Object | Restaurant address and coordinates |
| `phone` | String | Contact number |
| `email` | String | Contact email |
| `openingHours` | Object | Restaurant operating hours |
| `deliveryTime` | Number | Estimated delivery time |
| `deliveryFee` | Number | Delivery charge |
| `minimumOrder` | Number | Minimum order amount |
| `rating` | Number | Restaurant rating |
| `isActive` | Boolean | Restaurant availability |
| `isApproved` | Boolean | Admin approval status |
| `isFeatured` | Boolean | Featured restaurant status |
| `totalOrders` | Number | Total restaurant orders |
| `totalRevenue` | Number | Total restaurant revenue |
| `tags` | Array | Restaurant tags |

Each restaurant is associated with a User account through the `owner` reference.

---

## 3. Menu Item Collection

**Model:** `MenuItem`

The Menu Item collection stores individual food products offered by restaurants.

### Main Fields

| Field | Type | Description |
|---|---|---|
| `restaurant` | ObjectId → Restaurant | Restaurant offering the item |
| `name` | String | Food item name |
| `description` | String | Food description |
| `price` | Number | Regular price |
| `discountedPrice` | Number | Discounted price |
| `image` | String | Food image URL |
| `category` | String | Food category |
| `isAvailable` | Boolean | Item availability |
| `isVeg` | Boolean | Vegetarian status |
| `isSpicy` | Boolean | Spicy food indicator |
| `isBestseller` | Boolean | Bestseller indicator |
| `preparationTime` | Number | Estimated preparation time |
| `calories` | Number | Approximate calories |
| `allergens` | Array | Known allergens |
| `addons` | Array | Available add-ons |
| `rating` | Number | Food item rating |
| `totalOrders` | Number | Number of orders containing the item |

Each menu item belongs to one restaurant through the `restaurant` reference.

---

## 4. Order Collection

**Model:** `Order`

The Order collection is one of the central collections of RMSR. It stores complete order information from placement through delivery.

### Main Fields

| Field | Type | Description |
|---|---|---|
| `orderNumber` | String | Unique RMSR order identifier |
| `customer` | ObjectId → User | Customer placing the order |
| `restaurant` | ObjectId → Restaurant | Restaurant receiving the order |
| `rider` | ObjectId → User | Assigned delivery rider |
| `items` | Array | Ordered menu items |
| `deliveryAddress` | Object | Delivery address and coordinates |
| `status` | String | Current order status |
| `statusHistory` | Array | Previous status changes |
| `paymentMethod` | String | Selected payment method |
| `paymentStatus` | String | Payment state |
| `transactionId` | String | Payment transaction identifier |
| `subtotal` | Number | Items subtotal |
| `deliveryFee` | Number | Delivery charge |
| `discount` | Number | Applied discount |
| `loyaltyPointsUsed` | Number | Loyalty points used |
| `loyaltyPointsEarned` | Number | Loyalty points earned |
| `total` | Number | Final order amount |
| `specialInstructions` | String | Customer instructions |
| `isScheduled` | Boolean | Whether the order is scheduled |
| `scheduledTime` | Date | Scheduled order time |
| `estimatedDeliveryTime` | Date | Estimated delivery time |
| `actualDeliveryTime` | Date | Actual delivery completion time |
| `cancelReason` | String | Order cancellation reason |
| `isReviewed` | Boolean | Whether the order has been reviewed |

### Order Statuses

- `payment_pending`
- `pending`
- `confirmed`
- `preparing`
- `ready_for_pickup`
- `picked_up`
- `on_the_way`
- `delivered`
- `payment_rejected`
- `cancelled`

### Payment Methods

- `bkash`
- `nagad`
- `rocket`
- `cash_on_delivery`

### Payment Statuses

- `pending`
- `paid`
- `failed`
- `refunded`

### Order Item Structure

Each order stores a snapshot of ordered items, including:

- Menu item reference
- Item name
- Price
- Quantity
- Selected add-ons
- Subtotal

This allows the order to retain the purchase information even if the original menu item later changes.

---

## 5. Review Collection

**Model:** `Review`

The Review collection stores customer reviews and ratings for restaurants.

### Main Fields

| Field | Type | Description |
|---|---|---|
| `customer` | ObjectId → User | Customer submitting the review |
| `restaurant` | ObjectId → Restaurant | Reviewed restaurant |
| `order` | ObjectId → Order | Related order |
| `rating` | Number | Rating from 1 to 5 |
| `comment` | String | Review text |
| `images` | Array | Review image URLs |
| `reply` | String | Restaurant reply |
| `isVisible` | Boolean | Review visibility |

A review may contain up to three uploaded images.

---

## 6. Notification Collection

**Model:** `Notification`

The Notification collection stores notifications delivered to users.

### Main Fields

| Field | Type | Description |
|---|---|---|
| `user` | ObjectId → User | Notification recipient |
| `title` | String | Notification title |
| `body` | String | Notification message |
| `type` | String | Notification category |
| `data` | Mixed | Additional notification data |
| `isRead` | Boolean | Read/unread status |
| `order` | ObjectId → Order | Related order |

### Notification Types

- `order`
- `promotion`
- `payment`
- `system`
- `chat`
- `loyalty`

---

## 7. Message Collection

**Model:** `Message`

The Message collection stores real-time order-related chat messages.

### Main Fields

| Field | Type | Description |
|---|---|---|
| `order` | ObjectId → Order | Related order |
| `sender` | ObjectId → User | Message sender |
| `senderRole` | String | Sender's role |
| `message` | String | Message content |
| `isRead` | Boolean | Read/unread status |
| `attachmentUrl` | String | Optional attachment |

The message content supports up to 1000 characters.

---

## 8. Loyalty Collection

**Model:** `Loyalty`

The Loyalty collection manages the user's loyalty program information.

### Main Fields

| Field | Type | Description |
|---|---|---|
| `user` | ObjectId → User | Associated user |
| `tier` | String | Loyalty tier |
| `totalPointsEarned` | Number | Lifetime points earned |
| `totalPointsRedeemed` | Number | Lifetime points redeemed |
| `currentPoints` | Number | Current available points |
| `transactions` | Array | Loyalty point transaction history |

### Loyalty Tiers

- `Bronze`
- `Silver`
- `Gold`
- `Platinum`

### Transaction Types

- `earned`
- `redeemed`

Each loyalty transaction can contain:

- Transaction type
- Points
- Description
- Related order ID
- Transaction date

---

## 9. Rider Collection

**Model:** `Rider`

The Rider collection stores delivery-rider-specific information.

### Main Fields

| Field | Type | Description |
|---|---|---|
| `user` | ObjectId → User | Rider's user account |
| `vehicleType` | String | Bicycle, motorcycle, or car |
| `vehicleNumber` | String | Vehicle registration/number |
| `nidNumber` | String | Rider NID information |
| `isOnline` | Boolean | Rider online status |
| `isAvailable` | Boolean | Rider availability |
| `currentLocation` | Object | Current latitude and longitude |
| `totalDeliveries` | Number | Completed deliveries |
| `totalEarnings` | Number | Rider earnings |
| `rating` | Number | Rider rating |
| `isApproved` | Boolean | Admin approval status |

### Vehicle Types

- `bicycle`
- `motorcycle`
- `car`

---

## Entity Relationships

The major relationships between RMSR collections are:

- `Restaurant.owner → User`
- `MenuItem.restaurant → Restaurant`
- `Order.customer → User`
- `Order.restaurant → Restaurant`
- `Order.rider → User`
- `Review.customer → User`
- `Review.restaurant → Restaurant`
- `Review.order → Order`
- `Notification.user → User`
- `Notification.order → Order`
- `Message.order → Order`
- `Message.sender → User`
- `Loyalty.user → User`
- `Rider.user → User`

---

## Overall Relationship Structure

User
├── Restaurant
├── Rider
├── Loyalty
├── Order
├── Review
├── Notification
└── Message

Restaurant
├── MenuItem
├── Order
└── Review

Order
├── Customer
├── Restaurant
├── Rider
├── Items
├── Payment
├── Review
├── Notification
├── Message
└── Loyalty

## Data Flow Example

A typical food-ordering transaction involves multiple collections:

1. A customer selects a restaurant.
2. Menu items are loaded from the `MenuItem` collection.
3. The customer creates an `Order`.
4. The order references the customer and restaurant.
5. Payment information is associated with the order.
6. A rider can be assigned to the order.
7. Notifications are generated for relevant users.
8. Customer, restaurant, and rider communication can be stored as `Messages`.
9. Loyalty points can be earned or redeemed.
10. After delivery, the customer can submit a `Review`.

---

## Data Storage and External Services

MongoDB stores application data, while external services handle specialized storage and communication tasks.

- **MongoDB Atlas** — Primary application database
- **Cloudinary** — Image and media storage
- **Firebase Cloud Messaging** — Push notifications
- **SSLCommerz** — Online payment processing
- **Nodemailer** — Email communication

---

## Database Design Principles

The RMSR database design focuses on:

- Clear separation of application entities
- Referenced relationships between major entities
- Persistent order history
- Role-based user management
- Real-time delivery operations
- Payment and transaction tracking
- Loyalty point tracking
- Review and rating management
- Notification persistence
- Rider location and availability tracking

---

## Summary

The RMSR database is centered around the `User`, `Restaurant`, `MenuItem`, and `Order` entities.

The `Order` entity connects the major parts of the platform, including customers, restaurants, riders, payments, notifications, communication, loyalty points, and reviews.

MongoDB Atlas provides the primary data storage layer, while Cloudinary, Firebase Cloud Messaging, SSLCommerz, and Nodemailer provide supporting external services.