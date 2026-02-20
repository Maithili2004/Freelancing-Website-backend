import express from 'express'
import { sendMessage, getConversation, getConversations, markMessagesAsRead } from '../controllers/messageController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.post('/', authenticateToken, sendMessage)
router.get('/conversations', authenticateToken, getConversations)
router.get('/:other_user_id', authenticateToken, getConversation)
router.put('/read', authenticateToken, markMessagesAsRead)

export default router
