DC_FILE=docker-compose.yml
include .env
SHOP_ID ?= 0
PS_DOMAIN=${PREFIX}$(SHOP_ID).${DOMAIN}

generate-config-file:
	PS_DOMAIN=${PS_DOMAIN} SHOP_ID=${SHOP_ID} ACCOUNT_TAG=${ACCOUNT_TAG} TUNNEL_SECRET=${TUNNEL_SECRET} TUNNEL_ID=${TUNNEL_ID} ./myTun/config/generateConfigFiles.sh

shop:
	@docker network create prestashop_global 2>/dev/null || true
	make generate-config-file

	PS_PORT=$$((80 + $(SHOP_ID))); \
	MYSQL_PORT=$$((3300 + $(SHOP_ID))); \
	PMA_PORT=$$((3000 + $(SHOP_ID))); \
	PS_PORT=$$PS_PORT MYSQL_PORT=$$MYSQL_PORT PMA_PORT=$$PMA_PORT docker compose -p shop$(SHOP_ID) up --build -d; \

	@echo "⏳ Installation de la Shop cours, merci de patienter..."
	@docker compose logs -f --no-color prestashop | awk '/Shop Installation Done/{exit}'
	@echo "✅ Installation terminée."
	@echo "🌐 Accès à la boutique : https://${PS_DOMAIN}/admin-dev"

down:
	docker compose -p shop$(SHOP_ID) down -v
	@echo "✅ Environnement arrêté."
