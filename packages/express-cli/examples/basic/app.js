const express = require('express');

const app = express();

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// In-memory data store
let users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
];

let posts = [
  { id: 1, title: 'Hello World', content: 'First post!', authorId: 1 },
  { id: 2, title: 'Express CLI', content: 'Amazing tool!', authorId: 2 }
];

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});

// Users endpoints
app.get('/api/users', (req, res) => {
  const { limit, offset } = req.query;
  let result = users;
  
  // Apply pagination if query parameters are provided
  if (limit || offset) {
    const limitNum = parseInt(limit) || 10;
    const offsetNum = parseInt(offset) || 0;
    result = users.slice(offsetNum, offsetNum + limitNum);
  }
  
  res.json({ 
    users: result,
    total: users.length,
    ...(limit || offset ? { 
      pagination: { 
        limit: parseInt(limit) || 10, 
        offset: parseInt(offset) || 0 
      }
    } : {})
  });
});

app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user });
});

app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ 
      error: 'Name and email are required' 
    });
  }
  
  const newUser = {
    id: Math.max(...users.map(u => u.id)) + 1,
    name,
    email
  };
  
  users.push(newUser);
  res.status(201).json({ 
    user: newUser,
    message: 'User created successfully' 
  });
});

app.put('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const { name, email } = req.body;
  users[userIndex] = { ...users[userIndex], name, email };
  
  res.json({ 
    user: users[userIndex],
    message: 'User updated successfully' 
  });
});

app.delete('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const deletedUser = users.splice(userIndex, 1)[0];
  res.json({ 
    user: deletedUser,
    message: 'User deleted successfully' 
  });
});

// Posts endpoints
app.get('/api/posts', (req, res) => {
  res.json({ 
    posts,
    total: posts.length 
  });
});

app.post('/api/posts', (req, res) => {
  const { title, content, authorId } = req.body;
  
  if (!title || !content || !authorId) {
    return res.status(400).json({ 
      error: 'Title, content, and authorId are required' 
    });
  }
  
  // Verify author exists
  const author = users.find(u => u.id === authorId);
  if (!author) {
    return res.status(400).json({ error: 'Author not found' });
  }
  
  const newPost = {
    id: Math.max(...posts.map(p => p.id)) + 1,
    title,
    content,
    authorId
  };
  
  posts.push(newPost);
  res.status(201).json({ 
    post: newPost,
    message: 'Post created successfully' 
  });
});

// Authentication simulation
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ 
      error: 'Username and password are required' 
    });
  }
  
  // Simulate authentication
  if (username === 'admin' && password === 'secret') {
    res.json({ 
      token: 'fake-jwt-token',
      user: { username: 'admin', role: 'admin' },
      message: 'Login successful' 
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Protected route simulation
app.get('/api/admin/stats', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || authHeader !== 'Bearer fake-jwt-token') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.json({
    stats: {
      totalUsers: users.length,
      totalPosts: posts.length,
      lastActivity: new Date().toISOString()
    }
  });
});

// Error handling
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.path 
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

module.exports = app;