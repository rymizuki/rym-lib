#!/usr/bin/env node

const app = require('./app');
const { expressCli } = require('../../build/index.js');

// Create CLI from Express app
expressCli(app).parse(process.argv);