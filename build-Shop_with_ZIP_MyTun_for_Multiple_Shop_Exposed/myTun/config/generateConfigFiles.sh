#!/bin/bash

umask 000

########### credentials.json file creation ###########
# Set credentials in json
credentials_json_content='{
  "AccountTag": "'"${ACCOUNT_TAG}"'",
  "TunnelSecret": "'"${TUNNEL_SECRET}"'",
  "TunnelID": "'"${TUNNEL_ID}"'"
}'

# Print in file
echo "$credentials_json_content" > "./myTun/config/mytun-credentials.json"
echo "credentials.json file created !"

############ Create config.yml file ###########
CGF="./myTun/config/mytun-config.yml"

if [ ! -f "$CGF" ]; then
  echo "tunnel: \"$TUNNEL_ID\"" >> "$CGF"
  echo "credentials-file: /credentials.json" >> "$CGF"
  echo "ingress:" >> "$CGF"
fi
# Set config in yaml
if ! grep -q "hostname: \"$PS_DOMAIN\"" "$CGF"; then
    sed -i '' '/service: http_status:404/d' "$CGF"
    echo "  - hostname: \"$PS_DOMAIN\"" >> "$CGF"
    echo "    service: http://shop${SHOP_ID}-prestashop:80" >> "$CGF"
    echo "    originRequest:" >> "$CGF"  
    echo "      httpHostHeader: \"$PS_DOMAIN\"" >> "$CGF"
    echo "  - service: http_status:404" >> "$CGF"
fi

# Print in file
echo "config.yml file created !"
