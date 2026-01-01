# Guide de test rapide

## Étape 1 : Vérifier que le serveur fonctionne

1. Ouvrez un terminal
2. Allez dans le dossier : `cd /Users/bill/hs-centraledriver`
3. Démarrez le serveur : `python3 -m http.server 8000`
4. Ouvrez votre navigateur : `http://localhost:8000`

## Étape 2 : Ouvrir la console du navigateur

1. Appuyez sur **F12** (ou **Cmd+Option+I** sur Mac)
2. Allez dans l'onglet **Console**
3. Vous devriez voir des messages comme :
   - "DOM Content Loaded - Initializing..."
   - "Navigation initialized"
   - "Booking form initialized"
   - etc.

## Étape 3 : Tester le formulaire

1. **Test simple** : Allez sur `http://localhost:8000/test.html`
   - Ce fichier teste juste le formulaire de base
   - Si ça fonctionne, le problème vient du code principal

2. **Test du site principal** :
   - Saisissez "Paris" dans le champ départ
   - Saisissez "Aéroport Charles de Gaulle" dans le champ arrivée
   - Attendez 1-2 secondes
   - La distance devrait s'afficher

## Étape 4 : Identifier les erreurs

Dans la console, cherchez les messages en **rouge** qui indiquent des erreurs.

**Erreurs courantes :**
- `Cannot read property 'value' of null` → Un élément HTML n'existe pas
- `script.js:XXX Uncaught TypeError` → Erreur dans le code JavaScript
- `Failed to load resource` → Fichier manquant

## Étape 5 : Vérifier les fichiers

Assurez-vous que ces fichiers existent dans le dossier :
- ✅ `index.html`
- ✅ `styles.css`
- ✅ `script.js`

## Que faire si ça ne marche toujours pas ?

1. **Copiez les erreurs de la console** et dites-moi exactement ce qui s'affiche
2. **Testez avec test.html** pour voir si c'est un problème général ou spécifique
3. **Vérifiez que le serveur tourne** (vous devriez voir "Serving HTTP on..." dans le terminal)

## Messages de débogage attendus

Quand vous ouvrez le site, vous devriez voir dans la console :
```
DOM Content Loaded - Initializing...
Navigation initialized
Date input initialized
Current year set
Admin panel initialized
Initializing booking form...
All form elements found
Vehicles loaded
Real-time validation added
Booking form initialized
All initialization complete
```

Si un de ces messages manque, c'est là que se trouve le problème !

