import express from 'express'
import { createGig, getGigs, getGigById, updateGig, deleteGig, getSellerGigs } from '../controllers/gigController.js'
import { authenticateToken, authorizeRole } from '../middleware/auth.js'
import { validateGig, handleValidationErrors } from '../middleware/validation.js'

const router = express.Router()

router.post('/', authenticateToken, authorizeRole(['freelancer']), validateGig, handleValidationErrors, createGig)
router.get('/', getGigs)
router.get('/my-gigs', authenticateToken, authorizeRole(['freelancer']), getSellerGigs)
router.get('/:id', getGigById)
router.put('/:id', authenticateToken, authorizeRole(['freelancer']), updateGig)
router.delete('/:id', authenticateToken, authorizeRole(['freelancer']), deleteGig)

export default router
