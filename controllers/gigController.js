import { supabase } from '../config/supabase.js'

export const createGig = async (req, res) => {
  try {
    const { title, description, category, price, delivery_time_days, images, features } = req.body
    const seller_id = req.user.id

    const { data: gig, error } = await supabase
      .from('gigs')
      .insert({
        seller_id,
        title,
        description,
        category,
        price,
        delivery_time_days,
        images: images || [],
        features: features || [],
        status: 'active',
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      message: 'Gig created successfully',
      gig,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getGigs = async (req, res) => {
  try {
    const { category, keyword, minPrice, maxPrice, sortBy = 'created_at', page = 1 } = req.query
    const limit = 12
    const offset = (page - 1) * limit

    let query = supabase
      .from('gigs')
      .select('*, seller:users(id, full_name, profile_image_url)', { count: 'exact' })
      .eq('status', 'active')

    if (category) {
      query = query.eq('category', category)
    }

    if (keyword) {
      query = query.ilike('title', `%${keyword}%`)
    }

    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice))
    }

    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice))
    }

    query = query.order(sortBy, { ascending: false }).range(offset, offset + limit - 1)

    const { data: gigs, count, error } = await query

    if (error) throw error

    res.status(200).json({
      gigs,
      total: count,
      page,
      pages: Math.ceil(count / limit),
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getGigById = async (req, res) => {
  try {
    const { id } = req.params

    // Get gig data
    const { data: gig, error: gigError } = await supabase
      .from('gigs')
      .select('*')
      .eq('id', id)
      .single()

    if (gigError) throw gigError

    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' })
    }

    // Get seller data
    const { data: seller } = await supabase
      .from('users')
      .select('id, full_name, profile_image_url, bio, hourly_rate')
      .eq('id', gig.seller_id)
      .single()

    // Get reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating, comment, created_at, reviewer_id')
      .eq('gig_id', id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Increment views
    await supabase
      .from('gigs')
      .update({ total_views: gig.total_views + 1 })
      .eq('id', id)

    res.status(200).json({
      ...gig,
      seller,
      reviews
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const updateGig = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    // Verify ownership
    const { data: gig } = await supabase
      .from('gigs')
      .select('seller_id')
      .eq('id', id)
      .single()

    if (!gig || gig.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to update this gig' })
    }

    const { data: updatedGig, error } = await supabase
      .from('gigs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.status(200).json({
      message: 'Gig updated successfully',
      gig: updatedGig,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const deleteGig = async (req, res) => {
  try {
    const { id } = req.params

    // Verify ownership
    const { data: gig } = await supabase
      .from('gigs')
      .select('seller_id')
      .eq('id', id)
      .single()

    if (!gig || gig.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to delete this gig' })
    }

    // Soft delete: mark as inactive instead of physically deleting
    // This preserves earnings history from completed orders
    const { error } = await supabase
      .from('gigs')
      .update({ status: 'inactive' })
      .eq('id', id)

    if (error) throw error

    res.status(200).json({ message: 'Gig deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getSellerGigs = async (req, res) => {
  try {
    const seller_id = req.user.id

    const { data: gigs, error } = await supabase
      .from('gigs')
      .select('*')
      .eq('seller_id', seller_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) throw error

    res.status(200).json(gigs)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
