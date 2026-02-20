import { supabase } from '../config/supabase.js'

export const sendMessage = async (req, res) => {
  try {
    const { receiver_id, content, order_id, attachment_url } = req.body
    const sender_id = req.user.id

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        sender_id,
        receiver_id,
        content,
        order_id,
        attachment_url,
      })
      .select()
      .single()

    if (error) throw error

    // TODO: Emit socket event for real-time messaging

    res.status(201).json({
      message: 'Message sent successfully',
      data: message,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getConversation = async (req, res) => {
  try {
    const { other_user_id } = req.params
    const current_user_id = req.user.id

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${current_user_id},receiver_id.eq.${other_user_id}),and(sender_id.eq.${other_user_id},receiver_id.eq.${current_user_id})`)
      .order('created_at', { ascending: true })

    if (error) throw error

    // Mark messages as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', current_user_id)
      .eq('sender_id', other_user_id)

    res.status(200).json(messages)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getConversations = async (req, res) => {
  try {
    const user_id = req.user.id

    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        receiver_id,
        content,
        is_read,
        created_at,
        sender:users(id, full_name, profile_image_url),
        receiver:users(id, full_name, profile_image_url)
      `)
      .or(`sender_id.eq.${user_id},receiver_id.eq.${user_id}`)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Group messages by conversation partner
    const conversations = {}
    messages.forEach((msg) => {
      const partnerId = msg.sender_id === user_id ? msg.receiver_id : msg.sender_id
      const partner = msg.sender_id === user_id ? msg.receiver : msg.sender

      if (!conversations[partnerId]) {
        conversations[partnerId] = {
          partner,
          lastMessage: msg.content,
          lastMessageTime: msg.created_at,
          unreadCount: 0,
        }
      }

      if (!msg.is_read && msg.receiver_id === user_id) {
        conversations[partnerId].unreadCount++
      }
    })

    res.status(200).json(Object.values(conversations))
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const markMessagesAsRead = async (req, res) => {
  try {
    const { sender_id } = req.body
    const receiver_id = req.user.id

    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', sender_id)
      .eq('receiver_id', receiver_id)

    if (error) throw error

    res.status(200).json({ message: 'Messages marked as read' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
