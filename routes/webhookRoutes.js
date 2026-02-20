import express from 'express'
import Stripe from 'stripe'
import { handleStripeWebhook } from '../controllers/paymentController.js'

const router = express.Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return res.status(400).send('Missing Stripe signature or webhook secret')
  }

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)

    await handleStripeWebhook(event)
    res.json({ received: true })
  } catch (error) {
    console.error('Webhook Error:', error.message)
    res.status(400).send(`Webhook Error: ${error.message}`)
  }
})

export default router
