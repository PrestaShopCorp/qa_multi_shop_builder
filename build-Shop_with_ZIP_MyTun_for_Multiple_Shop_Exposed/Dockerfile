FROM php:7.2-apache

# Ajouter le script d'installation des extensions PHP
ADD https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/

# Rendre le script exécutable
RUN chmod uga+x /usr/local/bin/install-php-extensions && sync

# Désactiver les invites interactives pendant l'installation
ENV DEBIAN_FRONTEND=nointeractive

# Mise à jour des dépôts et installation des dépendances
RUN apt-get update -y && apt-get upgrade -y && apt-get install -y \
    curl \
    git \
    nodejs \
    zip \
    unzip \
    apt-utils \
    mailutils

# Installation des extensions PHP nécessaires
RUN install-php-extensions \
    bcmath \
    bz2 \
    calendar \
    imap \
    exif \
    gd \
    intl \
    ldap \
    memcached \
    mysqli \
    opcache \
    pdo_mysql \
    pdo_pgsql \
    pgsql \
    redis \
    soap \
    xsl \
    zip \
    xdebug \
    sockets

# Installer Composer
RUN install-php-extensions @composer-1

# Activer mod_rewrite pour Apache
RUN a2enmod rewrite

# Exposer le port par défaut d'Apache
EXPOSE 80
