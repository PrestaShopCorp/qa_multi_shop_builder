#!/bin/bash

#Unzip prestashop.zip
unzip -o prestashop.zip install/install_version.php

#Récupére la version de php
PHP_MIN=$(sed -n "s/.*_PS_INSTALL_MINIMUM_PHP_VERSION_.*'\([0-9.]*\)'.*/\1/p" install/install_version.php)
PHP_VERSION=$(echo $PHP_MIN | cut -d. -f1,2)

#Réecrire la 1er ligne du Dockerfile
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS (BSD sed)
    sed -i '' "1s|.*|FROM php:${PHP_VERSION}-apache|" Dockerfile
else
    # Linux / WSL (GNU sed)
    sed -i "1s|.*|FROM php:${PHP_VERSION}-apache|" Dockerfile
fi
#Supprime le fichier 
rm -rf install/
