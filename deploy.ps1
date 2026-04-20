# FlowSpace Production Deployment Script for Windows

Write-Host "🚀 Starting FlowSpace production deployment..." -ForegroundColor Green

# Check if .env.prod exists
if (-not (Test-Path ".env.prod")) {
    Write-Host "❌ Error: .env.prod file not found!" -ForegroundColor Red
    Write-Host "Please copy .env.prod.example to .env.prod and configure your production environment variables." -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Building production images..." -ForegroundColor Blue

# Build production images
docker-compose -f docker-compose.prod.yml build --no-cache

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build images" -ForegroundColor Red
    exit 1
}

Write-Host "🗄️ Setting up database..." -ForegroundColor Blue

# Start database first
docker-compose -f docker-compose.prod.yml up -d postgres redis

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start database services" -ForegroundColor Red
    exit 1
}

# Wait for database to be ready
Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Run database migrations
Write-Host "🔄 Running database migrations..." -ForegroundColor Blue
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma db push

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Database migration failed, but continuing..." -ForegroundColor Yellow
}

Write-Host "🌐 Starting all services..." -ForegroundColor Blue

# Start all services
docker-compose -f docker-compose.prod.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start services" -ForegroundColor Red
    exit 1
}

Write-Host "🔍 Checking service health..." -ForegroundColor Blue

# Wait for services to start
Start-Sleep -Seconds 30

# Check if services are running
$services = docker-compose -f docker-compose.prod.yml ps
if ($services -match "Up") {
    Write-Host "✅ Services are running!" -ForegroundColor Green
    
    Write-Host "📊 Service Status:" -ForegroundColor Blue
    docker-compose -f docker-compose.prod.yml ps
    
    Write-Host ""
    Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your FlowSpace application is now running at:" -ForegroundColor Cyan
    Write-Host "🌐 Frontend: https://localhost" -ForegroundColor White
    Write-Host "🔧 Backend API: https://localhost/api" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 Useful commands:" -ForegroundColor Yellow
    Write-Host "  View logs: docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor White
    Write-Host "  Stop services: docker-compose -f docker-compose.prod.yml down" -ForegroundColor White
    Write-Host "  Restart services: docker-compose -f docker-compose.prod.yml restart" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "❌ Some services failed to start. Check logs:" -ForegroundColor Red
    docker-compose -f docker-compose.prod.yml logs
    exit 1
}