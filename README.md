# HS Centrale Driver - Site Web

Site web professionnel pour la réservation de chauffeur privé à Paris, disponible 24h/24 et 7j/7.

## Fonctionnalités

### ✅ Formulaire de réservation complet et fonctionnel
- **Étape 1** : Saisie des adresses de départ et d'arrivée avec calcul automatique de la distance
  - Reconnaissance des lieux connus (aéroports, gares, monuments parisiens)
  - Calcul de distance intelligent basé sur les coordonnées GPS
  - Affichage en temps réel de la distance estimée
- **Étape 2** : Sélection du véhicule, informations de contact et détails du voyage
  - Filtrage automatique des véhicules selon le nombre de passagers
  - Validation en temps réel des champs (email, téléphone)
  - Calcul automatique du prix selon la distance et le type de véhicule
  - Récapitulatif complet avant confirmation
- **Sauvegarde** : Toutes les réservations sont sauvegardées dans le navigateur (localStorage)
- **Validation** : Validation complète des champs avec messages d'erreur en temps réel
- **Confirmation** : Message de succès avec numéro de réservation unique

### ✅ Sections du site
- **Accueil** : Hero section avec formulaire de réservation
- **À propos** : Présentation de l'entreprise
- **Nos prestations** : Transfert, Événements, Mise à disposition
- **Nos tarifs** : Informations sur les tarifs
- **Flotte de véhicules** : Berline, Éco, Van
- **Avantages** : Chauffeurs expérimentés, Siège bébé, Annulation gratuite, Accueil avec pancarte
- **Confort** : Wifi, Chargeur, Presse, Rafraîchissements, Gel, Masques

### ✅ Design et UX
- Design moderne et professionnel
- Interface responsive (mobile, tablette, desktop)
- Navigation fluide avec menu mobile
- Animations et transitions élégantes
- Palette de couleurs professionnelle

## Structure des fichiers

```
hs-centraledriver/
├── index.html      # Structure HTML principale
├── styles.css      # Styles CSS complets
├── script.js       # JavaScript pour les fonctionnalités
└── README.md       # Documentation
```

## 🗺️ Intégration Google Maps

Le site est maintenant équipé de Google Maps pour une expérience optimale :

### Fonctionnalités Google Maps
- ✅ **Autocomplétion des adresses** : Suggestions intelligentes lors de la saisie
- ✅ **Carte interactive** : Visualisation du trajet en temps réel
- ✅ **Calcul de distance réel** : Distance exacte via Google Maps API
- ✅ **Durée estimée** : Temps de trajet calculé automatiquement
- ✅ **Itinéraire visuel** : Affichage du parcours sur la carte

### Configuration

1. **Obtenir une clé API Google Maps** :
   - Allez sur [Google Cloud Console](https://console.cloud.google.com/)
   - Créez un projet et activez les APIs : Maps JavaScript API, Places API, Distance Matrix API, Geocoding API
   - Créez une clé API

2. **Intégrer la clé** :
   - Ouvrez `index.html`
   - Remplacez `YOUR_API_KEY` ligne 11 par votre clé API :
   ```html
   <script src="https://maps.googleapis.com/maps/api/js?key=VOTRE_CLE_API&libraries=places,geometry&language=fr"></script>
   ```

3. **Sans clé API** :
   - Le site fonctionne toujours avec un calcul de distance approximatif
   - Les fonctionnalités Google Maps seront désactivées automatiquement

📖 **Guide détaillé** : Voir `google-maps-setup.md`

## Utilisation

### Ouvrir le site localement

1. Ouvrez le fichier `index.html` dans votre navigateur web
2. Ou utilisez un serveur local :
   ```bash
   # Avec Python
   python -m http.server 8000
   
   # Avec Node.js (http-server)
   npx http-server
   
   # Avec PHP
   php -S localhost:8000
   ```

3. Accédez à `http://localhost:8000` dans votre navigateur

### Fonctionnalités du formulaire

1. **Saisie des adresses** : Entrez l'adresse de départ et d'arrivée
2. **Calcul de distance** : La distance est calculée automatiquement (simulée pour la démo)
3. **Sélection du véhicule** : Choisissez parmi Berline, Éco ou Van
4. **Remplissage des informations** : Complétez vos coordonnées et détails du voyage
5. **Confirmation** : Le prix est calculé automatiquement et la réservation peut être confirmée

## Personnalisation

### Modifier les tarifs des véhicules

Dans `script.js`, modifiez le tableau `vehicles` :

```javascript
const vehicles = [
    {
        id: 'berline',
        name: 'Berline',
        basePrice: 1.5,  // Prix par km
        minPrice: 30,     // Prix minimum
        capacity: 4
    },
    // ...
];
```

### Modifier les couleurs

Dans `styles.css`, modifiez les variables CSS :

```css
:root {
    --primary-color: #1a1a1a;
    --accent-color: #e74c3c;
    /* ... */
}
```

### Intégrer une API de calcul de distance

Pour un calcul réel de distance, remplacez la fonction `calculateDistance()` dans `script.js` par un appel à l'API Google Maps Distance Matrix :

```javascript
// Exemple avec Google Maps API
async function calculateDistance() {
    const origin = document.getElementById('departure').value;
    const destination = document.getElementById('arrival').value;
    
    // Appel API Google Maps
    const response = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&key=VOTRE_CLE_API`);
    const data = await response.json();
    
    // Traiter les résultats
    // ...
}
```

## Fonctionnalités avancées

### 🎯 Calcul de distance intelligent
- Reconnaissance automatique des lieux connus (aéroports, gares, monuments)
- Calcul basé sur la formule de Haversine pour une estimation précise
- Support des adresses personnalisées avec estimation par défaut

### 💾 Sauvegarde des réservations
- Toutes les réservations sont sauvegardées dans le navigateur (localStorage)
- Chaque réservation reçoit un ID unique
- Les données persistent même après fermeture du navigateur

### 📋 Panneau d'administration
Pour accéder au panneau d'administration et voir toutes les réservations :
1. Ajoutez `?admin=true` à l'URL : `http://localhost:8000?admin=true`
2. Un bouton "Voir les réservations" apparaîtra en bas à droite
3. Vous pourrez voir toutes les réservations, le chiffre d'affaires total
4. Export des réservations en JSON disponible

### ✅ Validations en temps réel
- Validation de l'email au format correct
- Validation du téléphone (minimum 10 chiffres)
- Vérification de la capacité du véhicule selon le nombre de passagers
- Messages d'erreur contextuels sous chaque champ

## Prochaines étapes

Pour mettre en production :

1. **Backend** : Créer une API pour enregistrer les réservations en base de données
2. **Base de données** : Migrer les données du localStorage vers une vraie base de données
3. **Email** : Envoyer des confirmations par email (SMTP ou service comme SendGrid)
4. **Paiement** : Intégrer un système de paiement en ligne (Stripe, PayPal)
5. **Google Maps API** : Intégrer le calcul réel de distance avec l'API Google Maps
6. **Authentification** : Ajouter un système de connexion pour le panneau admin
7. **SEO** : Optimiser pour les moteurs de recherche
8. **Analytics** : Ajouter Google Analytics ou similaire

## Compatibilité

- ✅ Chrome, Firefox, Safari, Edge (versions récentes)
- ✅ Mobile (iOS Safari, Chrome Mobile)
- ✅ Tablette
- ✅ Desktop

## Support

Pour toute question ou modification, contactez le développeur.

---

© 2024 - HS Centrale Driver - Tous droits réservés.

