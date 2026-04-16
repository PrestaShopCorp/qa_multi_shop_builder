DC_FILE=docker-compose.yml
include .env

generate-ngrok-monostore:
	@echo "version: 2" > ngrok.yml
	@echo "region: eu" >> ngrok.yml
	@echo "log_level: debug" >> ngrok.yml
	@echo "web_addr: 0.0.0.0:4040" >> ngrok.yml
	@echo "tunnels:" >> ngrok.yml
	@echo "  prestashop:" >> ngrok.yml
	@echo "    proto: http" >> ngrok.yml
	@echo "    addr: shop1:80" >> ngrok.yml
	@echo "    hostname: ${PS_DOMAIN}" >> ngrok.yml

generate-ngrok-multistore:
	@echo "version: 2" > ngrok.yml
	@echo "region: eu" >> ngrok.yml
	@echo "log_level: debug" >> ngrok.yml
	@echo "web_addr: 0.0.0.0:4040" >> ngrok.yml
	@echo "tunnels:" >> ngrok.yml
	@echo "  prestashop:" >> ngrok.yml
	@echo "    proto: http" >> ngrok.yml
	@echo "    addr: nginx_proxy:80" >> ngrok.yml
	@echo "    hostname: ${PS_DOMAIN}" >> ngrok.yml

generate-ngrok-flashlight:
	@echo "version: 2" > ngrok.yml
	@echo "region: eu" >> ngrok.yml
	@echo "log_level: debug" >> ngrok.yml
	@echo "web_addr: 0.0.0.0:4040" >> ngrok.yml
	@echo "tunnels:" >> ngrok.yml
	@echo "  prestashop-flashlight:" >> ngrok.yml
	@echo "    proto: http" >> ngrok.yml
	@echo "    addr: prestashop-flashlight:80" >> ngrok.yml
	@echo "    hostname: ${PS_DOMAIN}" >> ngrok.yml

monostore: generate-ngrok-monostore
	sed -i '' 's/^      PHYSICAL_URI:/#      PHYSICAL_URI:/' $(DC_FILE)
	docker compose --profile monostore up --build -d
	@echo "⏳ Installation de la Shop cours, merci de patienter..."
	@docker compose logs -f --no-color shop1 | awk '/AH00558: apache2:/ { exit }'
	@echo "🌐 Accès à la boutique : https://${PS_DOMAIN}/"

multistore: generate-ngrok-multistore
	sed -i '' 's/^#      PHYSICAL_URI:/      PHYSICAL_URI:/' $(DC_FILE)
	docker compose --profile multistore up --build -d
	@echo "⏳ Installation des deux shops en cours, merci de patienter..."
	@docker compose logs -f --no-color shop1 | awk '/AH00558: apache2:/ { exit }'
	@docker compose logs -f --no-color shop2 | awk '/AH00558: apache2:/ { exit }'
	@echo "🌐 Accès boutique 1 : https://${PS_DOMAIN}/shop1"
	@echo "🌐 Accès boutique 2 : https://${PS_DOMAIN}/shop2"

flashlight: generate-ngrok-flashlight
	docker compose --profile flashlight up --build -d
	@echo "🌐 Accès à la boutique : https://${PS_DOMAIN}/"

down:
	docker compose --profile monostore --profile multistore --profile flashlight down -v
	sed -i '' 's/^#      PHYSICAL_URI:/      PHYSICAL_URI:/' $(DC_FILE)
	rm -f ngrok.yml
	@echo "✅ Environnement arrêté et ngrok.yml supprimé."
