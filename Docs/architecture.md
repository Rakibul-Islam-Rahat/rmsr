# RMSR System Architecture

## Overview

RMSR is a full-stack food ordering and delivery platform designed for the BRUR community in Rangpur, Bangladesh.

The system follows a client-server architecture with a React-based frontend, a Node.js/Express backend, MongoDB for persistent data storage, and several external services for payments, media storage, notifications, email, and real-time communication.

The architecture is designed around multiple user roles:

- Customer
- Restaurant Owner
- Rider
- Administrator

Each role interacts with the backend through authenticated REST APIs and, where required, real-time Socket.IO communication.

---

## High-Level Architecture

```text
                         ┌─────────────────────────┐
                         │        Customers        │
                         │  Web Browser / Mobile   │
                         └────────────┬────────────┘
                                      │
                                      │ HTTPS / REST API
                                      ▼
┌──────────────────────────────────────────────────────────────────┐
│                         React Frontend                            │
│                                                                  │
│  React 18 │ React Router │ Socket.IO Client │ Leaflet │ Toast    │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             │ HTTP / WebSocket
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Node.js / Express Backend                      │
│                                                                  │
│  Authentication │ REST APIs │ Business Logic │ Authorization     │
│  Order Management │ Payment │ Chat │ Notifications │ Admin       │
│  Rider Operations │ Recommendations │ Reviews │ Loyalty          │
└───────────────┬──────────────────────┬───────────────────────────┘
                │                      │
                │                      │ Socket.IO
                │                      ▼
                │             ┌───────────────────┐
                │             │ Real-Time Events  │
                │             │ Orders │ Chat     │
                │             │ Rider Location    │
                │             └───────────────────┘
                │
                ▼
       ┌─────────────────────┐
       │     MongoDB Atlas   │
       │                     │
       │ Users               │
       │ Restaurants         │
       │ Menu Items          │
       │ Orders              │
       │ Reviews             │
       │ Notifications       │
       │ Messages            │
       │ Loyalty             │
       │ Riders              │
       └─────────────────────┘

External Services
──────────────────────────────────────────────────────────────────
Cloudinary       → Image and media storage
SSLCommerz       → Online payment processing
Firebase FCM     → Push notifications
Nodemailer       → Email communication
Leaflet          → Map and location visualization
```

---

## Architecture Layers

The RMSR application can be divided into several major layers.

### 1. Presentation Layer

The frontend is responsible for:

- User interface rendering
- Navigation
- Form handling
- Client-side state management
- API communication
- Authentication state
- Real-time event handling
- Map visualization
- Notifications and user feedback

Technology:

- React 18
- React Router 6
- Socket.IO Client
- Leaflet
- React Hot Toast

---

### 2. API Layer

The backend exposes REST APIs through Express.js.

The API layer handles:

- Request routing
- Authentication
- Authorization
- Input processing
- File uploads
- Controller execution
- HTTP responses
- Error handling

Major API groups include:

```text
/api/auth
/api/users
/api/restaurants
/api/menu
/api/orders
/api/payments
/api/reviews
/api/notifications
/api/chat
/api/loyalty
/api/admin
/api/rider
/api/recommendations
```

---

### 3. Business Logic Layer

The backend contains the application logic required to operate the food delivery platform.

Examples include:

- User registration and authentication
- Restaurant management
- Menu management
- Cart and order processing
- Payment verification
- Order status management
- Rider assignment and delivery operations
- Loyalty point calculations
- Review management
- Notifications
- Administrative operations
- Recommendation generation

This layer coordinates the interaction between API requests, database operations, authentication, and external services.

---

### 4. Data Layer

MongoDB Atlas is used as the primary database.

The application uses Mongoose models to represent the main entities.

Core collections include:

```text
users
restaurants
menuitems
orders
reviews
notifications
messages
loyalties
riders
```

The database layer is responsible for:

- Persistent application data
- User information
- Restaurant information
- Menu information
- Order history
- Payment information
- Reviews
- Notifications
- Chat messages
- Loyalty transactions
- Rider information

---

## Frontend Architecture

The frontend is implemented using React 18.

A simplified frontend structure is:

```text
Frontend
│
├── Components
│   ├── Reusable UI components
│   ├── Navigation
│   ├── Forms
│   ├── Cards
│   └── Order-related components
│
├── Pages
│   ├── Customer pages
│   ├── Restaurant owner pages
│   ├── Rider pages
│   └── Admin pages
│
├── API / Services
│   └── Backend communication
│
├── Authentication
│   └── JWT-based authentication
│
├── Socket.IO Client
│   └── Real-time communication
│
└── Map Integration
    └── Leaflet
```

