import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabase } from '../config/supabase.js'

export const registerUser = async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10)

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: hashedPassword,
        full_name,
        role,
      })
      .select()
      .single()

    if (error) throw error

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    )

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
      token,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    // Get user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    console.log(`
╔════════════════════════════════════════════════╗
║          LOGIN ENDPOINT                        ║
╚════════════════════════════════════════════════╝
Email: ${email}
User found: ${user ? '✅ YES' : '❌ NO'}
User ID in database: ${user?.id}
    `)

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Compare password
    const isPasswordValid = await bcryptjs.compare(password, user.password_hash)

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    )

    console.log(`
✅ Token generated with user.id: ${user.id}
Token (first 50 chars): ${token.substring(0, 50)}...
    `)

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      },
      token,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, profile_image_url, bio, phone_number, country, city, skills, hourly_rate, response_time_minutes, total_earnings, total_spent, created_at')
      .eq('id', id)
      .single()

    if (error) throw error

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.status(200).json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.status(200).json({ message: 'Profile updated successfully', user })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getFreelancers = async (req, res) => {
  try {
    const { skill, country, minRate, maxRate, sortBy = 'created_at' } = req.query

    let query = supabase
      .from('users')
      .select('id, full_name, profile_image_url, bio, skills, hourly_rate, average_rating, total_orders')
      .eq('role', 'freelancer')
      .eq('status', 'active')

    if (skill) {
      query = query.contains('skills', [skill])
    }

    if (country) {
      query = query.eq('country', country)
    }

    if (minRate) {
      query = query.gte('hourly_rate', parseFloat(minRate))
    }

    if (maxRate) {
      query = query.lte('hourly_rate', parseFloat(maxRate))
    }

    query = query.order(sortBy, { ascending: false })

    const { data: freelancers, error } = await query.limit(50)

    if (error) throw error

    res.status(200).json(freelancers)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
