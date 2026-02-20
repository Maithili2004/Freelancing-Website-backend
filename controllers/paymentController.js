import Stripe from 'stripe'
import { supabase } from '../config/supabase.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export const handleStripeWebhook = async (event) => {
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object)
        break

      default:
        console.log(`Unhandled event type ${event.type}`)
    }
  } catch (error) {
    console.error('Webhook error:', error)
    throw error
  }
}

const handlePaymentSucceeded = async (paymentIntent) => {
  const { order_id } = paymentIntent.metadata

  try {
    // Update order status to in_progress
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'in_progress',
        stripe_payment_intent_id: paymentIntent.id,
      })
      .eq('id', order_id)

    if (error) throw error

    // Create transaction record
    await supabase
      .from('transactions')
      .insert({
        order_id,
        amount: paymentIntent.amount / 100,
        transaction_type: 'payment',
        payment_method: 'stripe',
        stripe_transaction_id: paymentIntent.id,
        status: 'completed',
      })

    console.log(`Payment succeeded for order ${order_id}`)
  } catch (error) {
    console.error('Error handling successful payment:', error)
    throw error
  }
}

const handlePaymentFailed = async (paymentIntent) => {
  const { order_id } = paymentIntent.metadata

  try {
    // Update order status to cancelled
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
      })
      .eq('id', order_id)

    if (error) throw error

    console.log(`Payment failed for order ${order_id}`)
  } catch (error) {
    console.error('Error handling failed payment:', error)
    throw error
  }
}

export const createStripeCheckout = async (orderId, price, gigTitle) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: gigTitle,
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/order/${orderId}?status=success`,
      cancel_url: `${process.env.FRONTEND_URL}/order/${orderId}?status=cancelled`,
      metadata: {
        order_id: orderId,
      },
    })

    return session.url
  } catch (error) {
    console.error('Stripe checkout error:', error)
    throw error
  }
}

export const refundPayment = async (stripeTransactionId, amount) => {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: stripeTransactionId,
      amount: Math.round(amount * 100),
    })

    return refund
  } catch (error) {
    console.error('Stripe refund error:', error)
    throw error
  }
}
