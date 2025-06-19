DC_FILE=docker-compose.yml
include .env

shop: 
	docker compose up --build -d
	@echo "🌐 Accès à la boutique : https://${PS_DOMAIN}/"

down:
	docker compose down -v
	@echo "✅ Environnement arrêté."