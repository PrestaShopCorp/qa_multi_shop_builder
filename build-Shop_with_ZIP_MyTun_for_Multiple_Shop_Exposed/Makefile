DC_FILE=docker-compose.yml
include .env
generateConfigFile:
	PS_DOMAIN=${PS_DOMAIN} ACCOUNT_TAG=${ACCOUNT_TAG} TUNNEL_SECRET=${TUNNEL_SECRET} TUNNEL_ID=${TUNNEL_ID} ./myTun/config/generateConfigFiles.sh

shop: 
	make generateConfigFile
	docker compose up --build -d
	@echo "⏳ Installation de la Shop cours, merci de patienter..."
	@docker compose logs -f --no-color prestashop | awk '/Shop Installation Done/{exit}'
	@echo "✅ Installation terminée."
	@echo "🌐 Accès à la boutique : https://${PS_DOMAIN}/admin-dev"

down:
	docker compose down -v
	@echo "✅ Environnement arrêté."