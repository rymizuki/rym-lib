import express, { type Express } from 'express'

export function createMockExpressApp(): Express {
  const app = express()
  
  // Middleware
  app.use(express.json())
  
  // Test routes
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })
  
  app.get('/api/users', (req, res) => {
    const { limit, offset } = req.query
    const users = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ]
    
    let result = users
    if (limit || offset) {
      const limitNum = parseInt(limit as string) || 10
      const offsetNum = parseInt(offset as string) || 0
      result = users.slice(offsetNum, offsetNum + limitNum)
    }
    
    res.json({ 
      users: result, 
      total: users.length,
      ...(limit || offset ? { 
        pagination: { 
          limit: parseInt(limit as string) || 10, 
          offset: parseInt(offset as string) || 0 
        }
      } : {})
    })
  })
  
  app.get('/api/users/:id', (req, res) => {
    const users = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ]
    const user = users.find(u => u.id === parseInt(req.params.id))
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    res.json({ user })
  })
  
  app.post('/api/users', (req, res) => {
    const { name, email } = req.body
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' })
    }
    
    const newUser = { id: 3, name, email }
    res.status(201).json({ user: newUser, message: 'User created successfully' })
  })
  
  app.put('/api/users/:id', (req, res) => {
    const { name, email } = req.body
    const userId = parseInt(req.params.id)
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' })
    }
    
    const updatedUser = { id: userId, name, email }
    res.json({ user: updatedUser, message: 'User updated successfully' })
  })
  
  app.delete('/api/users/:id', (req, res) => {
    const userId = parseInt(req.params.id)
    const user = { id: userId, name: 'Deleted User', email: 'deleted@example.com' }
    res.json({ user, message: 'User deleted successfully' })
  })
  
  // Protected route
  app.get('/api/admin/stats', (req, res) => {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    res.json({
      stats: {
        totalUsers: 2,
        totalPosts: 1,
        lastActivity: new Date().toISOString()
      }
    })
  })
  
  // Error simulation
  app.get('/api/error', (req, res) => {
    res.status(500).json({ error: 'Internal server error' })
  })
  
  // 404 handler for unmatched routes
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' })
  })
  
  return app
}