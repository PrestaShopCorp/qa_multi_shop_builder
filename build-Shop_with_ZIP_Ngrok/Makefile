DC_FILE=docker-compose.yml
include .env
ZIP_INSTALL_MODE ?= auto

shop: 
	ZIP_INSTALL_MODE=${ZIP_INSTALL_MODE} docker compose up --build -d
	@echo "⏳ Installation de la Shop cours, merci de patienter..."
	@if [ "$(ZIP_INSTALL_MODE)" = "manual" ]; then \
		docker compose logs -f --no-color prestashop | awk '/Shop Ready For Manual Installation/{exit}'; \
		echo "✅ Boutique prête pour une installation manuelle."; \
		echo "🌐 Ouvrez https://${PS_DOMAIN}/ pour terminer l installation."; \
	else \
		docker compose logs -f --no-color prestashop | awk '/Shop Installation Done/{exit}'; \
		echo "✅ Installation terminée."; \
		echo "🌐 Accès à la boutique : https://${PS_DOMAIN}/admin-dev"; \
	fi

down:
	docker compose down -v
	@echo "✅ Environnement arrêté."
