import express from 'express'
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  approveOrder,
  cancelOrder,
  acceptOrderRequest,
  rejectOrderRequest,
  createPaymentIntent,
  handlePaymentWebhook,
  confirmPayment,
  markWorkDone,
  approveDelivery,
} from '../controllers/orderController.js'
import { authenticateToken } from '../middleware/auth.js'
import { validateOrder, handleValidationErrors } from '../middleware/validation.js'

const router = express.Router()

router.post('/', authenticateToken, validateOrder, handleValidationErrors, createOrder)
router.get('/', authenticateToken, getOrders)
router.get('/:id', authenticateToken, getOrderById)
router.put('/:id/status', authenticateToken, updateOrderStatus)
router.put('/:id/approve', authenticateToken, approveOrder)
router.put('/:id/cancel', authenticateToken, cancelOrder)
router.put('/:id/accept', authenticateToken, acceptOrderRequest)
router.put('/:id/reject', authenticateToken, rejectOrderRequest)
router.put('/:id/mark-work-done', authenticateToken, markWorkDone)
router.put('/:id/approve-delivery', authenticateToken, approveDelivery)
router.post('/:id/payment', authenticateToken, createPaymentIntent)
router.post('/:id/confirm-payment', authenticateToken, confirmPayment)
// Stripe webhook - no auth needed
router.post('/:id/payment-webhook', handlePaymentWebhook)

export default router
