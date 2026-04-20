#!/bin/bash

# FlowSpace Production Deployment Script

set -e

echo "🚀 Starting FlowSpace production deployment..."

# Check if .env.prod exists
if [ ! -f .env.prod ]; then
    echo "❌ Error: .env.prod file not found!"
    echo "Please copy .env.prod.example to .env.prod and configure your production environment variables."
    exit 1
fi

# Load environment variables
export $(cat .env.prod | grep -v '^#' | xargs)

echo "📦 Building production images..."

# Build production images
docker-compose -f docker-compose.prod.yml build --no-cache

echo "🗄️ Setting up database..."

# Start database first
docker-compose -f docker-compose.prod.yml up -d postgres redis

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run database migrations
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma db push
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma db seed

echo "🌐 Starting all services..."

# Start all services
docker-compose -f docker-compose.prod.yml up -d

echo "🔍 Checking service health..."

# Wait for services to start
sleep 30

# Check if services are running
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "✅ Services are running!"
    
    echo "📊 Service Status:"
    docker-compose -f docker-compose.prod.yml ps
    
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo ""
    echo "Your FlowSpace application is now running at:"
    echo "🌐 Frontend: https://${FRONTEND_URL:-localhost}"
    echo "🔧 Backend API: ${BACKEND_URL:-https://localhost}/api"
    echo ""
    echo "📝 Useful commands:"
    echo "  View logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "  Stop services: docker-compose -f docker-compose.prod.yml down"
    echo "  Restart services: docker-compose -f docker-compose.prod.yml restart"
    echo ""
else
    echo "❌ Some services failed to start. Check logs:"
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi