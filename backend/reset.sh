#!/bin/bash

echo "🧹 Resetting Harmonic Jam Backend..."

# Stop and remove containers and volumes
echo "📦 Stopping containers and removing volumes..."
docker compose down --volumes --remove-orphans

# Remove the database volume
echo "🗄️  Removing database volume..."
docker volume rm backend_postgres_data 2>/dev/null || echo "Volume already removed"

# Remove the Docker image
echo "🐳 Removing Docker image..."
docker rmi backend-web-api:latest 2>/dev/null || echo "Image already removed"

# Rebuild from scratch
echo "🔨 Rebuilding containers..."
docker compose build --no-cache

# Start the services
echo "🚀 Starting services..."
docker compose up

echo "✅ Reset complete! Backend should be running at http://localhost:8000"
echo "📚 API docs available at http://localhost:8000/docs" 