React Router is used to handle client-side navigation between application pages.

The frontend communicates with the backend through REST APIs and Socket.IO.

---

## Backend Architecture

The backend is implemented using Node.js and Express.js.

A simplified structure is:

```text
Backend
│
├── server.js
│
├── controllers/
│   ├── Authentication
│   ├── Restaurant
│   ├── Menu
│   ├── Order
│   ├── Payment
│   ├── Review
│   ├── Notification
│   ├── Chat
│   ├── Loyalty
│   ├── Rider
│   ├── Recommendation
│   └── Admin
│
├── models/
│   ├── User
│   ├── Restaurant
│   ├── MenuItem
│   ├── Order
│   ├── Review
│   ├── Notification
│   ├── Message
│   ├── Loyalty
│   └── Rider
│
├── routes/
│   ├── authRoutes
│   ├── userRoutes
│   ├── restaurantRoutes
│   ├── menuRoutes
│   ├── orderRoutes
│   ├── paymentRoutes
│   ├── reviewRoutes
│   ├── notificationRoutes
│   ├── chatRoutes
│   ├── loyaltyRoutes
│   ├── adminRoutes
│   ├── riderRoutes
│   └── recommendationRoutes
│
├── middleware/
│   ├── Authentication
│   ├── Authorization
│   ├── File Upload
│   └── Error Handling
│
└── Configuration
    ├── Database
    ├── Cloudinary
    ├── Firebase
    └── Payment / Email Services
```

The exact directory organization may evolve as the application grows, but the logical separation remains based on routes, controllers, models, middleware, and external service integrations.

---

## Authentication Architecture

RMSR uses JWT-based authentication.

The authentication flow is:

```text
User
 │
 │ Register / Login
 ▼
Authentication API
 │
 │ Validate credentials
 ▼
User Model
 │
 │ Successful authentication
 ▼
JWT Token
 │
 ▼
Frontend
 │
 │ Token included in protected requests
 ▼
Authentication Middleware
 │
 │ Verify token
 ▼
Authenticated Request
```

Passwords are stored using bcrypt hashing rather than storing plaintext passwords.

The `User` model also supports password comparison through its authentication logic.

---

## Role-Based Authorization

RMSR supports four major roles:

```text
customer
restaurant_owner
rider
admin
```

Authentication determines whether a user is logged in.

Authorization determines what an authenticated user is allowed to do.

For example:

```text
Customer
 ├── Browse restaurants
 ├── Place orders
 ├── Make payments
 ├── Track orders
 ├── Chat
 └── Submit reviews

Restaurant Owner
 ├── Manage restaurant
 ├── Manage menu
 ├── Process orders
 └── View earnings

Rider
 ├── View available deliveries
 ├── Accept deliveries
 ├── Update delivery status
 └── Update location

Admin
 ├── Manage users
 ├── Approve restaurants
 ├── Monitor orders
 ├── Verify payments
 └── View platform statistics
```

Protected routes use authentication middleware, while role-specific routes additionally use authorization checks.

---

## Order Processing Architecture

The order system is one of the central components of RMSR.

A simplified order flow is:

```text
Customer
   │
   │ Select restaurant
   ▼
Menu Items
   │
   │ Add items
   ▼
Order Creation
   │
   ├───────────────┐
   │               │
   ▼               ▼
Payment         Cash on Delivery
   │
   ▼
Payment Processing
   │
   ▼
Order Confirmation
   │
   ▼
Restaurant
   │
   │ Accept / Prepare
   ▼
Ready for Pickup
   │
   ▼
Rider
   │
   │ Pickup
   ▼
On The Way
   │
   │ Live location
   ▼
Customer
   │
   ▼
Delivered
```

The order model maintains both the current order status and a status history.

Supported order statuses include:

```text
payment_pending
pending
confirmed
preparing
ready_for_pickup
picked_up
on_the_way
delivered
cancelled
```

Payment state is tracked separately from order status.

---

## Payment Architecture

RMSR supports both online and offline payment methods.

Supported payment methods include:

```text
bKash
Nagad
Rocket
Cash on Delivery
```

SSLCommerz is used for online payment processing.

A simplified online payment flow is:

```text
Customer
   │
   │ Create Order
   ▼
Payment Initiation
   │
   ▼
SSLCommerz
   │
   ├── Success
   ├── Failure
   └── Cancellation
   │
   ▼
Payment Callback / Verification
   │
   ▼
RMSR Backend
   │
   ▼
Order Payment Status
```

