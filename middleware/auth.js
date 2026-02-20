import jwt from 'jsonwebtoken'

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Log for payment requests
    if (req.url?.includes('/payment') || req.url?.includes('/confirm-payment')) {
      console.log(`
╔════════════════════════════════════════════════╗
║      AUTH MIDDLEWARE - TOKEN DECODED           ║
╚════════════════════════════════════════════════╝
URL: ${req.url}
Token decoded payload:
  - id: ${decoded.id}
  - email: ${decoded.email}
  - role: ${decoded.role}
req.user.id will be: ${decoded.id}
Timestamp: ${new Date().toISOString()}
      `)
    }
    
    req.user = decoded
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}

export const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    
    next()
  }
}

export const verifyOwnership = (resourceOwnerId) => {
  return (req, res, next) => {
    if (req.user.id !== resourceOwnerId) {
      return res.status(403).json({ error: 'Access denied. Resource not owned by user.' })
    }
    next()
  }
}
