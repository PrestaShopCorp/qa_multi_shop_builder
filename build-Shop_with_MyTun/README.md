# 🛍️ PrestaShop avec MyTun — `shop_mytun`

Ce projet permet de lancer une ou deux boutiques PrestaShop accessibles publiquement via Ngrok

---

## ⚙️ Prérequis

1. Faire une demande de Credentials MyTun dans le chanel slack #team-platform-engineering
2. Récupère :
   - Ton **account tag** (ACCOUNT_TAG)
   - Ton **tunnel secret** (TUNNEL_SECRET) 
   - Ton **tunnel id** (TUNNEL_ID)
   - Ton **ps domaine** (PS_DOMAIN) 
   - Ton **domaine** (DOMAIN) 

---

##  AVANT TOUTE ACTION ALLEZ DANS LE BON DOSSIER: => DANS LE TERMINAL TAPER LA COMMANDE "CD build-Shop_with_Mytun"

---

## 🛠️ Configuration

Crée un fichier `.env` à la racine du dossier build-Shop_with_Mytun avec ce contenu (exemple dans le .env.dist) :

```
   - ACCOUNT_TAG="your account tag"
   - TUNNEL_SECRET="your tunel secret"
   - TUNNEL_ID="your tunel id"
   - PS_DOMAIN="prestashop.firstname-name-mytun.prestashop.name"
   - DOMAIN="firstname-name-mytun.prestashop.name"
```
---

## Lancer une boutique (MonoShop)

Dans le terminal lancer la Commande = 

```make monostore```
      
Cette commande :
   - Lance une seule boutique PrestaShop (shop1)
   - Commente la ligne PHYSICAL_URI dans docker-compose.yml
   - Génère automatiquement les fichiers mytun-config.yml & mytun-credentials.yml pour exposer la boutique via MyTun
   - Démarre tous les conteneurs nécessaires en arrière-plan

URL d’accès à la boutique : https://ton_domaine_ngrok/

---

## Lancer deux boutiques (MultiStore - Multi-Instance) NE FONTIONNE PAS AVEC FLASHLIGHT !! IMAGE PRESTASHOP/PRESTASHOP UNIQUEMENT

Dans le terminal lancer la Commande = 

```make multistore```

Cette commande :
   - Décommente la ligne PHYSICAL_URI dans docker-compose.yml
   - Active deux boutiques PrestaShop (shop1 et shop2)
   - Active deux boutiques en multi-instance, donc deux BDD sont créées
   - Génère les fichiers mytun-config.yml & mytun-credentials.yml pointant vers le reverse proxy nginx_proxy
   - Utilise un reverse proxy Nginx pour rediriger /shop1 et /shop2
   - Démarre tous les conteneurs nécessaires en arrière-plan

URL d’accès à la boutique : https://ton_domaine_ngrok/shop1 et https://ton_domaine_ngrok/shop2

---

## Lancer une boutique (flashlight)

Dans le terminal lancer la Commande = 

```make flashlight```
      
Cette commande :
   - Lance une boutique PrestaShop Flashlight
   - Génère automatiquement les fichiers mytun-config.yml & mytun-credentials.yml pour exposer la boutique via MyTun
   - Démarre tous les conteneurs nécessaires en arrière-plan

URL d’accès à la boutique : https://ton_domaine_ngrok/

---

## Nettoyer l’environnement

Avant de relancer un nouveau build, pense à nettoyer les containers

Dans le terminal lancer la Commande = 

```make down```

Cette commande :
   - Arrête tous les conteneurs Docker (monostore, multistore, flashlight)
   - Supprime les volumes associés
   - Réactive la ligne PHYSICAL_URI dans docker-compose.yml si elle avait été commentée

---

## Modifier la version de PrestaShop

Pour changer la version, va sur https://hub.docker.com/r/prestashop/prestashop/tags

Puis, modifie la ligne dans docker-compose.yml :

```
image: prestashop/prestashop:**tag de la version souhaitée**

(ex: image: prestashop/prestashop:8.2-apache)
``` 

=>Tu peux adapter cela pour shop1, shop2, ou tout autre conteneur que tu ajoutes.

---

## Modifier la version de PrestaShop Flashlight

Pour changer la version, va sur https://hub.docker.com/r/prestashop/prestashop-flashlight/tags

Puis, modifie la ligne dans docker-compose.yml :

```
image: prestashop/prestashop-flashlight:**tag de la version souhaitée**

(ex: image: prestashop/prestashop-flashlight:nightly-nginx)
``` 

=>ATTENTION LE MULTISTORE NE FONCTIONNE PAS AVEC FLASLIGHT, MODIFIER UNIQUEMENT LE CONTAINER FLASHLIGHT

---
