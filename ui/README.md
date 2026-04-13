# 🛍️ PrestaShop QA Shop Builder UI

Cette interface permet de lancer les différents flows du projet sans passer par la CLI.

Elle est pensée pour les profils non techniques qui ont besoin d'un parcours simple, guidé et visuel.

---

Les prérequis généraux sont décrits dans le README global du projet.

---

## AVANT TOUTE ACTION ALLEZ DANS LE BON DOSSIER: => DANS LE TERMINAL TAPER LA COMMANDE "CD ui"

---

## ▶️ Lancer l'interface

Dans le terminal lancer la commande :

```bash
npm start
```

Puis ouvrir l'URL :

```text
http://127.0.0.1:4173
```

---

## ✅ Ce que permet l'interface

Depuis l'UI vous pouvez :

- Sauvegarder les credentials MyTun ou Ngrok localement
- Générer automatiquement les fichiers `.env` nécessaires
- Choisir un flow via image Docker ou via ZIP
- Choisir la version de PrestaShop pour les flows image
- Choisir une installation ZIP automatique ou manuelle
- Lancer et arrêter une boutique depuis l'interface
- Consulter les logs d'exécution
- Ouvrir les liens FO / BO directement depuis l'interface

---

## 🔐 Sauvegarde des credentials

Les credentials saisis dans l'UI sont sauvegardés localement sur la machine.

Ils sont ensuite réutilisés automatiquement lors des prochains lancements, ce qui évite de les ressaisir à chaque fois.

Les fichiers `.env` des différents flows sont aussi mis à jour automatiquement.

---

## 📦 Utilisation avec un ZIP

Si vous choisissez un flow ZIP :

- glissez votre `prestashop.zip` dans la zone prévue
- l'UI envoie le vrai fichier sélectionné dans le bon dossier du flow avant le lancement
- même si tous les fichiers s'appellent `prestashop.zip`, le dernier ZIP sélectionné est bien pris en compte

Vous pouvez aussi choisir :

- une installation automatique
- une installation manuelle via l'assistant PrestaShop dans le navigateur

---

## 🏪 Cas particulier: ZIP + MyTun

Le flow `ZIP + MyTun` permet de lancer plusieurs boutiques.

Dans l'UI :

- le premier bouton lance la boutique principale
- le bouton `Créer un autre shop` apparaît ensuite
- chaque nouvelle boutique reçoit automatiquement l'ID suivant: `1`, puis `2`, puis `3`, etc.
- chaque boutique supplémentaire possède son propre bloc de logs et son propre bouton d'arrêt

---

## 🧹 Arrêter l'interface

Pour arrêter l'UI, revenez dans le terminal et faites :

```bash
Ctrl + C
```

---
