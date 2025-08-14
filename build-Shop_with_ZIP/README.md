# 🛍️ PrestaShop avec ZIP — `shop_with_zip`

Ce projet permet de créer une boutiques PrestaShop à partir d'un zip, accessibles publiquement via Ngrok

---

## ⚙️ Prérequis

1. Crée un compte gratuit sur [https://dashboard.ngrok.com]
2. Récupère :
   - Ton **token Ngrok** (NGROK_AUTHTOKEN)
   - Ton **domaine ngrok** (PS_DOMAIN) comme `a123-456-789.ngrok-free.app`

---

##  AVANT TOUTE ACTION ALLEZ DANS LE BON DOSSIER: => DANS LE TERMINAL TAPER LA COMMANDE "CD build-Shop_with_ZIP"

---

## 🛠️ Configuration

Crée un fichier `.env` à la racine du dossier build-Shop_with_Ngrok avec ce contenu (exemple dans le .env.dist) :
```
   -  NGROK_AUTHTOKEN="ton_token_ngrok"
   -  PS_DOMAIN="ton_domaine_ngrok"

```

---

Dézipper le dossier de la version souhaitez contenant le prestashop.zip

---

![alt text](/build-Shop_with_ZIP/screenshots_for_readme/image.png)

---

Gilsser le prestashop.zip à la racine du dossier build-Shop_with_ZIP

---

![alt text](/build-Shop_with_ZIP/screenshots_for_readme/image1.png)

---

## Lancer le build de la shop

Dans le terminal lancer la Commande = 

```make shop```
      
Cette commande :
   - Lance lance le build de la shop contenue dans le prestashop.zip
   - Démarre tous les conteneurs nécessaires en arrière-plan

URL d’accès à la boutique : https://ton_domaine_ngrok/admin-dev

---

Si vous rencontrez une erreur 500, cela signifie qu'il faut modifier le fichier .env, à cause du SLL

---

![alt text](/build-Shop_with_ZIP/screenshots_for_readme/image6.png)

---

Dans docker desktop allez dans le container de la shop puis dans files

Une fois dans files aller dans : 
   - var
   - www
   - html
   - .env

Ensuite éditer le ficher, a la ligne 6 il faut ajouter 127.0.0.1,REMOTE_ADDR

---

![alt text](/build-Shop_with_ZIP/screenshots_for_readme/image7.png)

---

Retourner sur l'url de la shop : https://ton_domaine_ngrok/ et rafraichir la page si nécessaire.

---

## Nettoyer l’environnement

Avant de relancer un nouveau build, pense à nettoyer les containers

Dans le terminal lancer la Commande = 

```make down```

Cette commande :
   - Arrête tous les conteneurs Docker
   - Supprime les volumes associés
   
---
