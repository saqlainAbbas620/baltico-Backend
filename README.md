# BaltiCo — Backend API

> RESTful API for the BaltiCo e-commerce platform. Built with Express 5, MongoDB/Mongoose, and JWT authentication. Supports email verification, Google OAuth, Cloudinary image management, and real-time order notifications.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_9-47A248?logo=mongodb&logoColor=white)](https://mongoosejs.com)
[![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white)](https://jwt.io)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)

---

## Features

- **JWT authentication** — short-lived access tokens (15m) + HttpOnly refresh token cookies (7d)
- **Email verification** — token-based verify flow on register; resend endpoint
- **Google OAuth** — ID token verification via Google tokeninfo endpoint
- **Auto token refresh** — transparent re-issue on 401; refresh queue prevents race conditions
- **Product CRUD** — full admin management with quantity tracking and auto-derived stock status
- **Cloudinary image management** — upload via multipart, delete by public ID, Streamifier stream conversion
- **Order system** — create, track, admin status updates with stock decrement on purchase
- **Email notifications** — order confirmation to customer, new order alert to admin (Nodemailer + Gmail)
- **CMS** — hero banner and 3 category tile images manageable via API
- **Cross-domain cookies** — `sameSite: none` + `secure: true` in production for Vercel deployments
- **Serverless-ready** — exports Express app for Vercel's `@vercel/node` runtime

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ (ESM) |
| Framework | Express 5 |
| Database | MongoDB Atlas via Mongoose 9 |
| Auth | bcrypt · jsonwebtoken · cookie-parser |
| Email | Nodemailer (Gmail App Password) |
| File uploads | Multer (memory storage) · Streamifier · Cloudinary SDK v2 |
| Deployment | Vercel serverless (`@vercel/node`) |

---

## Project Structure

```
backend/
├── vercel.json                ← Serverless deployment config
├── src/
│   ├── index.js               ← Local dev entry (connects DB + starts server)
│   ├── vercel.js              ← Vercel entry (exports app, no app.listen)
│   ├── app.js                 ← Express setup: CORS, middleware, routes
│   ├── config/
│   │   ├── db.js              ← Mongoose connection
│   │   ├── cloudinary.js      ← Cloudinary SDK init
│   │   └── nodemailer.js      ← Transporter factory (returns null if unconfigured)
│   ├── models/
│   │   ├── user.model.js      ← User: isVerified, emailVerificationToken, refreshToken
│   │   ├── product.model.js   ← Product: quantity + pre-save stock auto-derivation
│   │   ├── order.model.js     ← Order: productId as String (supports seed + real IDs)
│   │   └── cms.model.js       ← Banner + category images
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── oauth.controller.js
│   │   ├── product.controller.js
│   │   ├── order.controller.js
│   │   └── cms.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── oauth.routes.js
│   │   ├── product.routes.js
│   │   ├── order.routes.js
│   │   └── cms.routes.js
│   ├── middlewares/
│   │   ├── auth.middleware.js       ← verifyToken · isAdmin
│   │   ├── upload.middleware.js     ← Multer memory storage configs
│   │   └── errorHandler.middleware.js
│   └── utils/
│       ├── ApiError.js
│       ├── ApiResponse.js
│       ├── asyncHandler.js
│       └── emailTemplates.js        ← verificationEmail · welcomeEmail · orderConfirmEmail
│                                       orderStatusEmail · adminOrderEmail
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Gmail account with [App Password](https://myaccount.google.com/apppasswords) enabled

### Installation

```bash
npm install
cp .env.example .env   # fill in all variables (see below)
npm run dev            # nodemon → http://localhost:5000
```

### Health Check

```
GET /api/health
→ { "success": true, "message": "BaltiCo API is running 🚀" }
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in every value:

```env
# Database
MONGO_DB=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net
DB_NAME=E-commerce

# URLs
FRONTEND_URL=http://localhost:3000
CLIENT_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000/api

# JWT — use long random strings, different for each
ACCESS_TOKEN_SECRET=your-random-32-char-secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=your-different-random-secret
REFRESH_TOKEN_EXPIRY=7d

# Email (Gmail + App Password)
EMAIL=your@gmail.com
EMAIL_PASS=xxxx-xxxx-xxxx-xxxx

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Admin notifications
ADMIN_EMAIL=your@gmail.com

# Set automatically by Vercel in production
NODE_ENV=production
```

> **Gmail App Password:** Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) — requires 2-Step Verification enabled. Use the 16-character password (no spaces) as `EMAIL_PASS`.

---

## API Reference

### Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | — | Register new user, sends verification email |
| `POST` | `/login` | — | Login, returns access token + sets refresh cookie |
| `GET` | `/verify-email?token=&id=` | — | Verify email, redirects to frontend with JWT |
| `POST` | `/resend-verification` | — | Resend verification email |
| `POST` | `/refresh` | Cookie | Issue new access token via refresh cookie |
| `GET` | `/me` | Bearer | Get authenticated user profile |
| `PUT` | `/profile` | Bearer | Update address, phone, password |
| `POST` | `/logout` | Bearer | Invalidate refresh token + clear cookie |
| `POST` | `/google` | — | Google OAuth — verifies ID token, returns JWT |
| `GET` | `/admin/users` | Bearer + Admin | List all users |

### Products — `/api/products`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | — | List all products (supports query params) |
| `GET` | `/:id` | — | Get single product |
| `POST` | `/` | Admin | Create product (multipart or JSON) |
| `PUT` | `/:id` | Admin | Update product |
| `DELETE` | `/:id` | Admin | Delete product + Cloudinary images |
| `POST` | `/upload-image` | Admin | Upload image to Cloudinary, returns `{ url, publicId }` |
| `DELETE` | `/delete-image` | Admin | Delete image from Cloudinary by `publicId` |

### Orders — `/api/orders`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/` | Bearer | Place order, decrements stock, sends confirmation emails |
| `GET` | `/my` | Bearer | Get current user's orders |
| `GET` | `/` | Admin | Get all orders |
| `PUT` | `/:id/status` | Admin | Update order status (`pending` · `shipped` · `delivered` · `cancelled`) |

### CMS — `/api/cms`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/banner` | — | Get hero banner URL |
| `PUT` | `/banner` | Admin | Update hero banner (URL or file upload) |
| `GET` | `/categories` | — | Get all 3 category tile images |
| `PUT` | `/categories/:cat` | Admin | Update category image (`women` · `men` · `children`) |

---

## Data Models

### User
```js
{
  name:                     String,
  email:                    String (unique),
  password:                 String (bcrypt hashed),
  isAdmin:                  Boolean,
  isVerified:               Boolean,
  emailVerificationToken:   String,
  emailVerificationExpiry:  Date,
  refreshToken:             String,
  address:                  String,
  phone:                    String,
  avatar:                   String,
}
```

### Product
```js
{
  title:    String,
  cat:      String,   // "women" | "men" | "children"
  price:    Number,
  disc:     Number,   // discount percentage
  quantity: Number,   // triggers pre-save hook
  stock:    String,   // auto-derived: "in" | "low" | "out"
  sizes:    [String],
  img:      String,
  img2:     String,
  desc:     String,
}
// Pre-save: qty <= 0 → "out" | qty < 10 → "low" | qty >= 10 → "in"
```

### Order
```js
{
  orderId:   String,  // "PA-XXXXXXXX"
  user:      ObjectId → User,
  userName:  String,
  userPhone: String,
  items: [{
    productId: String,  // String type — supports seed IDs and real ObjectIds
    title:     String,
    price:     Number,
    qty:       Number,
    size:      String,
    img:       String,
  }],
  total:   Number,
  addr:    String,
  phone:   String,
  payment: String,    // "cod"
  status:  String,    // "pending" | "shipped" | "delivered" | "cancelled"
  date:    Date,
}
```

---

## Auth Flow

```
Register → isVerified: false → send verification email
         → GET /verify-email?token=&id= → isVerified: true → redirect to frontend with JWT

Login    → checks isVerified → returns { accessToken }
         → sets HttpOnly refreshToken cookie (7d)

Request  → Authorization: Bearer <accessToken>
         → 401 → POST /auth/refresh → new accessToken (queue concurrent requests)
         → refresh fails → dispatch BaltiCo:session-expired → redirect to /auth
```

---

## CORS

The server dynamically allows:
- Origins listed in `FRONTEND_URL` and `CLIENT_URL`
- Any `https://BaltiCo*.vercel.app` subdomain (preview + production deployments)
- `localhost:3000` and `localhost:5173` in development

Cookies require `credentials: true` on both the axios instance and the CORS config.

---

## Deployment — Vercel

The `src/vercel.js` entry point exports the Express `app` without calling `app.listen()`. Vercel wraps it as a serverless function automatically.

```bash
# No build step required — Vercel runs Node.js directly
# Entry: src/vercel.js (configured in vercel.json)
```

**Required env vars on Vercel** — set all variables from the `.env.example` in the Vercel dashboard. Critically:

| Variable | Production Value |
|---|---|
| `NODE_ENV` | `production` — enables `sameSite: none` + `secure: true` cookies |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` |
| `CLIENT_URL` | `https://your-frontend.vercel.app` |
| `MONGO_DB` | Full Atlas connection string |

**MongoDB Atlas:** Set Network Access to `0.0.0.0/0` — Vercel uses dynamic IPs.

> **See the full deployment guide** in `BaltiCo-vercel-deployment.docx` for step-by-step instructions, environment variable reference, and troubleshooting.

---

## Scripts

```bash
npm run dev     # nodemon — auto-restarts on file changes
npm run start   # node — production local run
```
