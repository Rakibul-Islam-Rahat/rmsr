# RMSR Deployment Documentation

## Overview

RMSR is deployed as a full-stack web application with separate frontend and backend services.

The production architecture uses:

- React frontend
- Node.js and Express.js backend
- MongoDB Atlas database
- Cloudinary for media storage
- Firebase Cloud Messaging for push notifications
- SSLCommerz for online payments
- GitHub for source code management

---

## 1. Deployment Architecture

The production system follows this general architecture:

    User Browser
        │
        ▼
    React Frontend
        │
        │ HTTPS / REST API / Socket.IO
        ▼
    Node.js + Express Backend
        │
        ├── MongoDB Atlas
        ├── Cloudinary
        ├── Firebase Cloud Messaging
        ├── SSLCommerz
        └── Nodemailer

The frontend communicates with the backend through HTTP APIs and Socket.IO.

The backend communicates with MongoDB Atlas for application data and external services for specialized functionality.

---

# 2. Frontend Deployment

The frontend is built using React 18.

Typical frontend deployment steps:

1. Install project dependencies.
2. Configure the backend API URL.
3. Configure required frontend environment variables.
4. Build the React application.
5. Deploy the generated production build to the hosting platform.

Install dependencies:

    npm install

Create a production build:

    npm run build

The resulting production build can then be deployed to a static hosting platform.

---

# 3. Backend Deployment

The backend is built with Node.js and Express.js.

Typical backend deployment steps:

1. Install backend dependencies.
2. Configure environment variables.
3. Configure MongoDB Atlas.
4. Configure Cloudinary.
5. Configure payment credentials.
6. Configure Firebase credentials.
7. Configure email credentials.
8. Start the Express server.

Install dependencies:

    npm install

Start the backend:

    npm start

For local development, the project may use a development command such as:

    npm run dev

The exact commands depend on the scripts defined in `backend/package.json`.

---

# 4. Environment Variables

Sensitive configuration values should be stored in environment variables rather than committed to GitHub.

Typical backend environment variables include:

    PORT
    MONGODB_URI
    JWT_SECRET
    CLIENT_URL

Cloudinary configuration:

    CLOUDINARY_CLOUD_NAME
    CLOUDINARY_API_KEY
    CLOUDINARY_API_SECRET

SSLCommerz configuration:

    STORE_ID
    STORE_PASSWORD
    IS_LIVE

Firebase configuration:

    FIREBASE_PROJECT_ID
    FIREBASE_PRIVATE_KEY
    FIREBASE_CLIENT_EMAIL

Email configuration may include:

    EMAIL_USER
    EMAIL_PASSWORD

The exact variable names should match the configuration used by the application.

---

# 5. MongoDB Atlas Configuration

RMSR uses MongoDB Atlas as its primary database.

Deployment steps:

1. Create a MongoDB Atlas cluster.
2. Create a database user.
3. Configure network access.
4. Obtain the MongoDB connection string.
5. Store the connection string in the backend environment variables.
6. Start the backend application.
7. Verify the database connection through the health endpoint.

Health check:

    GET /api/health

A successful response should indicate that the API is running and the database is connected.

---

# 6. Cloudinary Configuration

RMSR uses Cloudinary for image and media storage.

Cloudinary handles media such as:

- User avatars
- Restaurant logos
- Restaurant cover images
- Menu item images
- Review images
- Other uploaded application media

The required Cloudinary credentials should be configured through environment variables.

The application uploads media from the backend to Cloudinary instead of storing the uploaded files directly in MongoDB.

---

# 7. SSLCommerz Configuration

RMSR uses SSLCommerz for online payment processing.

The payment integration requires the appropriate store credentials and environment configuration.

The application supports payment methods including:

- bKash
- Nagad
- Rocket
- Cash on Delivery

Online payments are processed through SSLCommerz while the order stores the relevant payment status and transaction information.

---

# 8. Firebase Cloud Messaging Configuration

Firebase Cloud Messaging is used for push notifications.

The application stores the user's FCM token and uses Firebase Cloud Messaging to send relevant notifications.

Notifications can be used for events such as:

- Order updates
- Payment updates
- New orders
- Delivery updates
- System notifications
- Other user-specific events

Firebase credentials should be configured securely through environment variables.

---

# 9. Email Configuration

RMSR uses Nodemailer for email communication.

Email functionality can be used for:

- Account-related communication
- Password recovery
- OTP delivery
- Order-related emails
- Other system notifications

Email credentials should never be committed to the public repository.

---

# 10. CORS Configuration

The backend uses CORS to control which frontend origins can communicate with the API.

Production frontend origins should be explicitly configured in the backend environment.

For local development, the application can allow the local frontend origin.

Example development origin:

    http://localhost:3000

The production frontend URL should also be configured appropriately.

---

# 11. Socket.IO Deployment

RMSR uses Socket.IO for real-time communication.

Socket.IO is used for:

- Real-time order updates
- Rider location updates
- Live order tracking
- Chat
- New order events
- Other real-time notifications

The frontend and backend must be configured so that the deployed frontend can establish a Socket.IO connection with the production backend.

CORS configuration must also allow the production frontend origin.

---

# 12. GitHub Deployment Workflow

The source code is maintained using Git and GitHub.

A typical workflow is:

    Local Development
          │
          ▼
      Git Changes
          │
          ▼
      git add .
          │
          ▼
      git commit
          │
          ▼
      git push
          │
          ▼
        GitHub
          │
          ▼
    Deployment Platform

