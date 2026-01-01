# Guide de dépannage

## Problèmes courants et solutions

### 1. Le formulaire ne fonctionne pas

**Vérifications :**
- Ouvrez la console du navigateur (F12 ou Cmd+Option+I)
- Vérifiez s'il y a des erreurs JavaScript en rouge
- Assurez-vous que tous les fichiers sont chargés (index.html, styles.css, script.js)

**Solution :**
- Vérifiez que le serveur local fonctionne : `http://localhost:8000`
- Rechargez la page (Ctrl+R ou Cmd+R)
- Videz le cache du navigateur

### 2. Le calcul de distance ne fonctionne pas

**Sans clé API Google Maps :**
- Le site utilise un calcul de distance approximatif
- Cela devrait fonctionner automatiquement
- Testez avec des adresses connues : "Paris" → "Aéroport Charles de Gaulle"

**Avec clé API Google Maps :**
- Vérifiez que votre clé API est valide
- Vérifiez que les APIs sont activées dans Google Cloud Console
- Vérifiez la console pour les erreurs d'API

### 3. La carte ne s'affiche pas

**Causes possibles :**
- Clé API Google Maps invalide ou manquante
- APIs non activées dans Google Cloud Console
- Restrictions de la clé API trop strictes

**Solution :**
- Le site fonctionne sans carte (mode fallback)
- Pour activer la carte, configurez une clé API valide
- Voir `google-maps-setup.md` pour les instructions

### 4. Les réservations ne se sauvegardent pas

**Vérifications :**
- Ouvrez la console du navigateur
- Vérifiez s'il y a des erreurs lors de la soumission
- Vérifiez que localStorage est activé dans votre navigateur

**Solution :**
- Les réservations sont sauvegardées dans le navigateur (localStorage)
- Elles persistent même après fermeture du navigateur
- Pour voir les réservations : ajoutez `?admin=true` à l'URL

### 5. Erreurs dans la console

**Erreur : "Google Maps API not loaded"**
- Normal si vous n'avez pas de clé API
- Le site fonctionne en mode fallback

**Erreur : "Cannot read property of undefined"**
- Vérifiez que tous les éléments HTML existent
- Vérifiez que le script.js est bien chargé

**Erreur : "Failed to load resource"**
- Vérifiez votre connexion internet
- Vérifiez que le serveur local fonctionne

## Test rapide

1. Ouvrez `http://localhost:8000`
2. Ouvrez la console (F12)
3. Testez le formulaire :
   - Saisissez "Paris" dans départ
   - Saisissez "Aéroport Charles de Gaulle" dans arrivée
   - Attendez le calcul de distance
   - Cliquez sur "Suivant"
   - Remplissez les informations
   - Confirmez la réservation

## Vérification des fichiers

Assurez-vous que ces fichiers existent :
- ✅ `index.html`
- ✅ `styles.css`
- ✅ `script.js`

## Support

Si le problème persiste :
1. Ouvrez la console du navigateur (F12)
2. Notez les erreurs affichées
3. Vérifiez que tous les fichiers sont présents
4. Testez dans un autre navigateur

