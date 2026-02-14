Hostinger Web App (Node.js) Deployment

This is a [Next.js](https://nextjs.org) project designed for a restaurant management system, optimized for deployment on Hostinger using Node.js or Docker (via Easypanel).

## 🚀 Deployment Status

Currently running on: **Hostinger VPS**

- **Frontend/Backend**: Next.js App Router
- **Database**: Hostinger MySQL (managed via Drizzle ORM)
- **deployment Strategy**: Docker container via Easypanel (or direct Node.js app)

## 🛠️ Quick Setup (Local)

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🔌 API Documentation for n8n

This application exposes several API endpoints to interact with external tools like n8n or WhatsApp bots.

**Base URL**: `https://your-domain.com` (or localhost:3000 for testing)
**Authentication**: All requests must include the header:
`x-api-key: YOUR_SECRET_API_KEY`

### 1. Customers

#### Get Customer by Phone
Use this to check if a customer already exists in the database.

- **Endpoint**: `GET /api/customers/search`
- **Query Params**: `?phone=5491112345678`
- **Response**:
  - `200 OK`: Returns customer object `{ id, name, address, ... }`
  - `404 Not Found`: Customer does not exist.

#### Create Customer
Register a new customer.

- **Endpoint**: `POST /api/customers`
- **Body (JSON)**:
  ```json
  {
    "name": "Juan Pérez",
    "phone": "5491112345678",
    "address": "Av. Corrientes 1234" // Optional
  }
  ```
- **Response**: `201 Created` with `{ customerId, status }`

### 2. Products

#### Get All Products
Retrieve the full list of products available for your business.

- **Endpoint**: `GET /api/products`
- **Response**:
  - `200 OK`: Returns an array of product objects.
  ```json
  [
    {
      "id": "uuid...",
      "name": "Pizza Mozzarella",
      "price": 12000.00,
      "category": "Pizzas",
      "isAvailable": true
    },
    ...
  ]
  ```

### 3. Orders

#### Create Order
Submit a new order from an external source (e.g., WhatsApp).

- **Endpoint**: `POST /api/orders`
- **Body (JSON)**:
  ```json
  {
    "customer": {
      "name": "Juan Pérez",
      "phone": "5491112345678",
      "address": "Av. Corrientes 1234"
    },
    "items": [
      {
        "name": "Pizza Mozzarella",
        "quantity": 1,
        "price": 12000,
        "notes": "Sin orégano"
      }
    ],
    "total": 12000,
    "status": "pending",
    "source": "whatsapp"
  }
  ```
- **Response**: `201 Created` with `{ orderId }`

## � Deployment Guides

For detailed deployment instructions on Hostinger:

- **[QUICKSTART.md](./QUICKSTART.md)** - Rapid deployment guide.
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - comprehensive step-by-step documentation.
- **[easypanel-config-example.md](./easypanel-config-example.md)** - Configuration reference for Easypanel.

## 📚 Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