Sensitive files such as `.env` should be excluded using `.gitignore`.

---

# 13. Production Build and Deployment

Before deploying a new version:

1. Test the application locally.
2. Verify frontend and backend communication.
3. Verify authentication.
4. Test restaurant and menu functionality.
5. Test order creation.
6. Test payment integration.
7. Test rider functionality.
8. Test real-time communication.
9. Verify notifications.
10. Build the frontend.
11. Push the updated code to GitHub.
12. Deploy the updated services.
13. Verify the production application.

---

# 14. Backend Health Check

The backend provides a health-check endpoint:

    GET /api/health

Example response:

    {
      "status": "RMSR API is running",
      "time": "2026-10-05T00:00:00.000Z",
      "db": "connected"
    }

This endpoint can be used to quickly verify whether the backend is running and connected to MongoDB.

---

# 15. Production Verification Checklist

After deployment, verify the following:

### Frontend

- Application loads correctly
- Routing works
- Images load correctly
- API requests succeed
- Authentication works
- Responsive layout works

### Backend

- API is reachable
- Health check works
- MongoDB connection is active
- Authentication works
- Authorization works
- Error handling works

### Restaurants

- Restaurant listing works
- Restaurant details load
- Restaurant owners can manage restaurants
- Menu management works

### Orders

- Customers can create orders
- Orders are visible to restaurant owners
- Order status updates work
- Riders can receive and accept orders
- Order tracking works

### Payments

- Payment initiation works
- Payment callbacks work
- Payment status is updated correctly
- Transaction information is stored

### Real-Time Features

- Socket.IO connection works
- Chat works
- Order updates appear in real time
- Rider location updates work

### Notifications

- Push notifications work
- Notification records are created
- Read/unread functionality works

---

# 16. Security Considerations

Production deployments should follow standard security practices.

Important considerations include:

- Never commit `.env` files.
- Never expose database credentials.
- Never expose JWT secrets.
- Keep API keys private.
- Use HTTPS in production.
- Restrict CORS to trusted frontend origins.
- Use strong authentication secrets.
- Validate incoming user input.
- Apply appropriate authorization checks.
- Keep dependencies updated.
- Restrict database access where possible.
- Protect administrative endpoints.
- Avoid exposing sensitive error details.

---

# 17. Deployment Troubleshooting

## Backend cannot connect to MongoDB

Check:

- MongoDB connection string
- MongoDB Atlas network access
- Database username and password
- Environment variable configuration
- Database user permissions

---

## Frontend cannot reach backend

Check:

- Backend URL
- Frontend environment variables
- CORS configuration
- HTTPS configuration
- Browser console errors
- Backend logs

---

## Socket.IO is not connecting

Check:

- Backend Socket.IO server
- Frontend Socket.IO URL
- CORS configuration
- Production frontend origin
- HTTPS/WSS configuration
- Browser network errors

---

## Images are not uploading

Check:

- Cloudinary credentials
- Upload configuration
- Backend environment variables
- File size and format
- Network requests
- Cloudinary dashboard

---

## Payments are not working

Check:

- SSLCommerz credentials
- Sandbox/live configuration
- Callback URLs
- Backend payment routes
- Order payment status
- SSLCommerz response data

---

# 18. Local Development Setup

For local development, clone the repository and install dependencies.

Clone the repository:

    git clone https://github.com/Rakibul-Islam-Rahat/rmsr.git

Move into the project directory:

    cd rmsr

Install frontend dependencies:

    cd frontend
    npm install

Install backend dependencies:

    cd ../backend
    npm install

Configure the required environment variables.

Then start the backend and frontend using the project's configured development scripts.

The frontend and backend should run on their respective local development ports.

---

# 19. Deployment Structure

The RMSR project can be organized as:

    rmsr/
    │
    ├── frontend/
    │   ├── src/
    │   ├── public/
    │   ├── package.json
    │   └── ...
    │
    ├── backend/
    │   ├── controllers/
    │   ├── middleware/
    │   ├── models/
    │   ├── routes/
    │   ├── uploads/
    │   ├── server.js
    │   ├── package.json
    │   └── ...
    │
    ├── Docs/
    │   ├── architecture.md
    │   ├── database.md
    │   ├── api.md
    │   └── deployment.md
    │
    ├── screenshots/
    │   └── homepage.png
    │
    ├── .gitignore
    └── README.md

---

# 20. Production Deployment Flow

The overall deployment process can be summarized as:

    Developer
        │
        ▼
    Local Testing
        │
        ▼
    Git Commit
        │
        ▼
    GitHub Repository
        │
        ├───────────────┐
        ▼               ▼
    Frontend          Backend
        │               │
        ▼               ▼
    Web Hosting      Node.js Hosting
                        │
                        ▼
                   MongoDB Atlas
                        │
             ┌──────────┼──────────┐
             ▼          ▼          ▼
         Cloudinary  SSLCommerz  Firebase
             │
             ▼
          External Services

---

# Summary

RMSR uses a separated frontend and backend deployment architecture.

The React frontend provides the user interface, while the Node.js and Express.js backend handles authentication, business logic, APIs, payments, real-time communication, and database operations.

MongoDB Atlas provides persistent application storage, while Cloudinary, Firebase Cloud Messaging, SSLCommerz, and Nodemailer provide specialized external services.

GitHub is used for source code management, and environment variables are used to keep sensitive production configuration outside the source code.

A successful production deployment requires correct configuration of the frontend, backend, database, authentication, payment system, media storage, notifications, email communication, and real-time Socket.IO services.