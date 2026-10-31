# @rym-lib/express-cli

A library that allows you to execute Express applications directly as CLI interfaces without starting a server.

## Features

- 🚀 **Reuse Existing Express Apps**: Execute Express routes directly without server startup
- 🔄 **Batch Processing**: Execute multiple requests in parallel or series
- 🛠️ **Middleware Utilization**: Use existing Express middleware as-is
- 📁 **File Loading**: Load request bodies directly from JSON files

## Installation

```bash
npm install @rym-lib/express-cli
```

## Basic Usage

```javascript
import express from 'express';
import { expressCli } from '@rym-lib/express-cli';

const app = express();

app.get('/api/users', (req, res) => {
  res.json({ users: ['user1', 'user2'] });
});

// Execute as CLI
expressCli(app).parse(process.argv);
```

## CLI Usage Examples

### Single Request

```bash
# GET request
node cli.js /api/users

# POST request
node cli.js /api/users --method=POST --body='{"name":"test"}'

# Request with headers
node cli.js /api/users --headers='{"authorization":"Bearer token"}'

# Load body from file
node cli.js /api/users --method=POST --body=@user.json
```

### Batch Processing

```bash
# Parallel execution (default)
node cli.js batch \
  "/api/users --method=GET" \
  "/api/posts --method=GET"

# Series execution
node cli.js batch --series \
  "/api/users --method=POST --body='{\"name\":\"user1\"}'" \
  "/api/users --method=POST --body='{\"name\":\"user2\"}'"

# Continue on error
node cli.js batch --continue-on-error \
  "/api/users --method=GET" \
  "/invalid/path --method=GET"
```

## API

### expressCli(app, options?)

Converts an Express application to CLI.

#### Parameters

- `app`: Express application instance
- `options`: Configuration options (optional)
  - `verbose`: Enable verbose output
  - `batchOptions`: Batch processing configuration

#### Returns

Commander.js Command instance

## Development Status

Currently in development (v0.0.0). Basic functionality implementation is complete.

## Use Cases

- **API Testing**: Test your Express endpoints without starting a server
- **Data Migration**: Run batch operations on your API endpoints
- **CI/CD Integration**: Execute API operations in serverless environments
- **Development Tools**: Create CLI tools from existing Express applications

## Benefits

- **No Duplicate Code**: Reuse your existing Express routes and middleware
- **Server-less Execution**: Perfect for CI/CD pipelines and serverless environments
- **Development Efficiency**: No need to maintain separate CLI tools

## License

MIT