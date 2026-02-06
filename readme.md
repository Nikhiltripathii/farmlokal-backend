# 🌾 Farmlokal Backend

Farmlokal is a production-ready backend service for a farm-to-market platform where farmers can list products and buyers can browse them.  
This backend is built using **Node.js, Express, TypeScript, MySQL, and Redis (Upstash)** and demonstrates real-world backend concepts such as authentication, caching, pagination, rate limiting, and webhook handling.

---

## 🧱 Tech Stack

- **Node.js**
- **Express.js**
- **TypeScript**
- **MySQL** (Local / Railway / Cloud)
- **Redis (Upstash REST Redis)**
- **JWT Authentication**
- **REST APIs**

---

## ✨ Features Implemented

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (`farmer`, `buyer`)
- Protected routes using middleware

### 🛒 Products Module
- Farmers can create products
- Public product listing
- Cursor-based pagination (no offset)
- MySQL indexed pagination (`created_at`, `id`)

### ⚡ Redis Caching (Upstash)
- Product list caching
- OAuth token caching
- Cache TTL handling
- Fail-safe (API works even if Redis is down)

### 🚦 Rate Limiting
- Redis-backed IP-based rate limiter
- Atomic operations using Redis `INCR`
- Fail-open strategy (does not block if Redis fails)

### 🔁 Webhook Handling
- Idempotent webhook processing
- Redis-based idempotency lock (`SET NX`)
- Safe retry handling

### 🔗 External API Integration
- OAuth-style token generation
- External API fetch simulation
- Token deduplication using Redis

---

## 📁 Project Structure

src/
├── config/
├── external/
│ ├── apiA.ts
│ └── apiBWebhook.ts
├── middlewares/
│ ├── auth.ts
│ ├── role.ts
│ ├── rateLimit.ts
│ └── error.middleware.ts
├── oauth/
│ └── tokenService.ts
├── redis/
│ └── redisClient.ts
├── routes/
│ ├── auth.ts
│ ├── users.ts
│ └── products.ts
├── mysql.ts
├── server.ts
└── app.ts


---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000

MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=farmlokal
MYSQL_PORT=3306

JWT_SECRET=your_jwt_secret

OAUTH_TOKEN_URL=https://httpbin.org/post
OAUTH_CLIENT_ID=farmlokal-client
OAUTH_CLIENT_SECRET=farmlokal-secret

UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
🗄️ Database Schema (MySQL)
Users Table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('farmer','buyer') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
Products Table
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  farmer_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(id)
);
Indexes (for pagination)
CREATE INDEX idx_products_created_at ON products (created_at, id);
📡 API Endpoints
🔑 Authentication
Method	Endpoint	Description
POST	/auth/register	Register user
POST	/auth/login	Login user
👤 Users
Method	Endpoint	Auth	Description
GET	  /users/me	    ✅	Get logged-in user
🛒 Products
Method	Endpoint    Auth	Description
POST	/products	 Farmer	 Create product
GET	   /products		List  products
Pagination Example

GET /products?limit=2
GET /products?limit=2&cursor=BASE64_CURSOR
🔁 Webhook
Method	Endpoint	Description
POST	/webhook/external	Idempotent webhook
Required Header

X-Event-Id: unique-event-id
🚦 Rate Limiting
100 requests per IP per minute

Redis-backed

Fail-open

🧪 Local Development
npm install
npm run dev
Server runs at:

http://localhost:3000
 Deployment (Render + Railway / Upstash)
Backend (Render)
Create Web Service

Build command:

npm install && npm run build
Start command:

node dist/server.js
Add environment variables from .env

MySQL (Railway)
Create MySQL service

Copy host, user, password, database

Update .env

Redis (Upstash)
Create Redis database

Use REST URL & TOKEN

No password needed

  Coverage
✔ Authentication
✔ Authorization
✔ Pagination
✔ Caching
✔ Rate limiting
✔ Webhooks
✔ External API
✔ Cloud readiness
✔ Clean architecture

🧑‍💻 Author
Nikhil Tripathi
Backend Developer

