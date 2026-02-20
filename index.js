import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'

dotenv.config()

// Import routes
import authRoutes from './routes/authRoutes.js'
import gigRoutes from './routes/gigRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import messageRoutes from './routes/messageRoutes.js'
import reviewRoutes from './routes/reviewRoutes.js'
import webhookRoutes from './routes/webhookRoutes.js'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})

const PORT = process.env.PORT || 5000

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/gigs', gigRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/webhooks', webhookRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' })
})

// Socket.io for real-time chat
io.on('connection', (socket) => {
  console.log('New user connected:', socket.id)

  // Join user to their own room
  socket.on('user_connected', (userId) => {
    socket.join(`user_${userId}`)
    console.log(`User ${userId} connected to room user_${userId}`)
  })

  // Handle incoming messages
  socket.on('send_message', (data) => {
    const { receiver_id, sender_id, message } = data
    io.to(`user_${receiver_id}`).emit('receive_message', {
      sender_id,
      message,
      timestamp: new Date(),
    })
  })

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Frontend URL: ${process.env.FRONTEND_URL}`)
  console.log(`API Base: http://localhost:${PORT}/api`)
})
