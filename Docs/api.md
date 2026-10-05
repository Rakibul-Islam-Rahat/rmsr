# RMSR API Documentation

## Overview

RMSR provides a RESTful API built with Node.js and Express.js.

The API uses JWT-based authentication and role-based authorization for protected resources.

Base API URL:

https://rmsr-food-backend.onrender.com/api

> Replace the base URL with the actual backend deployment URL when running the project in another environment.

---

## Authentication

Most protected endpoints require a JWT token.

The token should be sent using the `Authorization` header:

    Authorization: Bearer <JWT_TOKEN>

### Authentication Roles

RMSR supports the following user roles:

- `customer`
- `restaurant_owner`
- `rider`
- `admin`

---

# 1. Authentication API

Base path:

    /api/auth

### Register

    POST /api/auth/register

Creates a new customer account.

### Login

    POST /api/auth/login

Authenticates a user and returns authentication information.

### Get Current User

    GET /api/auth/me

**Authentication:** Required

Returns the currently authenticated user's information.

### Update Profile

    PUT /api/auth/profile

**Authentication:** Required

Updates user profile information and can handle avatar uploads.

### Change Password

    PUT /api/auth/change-password

**Authentication:** Required

Changes the authenticated user's password.

### Update FCM Token

    PUT /api/auth/fcm-token

**Authentication:** Required

Updates the Firebase Cloud Messaging token used for push notifications.

### Forgot Password

    POST /api/auth/forgot-password

Starts the password recovery process.

### Verify OTP

    POST /api/auth/verify-otp

Verifies the OTP generated during password recovery.

### Reset Password

    POST /api/auth/reset-password

Resets the user's password after successful verification.

---

# 2. Restaurant API

Base path:

    /api/restaurants

### Get Restaurants

    GET /api/restaurants

Returns available restaurants.

### Get Featured Restaurants

    GET /api/restaurants/featured

Returns featured restaurants.

### Get My Restaurant

    GET /api/restaurants/my

**Authentication:** Required  
**Role:** `restaurant_owner`

Returns the restaurant associated with the authenticated owner.

### Toggle Restaurant Status

    PATCH /api/restaurants/toggle-status

**Authentication:** Required  
**Role:** `restaurant_owner`

Changes the restaurant's open/closed status.

### Create Restaurant

    POST /api/restaurants

**Authentication:** Required  
**Role:** `restaurant_owner`

Creates a restaurant profile.

Supports restaurant logo and cover image uploads.

### Update Restaurant

    PUT /api/restaurants

**Authentication:** Required  
**Role:** `restaurant_owner`

Updates restaurant information and images.

### Get Restaurant Earnings

    GET /api/restaurants/earnings

**Authentication:** Required  
**Role:** `restaurant_owner`

Returns restaurant earnings information.

### Get Restaurant by ID

    GET /api/restaurants/:id

Returns information about a specific restaurant.

---

# 3. Menu API

Base path:

    /api/menu

### Get Restaurant Menu

    GET /api/menu/restaurant/:restaurantId

Returns menu items belonging to a restaurant.

### Create Menu Item

    POST /api/menu

**Authentication:** Required  
**Role:** `restaurant_owner` or `admin`

Creates a new menu item.

Supports image upload.

### Update Menu Item

    PUT /api/menu/:id

**Authentication:** Required  
**Role:** `restaurant_owner` or `admin`

Updates an existing menu item.

### Delete Menu Item

    DELETE /api/menu/:id

**Authentication:** Required  
**Role:** `restaurant_owner` or `admin`

Deletes a menu item.

### Toggle Menu Item Availability

    PATCH /api/menu/:id/toggle

**Authentication:** Required  
**Role:** `restaurant_owner` or `admin`

Changes the availability status of a menu item.

---

# 4. Order API

Base path:

    /api/orders

### Create Order

    POST /api/orders

**Authentication:** Required  
**Role:** `customer`

Creates a new food order.

### Get My Orders

    GET /api/orders/my

