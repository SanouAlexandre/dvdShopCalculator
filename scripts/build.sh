#!/bin/bash
set -e

echo "Building DVD Shop Calculator..."

# Clean previous build
rm -rf dist

# Install dependencies
npm ci

# Run linting
npm run lint

# Run tests
npm test

# Build TypeScript
npm run build

echo "Build complete!"