Payment information is stored with the corresponding order, including payment method, payment status, and transaction information.

---

## Real-Time Communication Architecture

Socket.IO is used for real-time application features.

Real-time functionality includes:

- Order status updates
- New order events
- Rider location updates
- Customer-rider communication
- Order-related chat

A simplified communication flow is:

```text
Customer Client
       │
       │
       ▼
   Socket.IO
       ▲
       │
       ▼
RMSR Backend
       │
       ├──────────────► Restaurant Client
       │
       ├──────────────► Rider Client
       │
       └──────────────► Admin Client
```

This allows relevant users to receive updates without repeatedly refreshing the application.

---

## Chat Architecture

RMSR provides order-related communication using Socket.IO and persistent message storage.

The architecture is:

```text
Customer
   │
   │ Message
   ▼
Socket.IO / API
   │
   ▼
Backend
   │
   ├── Persist message
   │
   └── Emit real-time event
   │
   ▼
Rider / Restaurant
```

Messages are associated with an order and contain sender information, sender role, message content, read state, and optional attachment information.

---

## Rider Location Architecture

Riders can update their current GPS coordinates through the rider API.

The basic flow is:

```text
Rider Device
   │
   │ GPS Coordinates
   ▼
Rider API
   │
   ▼
Rider Model
   │
   │ Current latitude / longitude
   ▼
Real-Time Communication
   │
   ▼
Customer
```

Leaflet is used on the frontend for map visualization.

This allows customers to visualize delivery progress using the rider's location data.

---

## Notification Architecture

RMSR uses multiple notification mechanisms.

### Push Notifications

Firebase Cloud Messaging is used for push notifications.

```text
Backend Event
     │
     ▼
Firebase Cloud Messaging
     │
     ▼
User Device
```

### Persistent Notifications

Notifications are also stored in MongoDB.

This allows users to access previous notifications from the application.

Notification types include:

```text
order
promotion
payment
system
chat
loyalty
```

### Email Notifications

Nodemailer is used for email communication such as account-related and order-related messages.

---

## Media Storage Architecture

User and restaurant images are not intended to be stored directly inside MongoDB.

Cloudinary is used for image and media storage.

The simplified flow is:

```text
Frontend
   │
   │ Image Upload
   ▼
Backend
   │
   ▼
Cloudinary
   │
   │ Media URL
   ▼
MongoDB
   │
   └── Store URL/reference
```

Examples of stored media include:

- User avatars
- Restaurant logos
- Restaurant cover images
- Menu item images
- Review images

---

## Database Relationship Architecture

The major entities are connected through references.

A simplified relationship model is:

```text
User
 │
 ├──────────────► Restaurant Owner
 │                     │
 │                     ▼
 │                 Restaurant
 │                     │
 │                     ▼
 │                 MenuItem
 │
 ├──────────────► Customer
 │                     │
 │                     ▼
 │                   Order
 │                  /  |  \
 │                 /   |   \
 │                ▼    ▼    ▼
 │           Restaurant Rider Payment
 │
 ├──────────────► Rider
 │
 └──────────────► Reviews / Messages / Notifications / Loyalty
```

The `Order` entity acts as a central transactional entity connecting customers, restaurants, riders, payment information, and delivery operations.

---

## Recommendation Architecture

RMSR includes an AI-powered recommendation feature.

The recommendation API is exposed through:

```text
GET /api/recommendations
```

The frontend requests recommendations through the backend.

The recommendation component is designed to provide users with personalized or relevant food/restaurant suggestions based on the application's available data and recommendation logic.

The recommendation system is separated from the core ordering flow so that recommendations can evolve independently.

---

## Administrative Architecture

Administrative operations are protected using authentication and admin authorization.

The simplified flow is:

```text
Admin
  │
  │ Authenticated Request
  ▼
Admin API
  │
  │ Authorization
  ▼
Admin Controller
  │
  ├── User Management
  ├── Restaurant Approval
  ├── Order Monitoring
  ├── Payment Verification
  ├── Platform Statistics
  └── Earnings
  │
  ▼
MongoDB
```

The admin layer provides centralized platform management.

---

## API Communication

The frontend communicates with the backend using RESTful HTTP APIs.

Example:

```text
React Frontend
      │
      │ HTTP Request
      ▼
Express Route
      │
      ▼
Middleware
      │
      ▼
Controller
      │
      ▼
Mongoose Model
      │
      ▼
MongoDB Atlas
```

The backend then returns a JSON response to the frontend.

