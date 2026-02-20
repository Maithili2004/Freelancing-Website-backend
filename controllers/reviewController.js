import { supabase } from '../config/supabase.js'

export const createReview = async (req, res) => {
  try {
    const { gig_id, order_id, reviewed_user_id, rating, comment, professionalism_rating, communication_rating, value_for_money_rating } = req.body
    const reviewer_id = req.user.id

    // Verify order exists and user is the buyer
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single()

    if (!order || order.buyer_id !== reviewer_id) {
      return res.status(403).json({ error: 'Unauthorized to review this order' })
    }

    // Check if review already exists
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('order_id', order_id)
      .single()

    if (existingReview) {
      return res.status(400).json({ error: 'Review already exists for this order' })
    }

    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        gig_id,
        order_id,
        reviewer_id,
        reviewed_user_id,
        rating,
        comment,
        professionalism_rating,
        communication_rating,
        value_for_money_rating,
      })
      .select()
      .single()

    if (error) throw error

    // Update gig average rating
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('gig_id', gig_id)

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

    await supabase
      .from('gigs')
      .update({ average_rating: avgRating })
      .eq('id', gig_id)

    res.status(201).json({
      message: 'Review created successfully',
      review,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getGigReviews = async (req, res) => {
  try {
    const { gig_id } = req.params

    // Simply return empty array - reviews are optional
    // If reviews exist, they'll be returned. If not, empty array is fine.
    const { data: reviews = [], error } = await supabase
      .from('reviews')
      .select('*')
      .eq('gig_id', gig_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn(`[getGigReviews] Supabase query issue (not critical):`, error.message)
      // Still return success - reviews are optional
      return res.status(200).json([])
    }

    console.log(`[getGigReviews] Found ${reviews?.length || 0} reviews`)
    res.status(200).json(reviews || [])
  } catch (error) {
    console.warn('[getGigReviews] Exception (returning empty):', error.message)
    // Always return empty array - don't fail the page if reviews fail
    res.status(200).json([])
  }
}

export const getUserReviews = async (req, res) => {
  try {
    const { user_id } = req.params
    const { data: reviews = [], error } = await supabase
      .from('reviews')
      .select('*')
      .eq('reviewed_user_id', user_id)
      .order('created_at', { ascending: false })

    if (error) {
      // Still return success - reviews are optional
      return res.status(200).json([])
    }

    res.status(200).json(reviews || [])
  } catch (error) {
    // Always return empty array - don't fail the page if reviews fail
    res.status(200).json([])
  }
}

export const updateReview = async (req, res) => {
  try {
    const { id } = req.params
    const { rating, comment, professionalism_rating, communication_rating, value_for_money_rating } = req.body

    // Get review
    const { data: review } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', id)
      .single()

    if (!review || review.reviewer_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to update this review' })
    }

    const { data: updatedReview, error } = await supabase
      .from('reviews')
      .update({
        rating,
        comment,
        professionalism_rating,
        communication_rating,
        value_for_money_rating,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.status(200).json({
      message: 'Review updated successfully',
      review: updatedReview,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params

    // Get review
    const { data: review } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', id)
      .single()

    if (!review || review.reviewer_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to delete this review' })
    }

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.status(200).json({ message: 'Review deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
