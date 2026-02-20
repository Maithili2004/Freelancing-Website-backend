# Freelance Marketplace

A full-featured online marketplace for freelancers, similar to Fiverr or Upwork.

## Features

### For Clients
- 👤 User registration and authentication
- 🔍 Browse and search gigs by category, keyword, and price range
- 📝 View freelancer profiles and reviews
- 💳 Purchase gigs with Stripe payment integration
- 📋 Order management with real-time status tracking
- 💬 Direct messaging with freelancers
- ⭐ Leave reviews and ratings for completed work
- 📊 Client dashboard with order stats and spending analytics

### For Freelancers
- 👤 User registration and authentication
- 📝 Create, edit, and delete service gigs
- 💼 Manage incoming orders and requests
- ✅ Mark work as completed and track deliverables
- 💬 Real-time chat with clients
- 💰 Earnings tracking and revenue analytics
- ⭐ View and track client ratings
- 📊 Freelancer dashboard with comprehensive statistics

### Common Features
- 🔐 Secure JWT-based authentication
- 💳 Stripe payment integration (test mode)
- 📱 Responsive mobile-friendly design
- 💬 Real-time messaging with Socket.io
- 🎨 Clean, professional UI with Tailwind CSS
- 🚀 Production-ready code (no debug logging)

## Tech Stack

### Frontend
- React.js with Vite
- Tailwind CSS for styling
- React Router for navigation
- React Hook Form + Zod for form validation
- Zustand for state management
- Axios for API calls
- Socket.io client for real-time chat
- Stripe integration

### Backend
- Node.js + Express.js
- Supabase (PostgreSQL database + auth)
- JWT for authentication
- Stripe API for payments
- Socket.io for real-time features
- Multer for file uploads (optional)

## Project Structure

```
freelance-marketplace/
├── frontend/                  # React frontend (Vite)
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── LandingPage.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── BrowseGigs.jsx
│   │   │   ├── GigDetail.jsx
│   │   │   ├── GigCard.jsx
│   │   │   ├── ClientDashboard.jsx
│   │   │   ├── FreelancerDashboard.jsx
│   │   │   ├── OrderDetail.jsx
│   │   │   ├── Chat.jsx
│   │   │   └── PaymentSuccess.jsx
│   │   ├── hooks/            # Custom hooks
│   │   ├── utils/            # API clients and utilities
│   │   ├── store/            # Zustand state management
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── .env.example
│
├── server/                    # Node.js/Express backend
│   ├── controllers/          # Business logic
│   │   ├── authController.js
│   │   ├── gigController.js
│   │   ├── orderController.js
│   │   ├── messageController.js
│   │   └── reviewController.js
│   ├── routes/               # API routes
│   ├── middleware/           # Authentication & validation
│   ├── config/               # Configuration
│   ├── index.js              # Server entry point
│   ├── package.json
│   └── .env.example
│
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Supabase account
- Stripe account (for payment testing)

### Installation

#### 1. Clone the repository
```bash
git clone <repo-url>
cd freelance-marketplace
```

#### 2. Setup Backend
```bash
cd server

# Copy environment variables
cp .env.example .env

# Install dependencies
npm install

# Update .env with your Supabase and Stripe credentials

# Start server
npm run dev
```

#### 3. Setup Frontend
```bash
cd frontend

# Copy environment variables
cp .env.example .env

# Install dependencies
npm install

# Update .env with your API base URL

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend API at `http://localhost:5000`

## Database Setup

1. Create a Supabase project at https://supabase.com
2. Go to SQL Editor
3. Copy and paste the contents of `server/config/schema.sql`
4. Execute the SQL to create all tables

## Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=7d
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_PUBLIC_KEY=your_stripe_public_key
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile/:id` - Get user profile
- `PUT /api/auth/profile/:id` - Update user profile

### Gigs
- `POST /api/gigs` - Create new gig (Freelancer only)
- `GET /api/gigs` - Get all gigs with filtering
- `GET /api/gigs/:id` - Get gig details
- `PUT /api/gigs/:id` - Update gig
- `DELETE /api/gigs/:id` - Delete gig

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status
- `PUT /api/orders/:id/approve` - Approve order

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages/conversations` - Get all conversations
- `GET /api/messages/:other_user_id` - Get conversation

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/gig/:gig_id` - Get gig reviews
- `GET /api/reviews/user/:user_id` - Get user reviews

## Features Implementation Timeline

### Phase 1 (✅ Completed)
- ✅ Project setup with React Vite + Express
- ✅ Database schema (Supabase PostgreSQL)
- ✅ Authentication system (Register/Login)
- ✅ User profiles and role management
- ✅ Gig CRUD operations
- ✅ UI components and styling

### Phase 2 (✅ Completed)
- ✅ Order management system
- ✅ Payment processing (Stripe integration)
- ✅ Real-time messaging system
- ✅ Reviews and ratings
- ✅ Role-based dashboards (Client & Freelancer)
- ✅ Order status tracking
- ✅ Payment confirmation flow
- ✅ Statistics and analytics cards
- ✅ Clean UI with filtering and sorting

### Phase 3 (✅ Completed)
- ✅ Production-ready code (debug logging removed)
- ✅ Real-time chat with Socket.io
- ✅ Responsive design for all pages
- ✅ Client dashboard with Total Spendings stat
- ✅ Freelancer dashboard with earnings tracking
- ✅ Search and category filtering

### Phase 4 (🔄 Ongoing/Optional)
- ⏳ Admin panel
- ⏳ Dispute resolution system
- ⏳ Advanced analytics
- ⏳ Email notifications
- ⏳ Mobile app (React Native)

## Contributing

Feel free to fork and submit pull requests for any improvements.

## Deployment

### Frontend Deployment (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy the dist/ folder
```

### Backend Deployment (Render/Heroku)
```bash
cd server
npm run build
# Configure environment variables
# Deploy
```

## Troubleshooting

### Common Issues
- **API connection fails**: Ensure backend server is running on port 5000
- **Stripe errors**: Check Stripe keys in `.env` file
- **Database connection**: Verify Supabase credentials
- **Real-time chat not working**: Ensure Socket.io is properly configured

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.
