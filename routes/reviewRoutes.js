import express from 'express'
import { createReview, getGigReviews, getUserReviews, updateReview, deleteReview } from '../controllers/reviewController.js'
import { authenticateToken } from '../middleware/auth.js'
import { validateReview, handleValidationErrors } from '../middleware/validation.js'

const router = express.Router()

router.post('/', authenticateToken, validateReview, handleValidationErrors, createReview)
router.get('/gig/:gig_id', getGigReviews)
router.get('/user/:user_id', getUserReviews)
router.put('/:id', authenticateToken, updateReview)
router.delete('/:id', authenticateToken, deleteReview)

export default router
