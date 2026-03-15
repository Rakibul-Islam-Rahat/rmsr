# RMSR Food Delivery Platform

A full-stack MERN food ordering and delivery platform built for Rangpur, Bangladesh.

---

## Tech Stack
- **Frontend:** React 18, React Router 6, Socket.IO Client, Leaflet Maps, React Hot Toast
- **Backend:** Node.js, Express, Socket.IO, JWT Auth, Multer
- **Database:** MongoDB Atlas
- **Storage:** Cloudinary (images)
- **Payments:** SSLCommerz (bKash, Nagad, Rocket, Cash on Delivery)
- **Notifications:** Firebase Cloud Messaging (push), Nodemailer (email)
- **Currency:** BDT (৳ Taka)

---

## Project Structure

```
rmsr/
├── backend/
│   ├── config/          (db, cloudinary, firebase)
│   ├── controllers/     (all business logic)
│   ├── middleware/      (auth JWT)
│   ├── models/          (User, Restaurant, MenuItem, Order, etc)
│   ├── routes/          (all API routes)
│   ├── services/        (email, socket, notifications)
│   ├── seed.js          (demo data creator)
│   ├── server.js        (entry point)
│   └── .env             (all credentials - already filled)
└── frontend/
    ├── public/          (index.html, firebase-sw)
    └── src/
        ├── components/  (Navbar, Footer, cards)
        ├── context/     (AuthContext + cart)
        ├── pages/       (customer, restaurant, rider, admin)
        └── services/    (api.js - all API calls)
```

---

## Setup Instructions

### Step 1 — Open VS Code Terminal

Open the `rmsr` folder in VS Code, then open the terminal:
`View → Terminal` (or press `` Ctrl+` ``)

---

### Step 2 — Install Backend Dependencies

```bash
cd backend
npm install
```

Wait for it to finish (may take 1-2 minutes).

---

### Step 3 — Install Frontend Dependencies

Open a **second terminal** tab:

```bash
cd frontend
npm install
```

Wait for it to finish (may take 2-3 minutes).

---

### Step 4 — Seed the Database (IMPORTANT — do this once)

In the backend terminal:

```bash
cd backend
node seed.js
```

You should see:
```
Connected to MongoDB
Admin created: admin@rmsr.com
Owner created: owner@rmsr.com
Rider created: rider@rmsr.com
Customer created: customer@rmsr.com
Restaurant created: Spice Garden Rangpur
Menu items created successfully
=== SEED COMPLETE ===
```

---

### Step 5 — Run the Backend

In the backend terminal:

```bash
cd backend
npm run dev
```

You should see:
```
RMSR Server running on port 5000
MongoDB connected successfully
```

---

### Step 6 — Run the Frontend

In the frontend terminal:

```bash
cd frontend
npm start
```

Browser opens automatically at **http://localhost:3000**

---

## Demo Login Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@rmsr.com | admin123 |
| Restaurant Owner | owner@rmsr.com | owner123 |
| Rider | rider@rmsr.com | rider123 |
| Customer | customer@rmsr.com | customer123 |

Or register a new account at http://localhost:3000/register

---

## Features

### Customer Portal (http://localhost:3000)
- Browse restaurants by cuisine, search, sort by rating/speed/fee
- View full menu with categories, images, prices in ৳
- Add to cart (smart cross-restaurant blocking)
- Checkout with bKash / Nagad / Rocket / Cash on Delivery
- Live order tracking with status steps
- Real-time chat with restaurant/rider via Socket.IO
- Loyalty points (earn 1pt per ৳10, redeem 100pts = ৳10 off)
- AI-powered food recommendations
- Schedule orders for later
- Push notifications (Firebase)
- Email confirmations (Gmail)

### Restaurant Owner Portal (http://localhost:3000/restaurant)
- Dashboard with revenue, orders, rating stats
- Create restaurant profile (goes for admin approval)
- Manage menu: add/edit/delete items with image upload
- Accept/reject/update orders in real-time
- Toggle restaurant open/closed
- Analytics page with payment breakdown
- Settings: update all restaurant info + photos

### Rider Portal (http://localhost:3000/rider)
- Toggle online/offline status
- See all available orders ready for pickup
- Accept orders with one click
- Update delivery status (picked up → on the way)
- Live location sharing via GPS
- Call customer and restaurant directly

### Admin Panel (http://localhost:3000/admin)
- Dashboard: total users, restaurants, orders, revenue
- Approve/reject new restaurant applications
- Feature/unfeature restaurants
- Manage all users (activate/deactivate)
- View all orders with status filter

---

## Environment Variables

All credentials are pre-filled in `backend/.env`.

If you get your real SSLCommerz account later, update these two lines:
```
SSLCOMMERZ_STORE_ID=your_real_store_id
SSLCOMMERZ_STORE_PASSWORD=your_real_store_password
```

For Firebase push notifications to work in the browser, add your Firebase Web API key:
- Go to Firebase Console → Project Settings → General → Your apps
- Click "Add app" → Web → Register
- Copy `apiKey` and `appId`
- Update `frontend/.env`:
  ```
  REACT_APP_FIREBASE_API_KEY=your_web_api_key
  REACT_APP_FIREBASE_APP_ID=your_app_id
  ```
- Update `frontend/public/firebase-messaging-sw.js` with the same values

---

## Common Issues & Fixes

### "npm install" fails
```bash
npm install --legacy-peer-deps
```

### Backend won't start
- Check that MongoDB Atlas is accessible (network access allows 0.0.0.0/0)
- Verify `.env` file is in the `backend/` folder

### Images not uploading
- Verify Cloudinary credentials in `backend/.env`
- Check file is jpg, jpeg, png, webp, or gif (max 5MB)

### Emails not sending
- Check Gmail app password in `.env` (use the 16-char password, not your Gmail password)
- Make sure 2FA is enabled on your Google account

### Port already in use
```bash
# Kill port 5000
npx kill-port 5000
# Kill port 3000
npx kill-port 3000
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/restaurants | Get all restaurants |
| GET | /api/menu/restaurant/:id | Get menu |
| POST | /api/orders | Place order |
| PUT | /api/orders/:id/status | Update order status |
| POST | /api/payments/initiate | Start payment |
| GET | /api/notifications | Get notifications |
| POST | /api/chat | Send chat message |
| GET | /api/loyalty | Get loyalty info |
| GET | /api/recommendations | AI recommendations |
| GET | /api/admin/dashboard | Admin stats |

---

## Team

**RMSR** — R, M, S, R (4 team members)
Rangpur, Bangladesh 🇧🇩

Built with the MERN stack.