For operations requiring real-time updates, Socket.IO is used alongside the REST API.

---

## Error Handling Architecture

The backend includes centralized error handling.

The general request flow is:

```text
HTTP Request
     │
     ▼
Route
     │
     ▼
Middleware
     │
     ▼
Controller
     │
     ├── Success ───────► JSON Response
     │
     └── Error
           │
           ▼
     Global Error Handler
           │
           ▼
      Error Response
```

A dedicated 404 handler is also used for unmatched routes.

This keeps error responses more consistent across the API.

---

## Security Architecture

The application includes several security-related mechanisms:

- JWT authentication
- Password hashing with bcrypt
- Role-based authorization
- Protected API routes
- Environment variables for sensitive configuration
- File upload handling
- Authentication middleware
- Authorization middleware
- Payment verification
- Input validation within API operations

Sensitive credentials such as database credentials, API keys, payment credentials, and service configuration should be provided through environment variables rather than committed to the repository.

---

## External Service Architecture

RMSR integrates several external services:

```text
                         RMSR Backend
                              │
          ┌───────────────────┼────────────────────┐
          │                   │                    │
          ▼                   ▼                    ▼
      MongoDB Atlas        Cloudinary          SSLCommerz
      Database             Media Storage       Payments
          │
          │
          ├──────────────► Firebase FCM
          │                Push Notifications
          │
          └──────────────► Nodemailer
                           Email
```

Leaflet is used on the frontend for map visualization and location-related functionality.

---

## Deployment Architecture

The production system is deployed as separate frontend and backend applications.

A simplified deployment architecture is:

```text
                    Internet
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
      React Frontend       Node.js Backend
             │                   │
             │                   ├────────► MongoDB Atlas
             │                   ├────────► Cloudinary
             │                   ├────────► SSLCommerz
             │                   ├────────► Firebase FCM
             │                   └────────► Email Service
             │
             └──────── HTTPS / API / Socket.IO ────────┘
```

The frontend and backend can be deployed independently, while the backend acts as the central application server.

---

## Request Lifecycle

A typical authenticated request follows this lifecycle:

```text
1. User interacts with React application
              │
              ▼
2. Frontend sends HTTP request
              │
              ▼
3. Express receives request
              │
              ▼
4. Authentication middleware verifies JWT
              │
              ▼
5. Authorization middleware checks role
              │
              ▼
6. Route forwards request to controller
              │
              ▼
7. Controller executes business logic
              │
              ▼
8. Mongoose interacts with MongoDB
              │
              ▼
9. Controller prepares response
              │
              ▼
10. Express returns JSON response
              │
              ▼
11. React updates the UI
```

---

## Order Lifecycle Example

A complete customer order can involve several components of the architecture:

```text
Customer
   │
   ▼
React Frontend
   │
   ▼
Order API
   │
   ▼
MongoDB
   │
   ├──────────────► Payment Service
   │
   ├──────────────► Restaurant
   │
   ├──────────────► Rider
   │
   ├──────────────► Firebase FCM
   │
   └──────────────► Socket.IO
                         │
                         ▼
                  Real-Time Updates
                         │
                         ▼
                     Customer
```

This demonstrates how the major application components work together during the core business process.

---

## Scalability Considerations

The current architecture provides a foundation that can be expanded as RMSR grows.

Potential future improvements include:

- Redis caching
- Background job queues
- Dedicated notification workers
- Database indexing optimization
- Horizontal backend scaling
- Load balancing
- Containerized deployment
- Centralized logging
- Monitoring and observability
- Dedicated search infrastructure
- Independent microservices for high-load components

The current modular route/controller/model structure makes it possible to evolve individual parts of the system without immediately rewriting the entire application.

---

## Architecture Summary

RMSR uses a modular full-stack architecture consisting of:

```text
React Frontend
       │
       ▼
Node.js + Express Backend
       │
       ├── JWT Authentication
       ├── Role-Based Authorization
       ├── REST APIs
       ├── Socket.IO
       ├── Business Logic
       └── External Service Integrations
       │
       ▼
MongoDB Atlas
       │
       ├── Users
       ├── Restaurants
       ├── Menu Items
       ├── Orders
       ├── Reviews
       ├── Notifications
       ├── Messages
       ├── Loyalty
       └── Riders
```

The architecture separates presentation, API handling, business logic, data persistence, and external integrations.

This separation allows RMSR to support customer ordering, restaurant management, rider delivery operations, administrative management, online payments, real-time communication, notifications, and recommendation features within a single integrated platform.