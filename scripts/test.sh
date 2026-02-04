#!/bin/bash
set -e

echo "🧪 Running tests..."

# Run all tests with coverage
npm run test:coverage

echo "✅ All tests passed!"
