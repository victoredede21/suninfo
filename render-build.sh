#!/bin/bash

# Install all dependencies including dev dependencies
npm install --include=dev

# Run database migrations
npm run db:push

# Build the application
npm run build