**Authentication:** Required  
**Role:** `customer`

Returns orders belonging to the authenticated customer.

### Get Restaurant Orders

    GET /api/orders/restaurant

**Authentication:** Required  
**Role:** `restaurant_owner`

Returns orders associated with the owner's restaurant.

### Get Order by ID

    GET /api/orders/:id

**Authentication:** Required

Returns detailed information about a specific order.

### Update Order Status

    PUT /api/orders/:id/status

**Authentication:** Required

Used by authorized restaurant owners, admins, and riders to update order status.

Typical order statuses include:

- `payment_pending`
- `pending`
- `confirmed`
- `preparing`
- `ready_for_pickup`
- `picked_up`
- `on_the_way`
- `delivered`
- `cancelled`

### Cancel Order

    PUT /api/orders/:id/cancel

**Authentication:** Required  
**Role:** `customer`

Allows a customer to cancel an eligible order.

---

# 5. Payment API

Base path:

    /api/payments

### Initiate Payment

    POST /api/payments/initiate

**Authentication:** Required

Starts the online payment process.

### Payment Success

    GET /api/payments/success

Handles the successful payment callback.

### Payment Failure

    GET /api/payments/fail

Handles failed payment callbacks.

### Payment Cancellation

    GET /api/payments/cancel

Handles cancelled payment callbacks.

### Verify Payment

    GET /api/payments/verify/:orderId

**Authentication:** Required

Verifies payment information for an order.

---

# 6. Review API

Base path:

    /api/reviews

### Create Review

    POST /api/reviews

**Authentication:** Required  
**Role:** `customer`

Creates a review for a completed order.

Supports up to three review images.

### Get Restaurant Reviews

    GET /api/reviews/restaurant/:restaurantId

Returns reviews associated with a restaurant.

---

# 7. Notification API

Base path:

    /api/notifications

### Get Notifications

    GET /api/notifications

**Authentication:** Required

Returns notifications for the authenticated user.

### Mark All Notifications as Read

    PUT /api/notifications/read-all

**Authentication:** Required

Marks all notifications as read.

### Mark Notification as Read

    PUT /api/notifications/:id/read

**Authentication:** Required

Marks a specific notification as read.

---

# 8. Chat API

Base path:

    /api/chat

### Get Order Messages

    GET /api/chat/:orderId

**Authentication:** Required

Returns messages associated with an order.

### Send Message

    POST /api/chat

**Authentication:** Required

Creates a new order-related message.

---

# 9. Loyalty API

Base path:

    /api/loyalty

### Get Loyalty Information

    GET /api/loyalty

**Authentication:** Required  
**Role:** `customer`

Returns the authenticated customer's loyalty information and points.

---

# 10. Rider API

Base path:

    /api/rider

All rider endpoints require authentication and the `rider` role.

### Get Rider Orders

    GET /api/rider/orders

Returns orders associated with the rider.

### Get Available Orders

    GET /api/rider/available

Returns orders available for rider assignment.

### Accept Order

    POST /api/rider/orders/:id/accept

Allows a rider to accept an available delivery order.

### Update Rider Location

    PUT /api/rider/location

Updates the rider's current GPS location.

### Toggle Online Status

    PATCH /api/rider/toggle-online

Changes the rider's online/offline status.

### Get Rider Status

    GET /api/rider/status

Returns the rider's current status and availability information.

---

# 11. Recommendation API

Base path:

    /api/recommendations

### Get Recommendations

    GET /api/recommendations

**Authentication:** Required

Returns food recommendations for the authenticated user.

---

# 12. Admin API

Base path:

    /api/admin

All admin endpoints require:

- Authentication
- `admin` role

### Get Dashboard Statistics

    GET /api/admin/dashboard

Returns platform-level dashboard statistics.

### Get Users

    GET /api/admin/users

Returns users managed by the platform.

### Toggle User Status

    PATCH /api/admin/users/:id/toggle

Activates or deactivates a user account.

### Approve Restaurant

    PATCH /api/admin/restaurants/:id/approve

