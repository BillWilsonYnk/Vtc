# Configuration Google Maps API

Pour activer Google Maps sur le site, vous devez :

## 1. Obtenir une clé API Google Maps

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez les APIs suivantes :
   - **Maps JavaScript API**
   - **Places API** (pour l'autocomplétion des adresses)
   - **Distance Matrix API** (pour le calcul de distance)
   - **Geocoding API** (pour convertir les adresses en coordonnées)

4. Créez une clé API :
   - Allez dans "Identifiants" → "Créer des identifiants" → "Clé API"
   - Copiez votre clé API

## 2. Configurer les restrictions (recommandé)

Pour sécuriser votre clé API :

1. **Restrictions d'application** :
   - Restreignez par nom d'hôte HTTP (ex: `localhost`, `votredomaine.com`)
   - Ou par nom de package pour les apps mobiles

2. **Restrictions d'API** :
   - Limitez aux APIs nécessaires uniquement :
     - Maps JavaScript API
     - Places API
     - Distance Matrix API
     - Geocoding API

## 3. Intégrer la clé dans le site

Remplacez `YOUR_API_KEY` dans `index.html` ligne 11 :

```html
<script src="https://maps.googleapis.com/maps/api/js?key=VOTRE_CLE_API&libraries=places,geometry&language=fr"></script>
```

## 4. Fonctionnalités activées

Une fois la clé API configurée, vous aurez :

✅ **Autocomplétion des adresses** : Suggestions intelligentes lors de la saisie
✅ **Carte interactive** : Affichage du trajet sur une carte
✅ **Calcul de distance réel** : Distance exacte via Google Maps
✅ **Durée estimée** : Temps de trajet calculé
✅ **Itinéraire visuel** : Affichage du parcours sur la carte

## 5. Coûts

Google Maps propose un crédit gratuit de 200$ par mois, ce qui couvre généralement :
- 28,000 chargements de carte par mois
- 40,000 requêtes d'autocomplétion par mois
- 40,000 requêtes Distance Matrix par mois

Pour un site avec trafic modéré, cela devrait être suffisant.

## Alternative : Version sans clé API

Si vous ne souhaitez pas utiliser Google Maps API, le site fonctionne toujours avec un calcul de distance approximatif basé sur les coordonnées GPS des lieux connus.

