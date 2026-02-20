import { body, validationResult } from 'express-validator'

export const validateRegister = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('role').isIn(['freelancer', 'client']).withMessage('Invalid role'),
]

export const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
]

export const validateGig = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('price').isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
  body('delivery_time_days').isInt({ min: 1 }).withMessage('Delivery time must be at least 1 day'),
]

export const validateOrder = [
  body('gig_id').notEmpty().withMessage('Gig ID is required'),
]

export const validateReview = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').trim().optional(),
  body('professionalism_rating').isInt({ min: 1, max: 5 }).optional(),
  body('communication_rating').isInt({ min: 1, max: 5 }).optional(),
  body('value_for_money_rating').isInt({ min: 1, max: 5 }).optional(),
]

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  next()
}
