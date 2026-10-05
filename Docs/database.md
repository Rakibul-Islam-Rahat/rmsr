# RMSR — Database Design

## 1. Database Overview

RMSR uses **MongoDB Atlas** as its primary database.

The application uses **Mongoose** for schema definition, validation, model management, and relationships between collections.

The database stores information related to:

- Users
- Restaurants
- Menu items
- Orders
- Reviews
- Notifications
- Real-time messages
- Loyalty programs
- Rider profiles

MongoDB's document-oriented structure allows RMSR to store both structured application data and nested objects such as addresses, order items, ratings, and transaction histories.

---

## 2. Collections

RMSR uses the following major collections:

| Collection | Purpose |
|---|---|
| `users` | Customer, restaurant owner, rider, and administrator accounts |
| `restaurants` | Restaurant information and business settings |
| `menuitems` | Food items offered by restaurants |
| `orders` | Customer orders and delivery information |
| `reviews` | Customer reviews and restaurant responses |
| `notifications` | User notifications |
| `messages` | Order-based real-time communication |
| `loyalties` | Loyalty tiers, points, and loyalty transactions |
| `riders` | Rider-specific profile and delivery information |

---

## 3. User Model

The `User` collection stores authentication, account, role, profile, and customer-related information.

### Main Fields

| Field | Type | Description |
|---|---|---|
| `name` | String | User's name |
| `email` | String | Unique email address |
| `phone` | String | Contact number |
| `password` | String | Hashed password |
| `role` | String | Customer, restaurant owner, rider, or admin |
| `avatar` | String | Profile image URL |
| `address` | Object | User address information |
| `isActive` | Boolean | Account activation status |
| `isVerified` | Boolean | Account verification status |
| `fcmToken` | String | Firebase Cloud Messaging token |
| `loyaltyPoints` | Number | Current loyalty points |
| `totalOrders` | Number | Total orders associated with the user |
| `totalSpent` | Number | Total amount spent |
| `otp` | String | OTP used for verification/recovery workflows |
| `otpExpire` | Date | OTP expiration time |
| `otpAttempts` | Number | Number of OTP attempts |
| `resetPasswordToken` | String | Password reset token |
| `resetPasswordExpire` | Date | Password reset token expiration |

### Roles

The system supports four user roles:

- `customer`
- `restaurant_owner`
- `rider`
- `admin`

Passwords are hashed using **bcrypt** before being stored in the database.

---

## 4. Restaurant Model

The `Restaurant` collection stores restaurant profiles, ownership information, business settings, location, and performance statistics.

### Main Fields

| Field | Type | Description |
|---|---|---|
| `owner` | ObjectId → User | Restaurant owner |
| `name` | String | Restaurant name |
| `description` | String | Restaurant description |
| `logo` | String | Restaurant logo URL |
| `coverImage` | String | Restaurant cover image URL |
| `cuisine` | Array | Supported cuisine categories |
| `address` | Object | Restaurant location and address |
| `phone` | String | Restaurant contact number |
| `email` | String | Restaurant email |
| `openingHours` | Object | Opening schedule for each day |
| `deliveryTime` | Object | Minimum and maximum estimated delivery time |
| `deliveryFee` | Number | Delivery charge |
| `minimumOrder` | Number | Minimum order amount |
| `rating` | Object | Average rating and rating count |
| `isActive` | Boolean | Restaurant active status |
| `isApproved` | Boolean | Administrative approval status |
| `isFeatured` | Boolean | Featured restaurant status |
| `totalOrders` | Number | Total restaurant orders |
| `totalRevenue` | Number | Total restaurant revenue |
| `tags` | Array | Restaurant tags |

The restaurant's `owner` field references a document from the `User` collection.

---

## 5. Menu Item Model

The `MenuItem` collection stores individual food items offered by restaurants.

### Main Fields

| Field | Type | Description |
|---|---|---|
| `restaurant` | ObjectId → Restaurant | Restaurant providing the item |
| `name` | String | Food item name |
| `description` | String | Food description |
| `price` | Number | Regular price |
| `discountedPrice` | Number | Optional discounted price |
| `image` | String | Food image URL |
| `category` | String | Food category |
| `isAvailable` | Boolean | Item availability |
| `isVeg` | Boolean | Vegetarian indicator |
| `isSpicy` | Boolean | Spicy food indicator |
| `isBestseller` | Boolean | Bestseller indicator |
| `preparationTime` | Number | Estimated preparation time |
| `calories` | Number | Calorie information |
| `allergens` | Array | Known allergens |
| `addons` | Array | Optional add-ons and prices |
| `rating` | Object | Average rating and rating count |
| `totalOrders` | Number | Number of orders containing the item |

Each menu item references its restaurant through the `restaurant` field.

---

## 6. Order Model

The `Order` collection is one of the core collections of RMSR.

It stores the complete lifecycle of a food order, including customer information, restaurant information, rider assignment, ordered items, delivery details, payment information, and delivery status.

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
| `statusHistory` | Array | Historical order status changes |
| `paymentMethod` | String | Selected payment method |
| `paymentStatus` | String | Current payment state |
| `transactionId` | String | Payment transaction identifier |
| `subtotal` | Number | Food subtotal |
| `deliveryFee` | Number | Delivery charge |
| `discount` | Number | Applied discount |
| `loyaltyPointsUsed` | Number | Loyalty points used |
| `loyaltyPointsEarned` | Number | Loyalty points earned |
| `total` | Number | Final order amount |
| `specialInstructions` | String | Customer instructions |
| `isScheduled` | Boolean | Whether the order is scheduled |
| `scheduledTime` | Date | Scheduled delivery/order time |
| `estimatedDeliveryTime` | Date | Estimated delivery time |
| `actualDeliveryTime` | Date | Actual delivery completion time |
| `cancelReason` | String | Reason for cancellation |
| `isReviewed` | Boolean | Whether the order has been reviewed |

### Order Status Flow

The order supports the following statuses:

```text
payment_pending
       ↓
payment_rejected / pending
       ↓
confirmed
       ↓
preparing
       ↓
ready_for_pickup
       ↓
picked_up
       ↓
on_the_way
       ↓
delivered