Approves a restaurant registration.

### Get Restaurants

    GET /api/admin/restaurants

Supports query parameters such as:

- `approved`
- `page`
- `limit`

Example:

    GET /api/admin/restaurants?approved=true&page=1&limit=20

### Feature or Unfeature Restaurant

    PATCH /api/admin/restaurants/:id/feature

Updates the featured status of a restaurant.

Request body:

    {
      "featured": true
    }

### Get Orders

    GET /api/admin/orders

Supports query parameters such as:

- `status`
- `page`
- `limit`

Example:

    GET /api/admin/orders?status=delivered&page=1&limit=20

### Verify Payment

    POST /api/admin/orders/:id/verify-payment

Verifies a pending payment and updates the associated order.

### Reject Payment

    POST /api/admin/orders/:id/reject-payment

Rejects a payment associated with an order.

Request body:

    {
      "reason": "Payment verification failed"
    }

### Delete User

    DELETE /api/admin/users/:id

Deletes a user account.

### Get Platform Earnings

    GET /api/admin/earnings

Returns platform-level earnings information.

---

# 13. Health Check API

The backend exposes a health-check endpoint:

    GET /api/health

Example response:

    {
      "status": "RMSR API is running",
      "time": "2026-10-05T00:00:00.000Z",
      "db": "connected"
    }

The `db` field indicates whether the backend is currently connected to MongoDB.

---

# 14. Authentication and Authorization Flow

A typical protected API request follows this flow:

    Client
       │
       │ Login
       ▼
    Authentication API
       │
       │ JWT
       ▼
    Client
       │
       │ Authorization: Bearer <token>
       ▼
    Protected API Route
       │
       ├── JWT Authentication
       │
       └── Role Authorization
               │
               ▼
           Controller
               │
               ▼
           MongoDB

---

# 15. API Response Format

Successful responses generally return JSON data containing the requested resource or operation result.

Example:

    {
      "success": true,
      "message": "Operation completed successfully",
      "data": {}
    }

Error responses contain an appropriate HTTP status code and an error message.

Example:

    {
      "success": false,
      "message": "Unauthorized"
    }

---

# 16. HTTP Status Codes

RMSR APIs use standard HTTP status codes where appropriate.

| Status Code | Meaning |
|---|---|
| `200` | Successful request |
| `201` | Resource created successfully |
| `400` | Invalid request |
| `401` | Authentication required or invalid |
| `403` | Insufficient permissions |
| `404` | Resource not found |
| `500` | Internal server error |

---

# 17. API Architecture

The API follows a modular Express.js architecture.

    Client
       │
       ▼
    Express Router
       │
       ├── Authentication Middleware
       │
       ├── Authorization Middleware
       │
       ▼
    Controller / Route Logic
       │
       ├── MongoDB / Mongoose
       ├── Cloudinary
       ├── SSLCommerz
       ├── Firebase Cloud Messaging
       └── Nodemailer
       │
       ▼
    JSON Response

The API is divided into separate route modules for authentication, users, restaurants, menus, orders, payments, reviews, notifications, chat, loyalty, riders, recommendations, and administration.

---

# 18. Real-Time Communication

Although the main application API follows REST principles, RMSR also uses Socket.IO for real-time operations.

Real-time functionality includes:

- Order status updates
- New order notifications
- Rider location updates
- Real-time order tracking
- Order-related communication
- Chat events

The REST API handles persistent operations, while Socket.IO provides real-time event communication between connected clients.

---

# Summary

The RMSR API provides the backend interface for customers, restaurant owners, riders, and administrators.

The API combines:

- RESTful HTTP endpoints
- JWT authentication
- Role-based authorization
- MongoDB and Mongoose
- Cloudinary media storage
- SSLCommerz payment processing
- Firebase Cloud Messaging
- Nodemailer
- Socket.IO real-time communication

This modular API structure allows the RMSR platform to support food ordering, restaurant management, delivery operations, payments, communication, loyalty, recommendations, and administration through a single backend system.