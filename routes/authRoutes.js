import express from 'express'
import { registerUser, loginUser, getUserProfile, updateUserProfile, getFreelancers } from '../controllers/authController.js'
import { validateRegister, validateLogin, handleValidationErrors } from '../middleware/validation.js'

const router = express.Router()

router.post('/register', validateRegister, handleValidationErrors, registerUser)
router.post('/login', validateLogin, handleValidationErrors, loginUser)
router.get('/profile/:id', getUserProfile)
router.put('/profile/:id', updateUserProfile)
router.get('/freelancers', getFreelancers)

export default router
