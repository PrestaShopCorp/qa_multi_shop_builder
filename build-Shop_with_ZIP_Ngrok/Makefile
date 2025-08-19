DC_FILE=docker-compose.yml
include .env

shop: 
	docker compose up --build -d
	@echo "⏳ Installation de la Shop cours, merci de patienter..."
	@docker compose logs -f --no-color prestashop | awk '/Shop Installation Done/{exit}'
	@echo "✅ Installation terminée."
	@echo "🌐 Accès à la boutique : https://${PS_DOMAIN}/admin-dev"

down:
	docker compose down -v
	@echo "✅ Environnement arrêté."