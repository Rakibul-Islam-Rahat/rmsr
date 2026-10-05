# RMSR — System Architecture

## 1. Architecture Overview

RMSR follows a full-stack client-server architecture built around a MERN-based application.

The system consists of:

- React frontend
- Node.js and Express backend
- MongoDB database
- REST APIs for client-server communication
- Socket.IO for real-time communication
- Cloudinary for image storage
- Firebase Cloud Messaging for push notifications
- SSLCommerz for online payments

## 2. High-Level Architecture

```text
                    ┌──────────────────────┐
                    │       Users          │
                    │                      │
                    │ Customer / Restaurant│
                    │ Rider / Admin        │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   React Frontend     │
                    │                      │
                    │ Customer Portal      │
                    │ Restaurant Portal    │
                    │ Rider Portal         │
                    │ Admin Panel          │
                    └──────────┬───────────┘
                               │
                    REST API / Socket.IO
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Node.js + Express    │
                    │ Backend              │
                    │                      │
                    │ Routes               │
                    │ Controllers          │
                    │ Middleware           │
                    │ Services             │
                    │ Authentication       │
                    └───────┬───────┬──────┘
                            │       │
                 ┌──────────┘       └─────────────┐
                 ▼                                ▼
        ┌─────────────────┐              ┌─────────────────┐
        │ MongoDB Atlas   │              │ External        │
        │                 │              │ Services        │
        │ Users           │              │                 │
        │ Restaurants     │              │ Cloudinary      │
        │ Menu Items      │              │ SSLCommerz      │
        │ Orders          │              │ Firebase        │
        │ etc.            │              │ Email           │
        └─────────────────┘              └─────────────────┘
