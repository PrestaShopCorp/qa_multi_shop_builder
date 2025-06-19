DC_FILE=docker-compose.yml
include .env

generate-mytun-config:
	PS_DOMAIN=${PS_DOMAIN} ACCOUNT_TAG=${ACCOUNT_TAG} TUNNEL_SECRET=${TUNNEL_SECRET} TUNNEL_ID=${TUNNEL_ID} ./myTun/config/generateConfigFiles.sh $(PROFILE)

monostore:
	make generate-mytun-config PROFILE=monostore
	sed -i '' 's/^      PHYSICAL_URI:/#      PHYSICAL_URI:/' $(DC_FILE)
	docker compose --profile monostore up --build -d
	@echo "🌐 Accès à la boutique : https://${PS_DOMAIN}/"

multistore:
	make generate-mytun-config PROFILE=multistore
	sed -i '' 's/^#      PHYSICAL_URI:/      PHYSICAL_URI:/' $(DC_FILE)
	docker compose --profile multistore up --build -d
	@echo "🌐 Accès boutique 1 : https://${PS_DOMAIN}/shop1"
	@echo "🌐 Accès boutique 2 : https://${PS_DOMAIN}/shop2"

flashlight:
	make generate-mytun-config PROFILE=flashlight
	docker compose --profile flashlight up --build -d
	@echo "🌐 Accès à la boutique : https://${PS_DOMAIN}/"

down:
	docker compose --profile monostore --profile multistore --profile flashlight down -v
	sed -i '' 's/^#      PHYSICAL_URI:/      PHYSICAL_URI:/' $(DC_FILE)
	@echo "✅ Environnement arrêté."