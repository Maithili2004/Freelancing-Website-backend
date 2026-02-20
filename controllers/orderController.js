import { supabase } from '../config/supabase.js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export const createOrder = async (req, res) => {
  try {
    const { gig_id } = req.body
    const buyer_id = req.user.id

    // Get gig details
    const { data: gig, error: gigError } = await supabase
      .from('gigs')
      .select('*')
      .eq('id', gig_id)
      .single()

    if (gigError || !gig) {
      return res.status(404).json({ error: 'Gig not found' })
    }

    // Create order with 'requested' status (waiting for freelancer to accept)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        gig_id,
        buyer_id,
        seller_id: gig.seller_id,
        price: gig.price,
        status: 'requested',
        delivery_status: 'pending',
      })
      .select()
      .single()

    if (orderError) throw orderError

    res.status(201).json({
      message: 'Order request sent to freelancer',
      order,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const markWorkDone = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user?.id

    // Get order
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Check authorization - only freelancer can mark work done
    if (order.seller_id !== userId) {
      return res.status(403).json({ error: 'Only freelancer can mark work as done' })
    }

    // Check if payment is done
    if (!order.paid_at) {
      return res.status(400).json({ error: 'Payment must be completed first' })
    }

    // Update a timestamp to mark when work was submitted (using completed_at as a marker if not already set)
    // Or just return the order as-is - the UI will show "Waiting for client approval"

    res.status(200).json({
      message: 'Work marked as done. Waiting for client approval.',
      data: order,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const approveDelivery = async (req, res) => {
  try {
    const { id } = req.params

    // Get order
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Check authorization - only buyer can approve delivery
    if (order.buyer_id !== req.user.id) {
      return res.status(403).json({ error: 'Only buyer can approve delivery' })
    }

    // Update delivery status to approved
    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({
        delivery_status: 'approved',
        completed_at: new Date().toISOString(),
        status: 'completed',
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.status(200).json({
      message: 'Delivery approved successfully',
      order: updatedOrder,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
export const getOrders = async (req, res) => {
  try {
    const { type = 'all' } = req.query
    const user_id = req.user.id

    let query = supabase
      .from('orders')
      .select('*')

    if (type === 'bought') {
      query = query.eq('buyer_id', user_id)
    } else if (type === 'sold') {
      query = query.eq('seller_id', user_id)
    } else {
      query = query.or(`buyer_id.eq.${user_id},seller_id.eq.${user_id}`)
    }

    const { data: orders, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    // Fetch gig and user details for each order
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        // Get gig details
        const { data: gig } = await supabase
          .from('gigs')
          .select('id, title, images, price, description')
          .eq('id', order.gig_id)
          .single()

        // Get seller details
        const { data: seller } = await supabase
          .from('users')
          .select('id, full_name, profile_image_url')
          .eq('id', order.seller_id)
          .single()

        // Get buyer details
        const { data: buyer } = await supabase
          .from('users')
          .select('id, full_name, profile_image_url')
          .eq('id', order.buyer_id)
          .single()

        return {
          ...order,
          gig,
          seller,
          buyer,
        }
      })
    )

    res.status(200).json(enrichedOrders)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        gig:gigs(title, description, images, category),
        buyer:buyer_id(full_name, profile_image_url, email),
        seller:seller_id(full_name, profile_image_url, email)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Check access
    if (order.buyer_id !== req.user.id && order.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized access' })
    }

    res.status(200).json(order)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    // Get order
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Check authorization
    if (order.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Only seller can update order status' })
    }

    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({
        status,
        seller_submitted_at: status === 'delivered' ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.status(200).json({
      message: 'Order status updated',
      order: updatedOrder,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const acceptOrderRequest = async (req, res) => {
  try {
    const { id } = req.params

    // Get order
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Check authorization - only seller can accept
    if (order.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Only seller can accept order request' })
    }

    // Check if order is in "requested" status
    if (order.status !== 'requested') {
      return res.status(400).json({ error: 'Order is not in requested status' })
    }

    // Update status to pending (waiting for payment)
    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({ status: 'pending' })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.status(200).json({
      message: 'Order request accepted. Waiting for client payment.',
      order: updatedOrder,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const rejectOrderRequest = async (req, res) => {
  try {
    const { id } = req.params

    // Get order
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Check authorization - only seller can reject
    if (order.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Only seller can reject order request' })
    }

    // Check if order is in "requested" status
    if (order.status !== 'requested') {
      return res.status(400).json({ error: 'Order is not in requested status' })
    }

    // Update status to cancelled
    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.status(200).json({
      message: 'Order request rejected',
      order: updatedOrder,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const createPaymentIntent = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user?.id

    // Get order
    const { data: order } = await supabase
      .from('orders')
      .select('*, gig:gigs(title, description)')
      .eq('id', id)
      .single()

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Check authorization - only buyer can pay
    if (order.buyer_id !== userId) {
      return res.status(403).json({ 
        error: 'Only buyer can pay for order',
        yourId: userId,
        buyerId: order.buyer_id
      })
    }

    // Check if order is in "pending" status (freelancer has accepted)
    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Order is not ready for payment yet' })
    }

    // Debug environment
    const frontendUrl = process.env.FRONTEND_URL
    const successUrl = `${frontendUrl}/payment-success?order=${order.id}`
    const cancelUrl = `${frontendUrl}/client-dashboard?payment=cancelled&order=${order.id}`

    // Create Stripe checkout session
    let session
    try {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'inr',
              product_data: {
                name: order.gig.title,
                description: order.gig.description,
              },
              unit_amount: Math.round(order.price * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          order_id: order.id,
          gig_id: order.gig_id,
          buyer_id: order.buyer_id,
        },
      })
    } catch (stripeError) {
      throw stripeError
    }

    // Update order with Stripe payment intent ID
    await supabase
      .from('orders')
      .update({ stripe_payment_intent_id: session.payment_intent })
      .eq('id', order.id)

    res.status(200).json({
      message: 'Payment session created',
      checkout_url: session.url,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}



// ============================================
// CONFIRM PAYMENT - Mark order as paid
// ============================================
export const confirmPayment = async (req, res) => {
  try {
    const { id } = req.params

    // Step 1: Fetch order
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchErr || !order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Step 2: If already paid, return
    if (order.paid_at) {
      return res.status(200).json({ message: 'Already paid', data: order })
    }

    // Step 3: Update paid_at
    const now = new Date().toISOString()

    const { data: updated, error: updateErr } = await supabase
      .from('orders')
      .update({ paid_at: now })
      .eq('id', id)
      .select()
      .single()

    if (updateErr) {
      return res.status(500).json({ error: 'Supabase error', details: updateErr })
    }

    res.json({ message: 'Confirmed', data: updated })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const approveOrder = async (req, res) => {
  try {
    const { id } = req.params

    // Get order
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Check authorization
    if (order.buyer_id !== req.user.id) {
      return res.status(403).json({ error: 'Only buyer can approve order' })
    }

    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({
        status: 'completed',
        buyer_approved_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.status(200).json({
      message: 'Order approved',
      order: updatedOrder,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    // Get order
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Check authorization
    if (order.buyer_id !== req.user.id && order.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.status(200).json({
      message: 'Order cancelled',
      order: updatedOrder,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const handlePaymentWebhook = async (req, res) => {
  try {
    let event = req.body
    console.log(`\n[paymentWebhook] Received webhook event type: ${event.type}`)

    // In production, verify webhook signature
    if (process.env.NODE_ENV === 'production') {
      const sig = req.headers['stripe-signature']
      try {
        event = stripe.webhooks.constructEvent(
          req.rawBody,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        )
        console.log(`[paymentWebhook] ✅ Signature verified`)
      } catch (err) {
        console.log(`[paymentWebhook] ⚠️  Webhook signature verification failed.`, err.message)
        return res.status(400).send(`Webhook Error: ${err.message}`)
      }
    }

    // Handle payment success
    if (event.type === 'charge.succeeded' || event.type === 'payment_intent.succeeded') {
      const charge = event.data?.object || event.data
      const orderId = charge.metadata?.order_id

      console.log(`[paymentWebhook] Payment event detected. Order ID: ${orderId}`)

      if (orderId) {
        // Update order status to in_progress (payment successful, work starts)
        const { data: updatedOrder, error } = await supabase
          .from('orders')
          .update({
            status: 'in_progress',
            paid_at: new Date().toISOString(),
          })
          .eq('id', orderId)
          .select()
          .single()

        if (error) {
          console.error(`[paymentWebhook] ❌ Update failed:`, error)
          throw error
        }

        console.log(`[paymentWebhook] ✅ Order ${orderId} marked as in_progress. New status: ${updatedOrder.status}`)
        
        return res.status(200).json({ 
          message: 'Payment processed successfully',
          order: updatedOrder 
        })
      }
    }

    console.log(`[paymentWebhook] Event type not handled: ${event.type}`)
    res.status(200).json({ message: 'Webhook event received' })
  } catch (error) {
    console.error('[paymentWebhook] ❌ Error:', error)
    res.status(500).json({ error: error.message })
  }
}
