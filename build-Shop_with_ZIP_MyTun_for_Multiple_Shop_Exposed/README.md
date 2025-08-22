# 🛍️ PrestaShop avec ZIP — `shop_with_zip`

Ce projet permet de créer une boutiques PrestaShop à partir d'un zip, accessibles publiquement via Ngrok

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

##  AVANT TOUTE ACTION ALLEZ DANS LE BON DOSSIER: => DANS LE TERMINAL TAPER LA COMMANDE "CD build-Shop_with_ZIP_MyTun_for_Multiple_Shop_Exposed"

---

## 🛠️ Configuration

Crée un fichier `.env` à la racine du dossier build-Shop_with_Ngrok avec ce contenu (exemple dans le .env.dist) :
```
ACCOUNT_TAG="your account tag"
TUNNEL_SECRET="your tunel secret"
TUNNEL_ID="your tunel id"
PS_DOMAIN="prestashop.firstname-name-mytun.prestashop.name"
DOMAIN="firstname-name-mytun.prestashop.name"

```

---

Dézipper le dossier de la version souhaitez contenant le prestashop.zip

---

![alt text](/build-Shop_with_ZIP_MyTun_for_Multiple_Shop_Exposed/screenshots_for_readme/image.png)

---

Gilsser le prestashop.zip à la racine du dossier build-Shop_with_ZIP_MyTun_for_Multiple_Shop_Exposed

---

![alt text](/build-Shop_with_ZIP_MyTun_for_Multiple_Shop_Exposed/screenshots_for_readme/image1.png)

---

Si vous souhaitez apporter des modifications à l’installation de la boutique, vous devez modifier la commande PHP dans le script install_cli.sh

---

🌐 Lien de la documentation d'installation en CLI : https://devdocs.prestashop-project.org/9/basics/installation/advanced/install-from-cli/

```
php -d memory_limit=1024M install/index_cli.php \
  --language=fr \
  --timezone=Europe/Paris \
  --domain=${PS_DOMAIN} \
  --db_server=mysql \            # Nom du host de la base de données
  --db_user=prestashop \         # Nom de l’utilisateur de la base de données
  --db_password=prestashop \     # Mot de passe de l’utilisateur de la base de données
  --db_name=prestashop \         # Nom de la base de données
  --prefix=ps_ \
  --db_clear=1 \
  --engine=InnoDB \
  --name="MaBoutique" \          # Nom de la boutique
  --country=fr \                 # Code pays de la boutique
  --firstname=John \             # Prénom de l’utilisateur administrateur
  --lastname=Doe \               # Nom de l’utilisateur administrateur
  --password=prestashop \        # Mot de passe de l’administrateur
  --email=admin@prestashop.com \ # Adresse e-mail de l’administrateur
  --ssl=1 \
  --rewrite=1 \
  --fixtures=0 \
  --modules=""

```
---


## Lancer le build de la shop

Dans le terminal lancer la Commande = 

```make shop```
      
Cette commande :
   - Lance lance le build de la shop contenue dans le prestashop.zip(équivalent à `make shop SHOP_ID=0`)
   - Démarre tous les conteneurs nécessaires en arrière-plan

URL d’accès à la boutique : https://prestashop0.ton_domaine/admin-dev

**Pour créer d'autre autre shop qui tourne simultanément il faut ajouter un SHOP_ID après la commande make shop**

- `make shop SHOP_ID=1` → Shop 1 accessible sur https://prestashop1.ton_domaine/admin-dev
- `make shop SHOP_ID=2` → Shop 2 accessible sur https://prestashop2.ton_domaine/admin-dev

Chaque shop fonctionne indépendamment avec sa propre base de données. Donc vous pouvez installer plusieurs versions de PS, qui vont tourner simultanément.

**Pour utiliser une version différente de PrestaShop :**
1. Supprimer le prestashop.zip actuel
2. Glisser le nouveau prestashop.zip de la version souhaitée (voir l'étape Dézipper le dossier et Gilsser le prestashop.zip)
3. Lancer un nouveau shop avec `make shop SHOP_ID=X` (remplacer X par un nouveau numéro non utilisé dans les containers)

---

Si vous rencontrez une erreur 500, cela signifie qu'il faut modifier le fichier .env, à cause du SLL

---

![alt text](/build-Shop_with_ZIP_MyTun_for_Multiple_Shop_Exposed/screenshots_for_readme/image6.png)

---

Dans docker desktop allez dans le container de la shop puis dans files

Une fois dans files aller dans : 
   - var
   - www
   - html
   - .env

Ensuite éditer le ficher, a la ligne 6 il faut ajouter 127.0.0.1,REMOTE_ADDR

---

![alt text](/build-Shop_with_ZIP_MyTun_for_Multiple_Shop_Exposed/screenshots_for_readme/image7.png)

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
