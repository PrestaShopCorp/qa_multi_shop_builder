#!/bin/bash
set -e

# CLI Installation
php -d memory_limit=1024M install/index_cli.php \
  --language=fr \
  --timezone=Europe/Paris \
  --domain=${PS_DOMAIN} \
  --db_server=mysql \
  --db_user=prestashop \
  --db_password=prestashop \
  --db_name=prestashop \
  --prefix=ps_ \
  --db_clear=1 \
  --engine=InnoDB \
  --name="MaBoutique" \
  --country=fr \
  --firstname=John \
  --lastname=Doe \
  --password=prestashop \
  --email=admin@prestashop.com \
  --ssl=1 \
  --rewrite=1 \
  --fixtures=0 \
  --modules=""

# Delete install file
rm -rf install

# Rename admin* in admin-dev
ADMIN_DIR=$(ls -d admin* 2>/dev/null | grep -E '^admin([0-9]|$)')

if [ -n "$ADMIN_DIR" ]; then
    mv "$ADMIN_DIR" admin-dev
else
    echo "Aucun dossier BO trouvé à renommer."
fi

echo "Shop Installation Done"

