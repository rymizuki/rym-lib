# Express CLI Basic Example

This example demonstrates the core functionality of `@rym-lib/express-cli` with a simple Express application that includes users, posts, and authentication.

## Features Demonstrated

- ✅ Single request execution
- ✅ Batch processing (parallel and series)
- ✅ JSON file loading for request bodies
- ✅ Authentication simulation
- ✅ Error handling
- ✅ Various HTTP methods (GET, POST, PUT, DELETE)

## Setup

```bash
# Install dependencies
npm install

# Build the express-cli package first (from root)
cd ../.. && npm run build
cd examples/basic
```

## Available API Endpoints

### Health Check
- `GET /health` - Simple health check

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post

### Authentication
- `POST /api/login` - Login (username: admin, password: secret)
- `GET /api/admin/stats` - Protected route (requires Bearer token)

## Usage Examples

### Single Requests

```bash
# Health check
node cli.js /health

# Alternative path format (spaces converted to slashes)
node cli.js api users

# Get all users
node cli.js /api/users

# Get user by ID with query parameter
node cli.js /api/users/1

# Get users with query parameters using --key=value
node cli.js /api/users --limit=10 --offset=0

# Create new user with JSON file
node cli.js /api/users --method=POST --body=@data/new-user.json

# Create user with inline JSON
node cli.js /api/users --method=POST --body='{"name":"Bob","email":"bob@example.com"}'

# Login
node cli.js /api/login --method=POST --body=@data/login-credentials.json

# Access protected route using --header format
node cli.js /api/admin/stats --header 'authorization: Bearer fake-jwt-token'

# Multiple headers
node cli.js /api/admin/stats --header 'authorization: Bearer fake-jwt-token' --header 'content-type: application/json'

# Alternative JSON headers format (still supported)
node cli.js /api/admin/stats --headers='{"authorization":"Bearer fake-jwt-token"}'
```

### Batch Processing

```bash
# Parallel execution (default)
node cli.js batch \
  "/health" \
  "/api/users" \
  "/api/posts"

# Series execution
node cli.js batch --series \
  "/api/users --method=POST --body=@data/new-user.json" \
  "/api/posts --method=POST --body=@data/new-post.json"

# Continue on error
node cli.js batch --continue-on-error \
  "/api/users" \
  "/invalid/endpoint" \
  "/api/posts"
```

### Using npm scripts

```bash
# Single request demos
npm run demo:single     # Health check
npm run demo:users      # Get users
npm run demo:create-user # Create user from file
npm run demo:login      # Login

# Batch processing demos
npm run demo:batch      # Parallel batch
npm run demo:batch-create # Series batch with creation

# Run all demos
npm run demo:all
```

## File Structure

```
examples/basic/
├── app.js              # Express application
├── cli.js              # CLI script
├── package.json        # Dependencies and scripts
├── README.md           # This file
└── data/               # Sample JSON data
    ├── new-user.json
    ├── new-post.json
    └── login-credentials.json
```

## Expected Output

### Health Check
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Get Users
```json
{
  "users": [
    { "id": 1, "name": "John Doe", "email": "john@example.com" },
    { "id": 2, "name": "Jane Smith", "email": "jane@example.com" }
  ],
  "total": 2
}
```

### Create User
```json
{
  "user": {
    "id": 3,
    "name": "Alice Johnson",
    "email": "alice@example.com"
  },
  "message": "User created successfully"
}
```

## Tips

- Use `--verbose` flag for detailed output including status codes and headers
- JSON files in `data/` directory can be customized for your testing needs
- The example includes middleware, authentication, and error handling to demonstrate real-world usage
- Try modifying the Express app to see how changes reflect in CLI execution