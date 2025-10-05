#!/bin/bash

echo "🧹 Cleaning build cache..."
rm -rf .next
rm -rf node_modules/.cache

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building project..."
npm run build

echo "✅ Build completed!"
