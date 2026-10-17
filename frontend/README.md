# JobSwipe — Frontend React (recréé intégralement)

Front développé depuis zéro à partir de la maquette `jobswipe.html`. React + Vite, CSS natif et API réelle Express/MongoDB. Aucune offre, aucun match ni message fictif : l'interface affiche les données réelles et des états vides.

## Lancement

```powershell
# Terminal 1 — MongoDB doit être démarré
cd backend
copy .env.example .env    # puis ajuster MONGODB_URI et JWT_SECRET
npm ci
npm run dev

# Terminal 2
cd frontend
npm ci
npm run dev
```

Ouvrez http://localhost:5173. Le proxy Vite redirige `/api` et `/socket.io` vers http://localhost:3000. Test API : http://localhost:3000/health. Connexion serveur : `VITE_API_BASE_URL` (défaut `/api`) et `VITE_SOCKET_URL` (défaut `/`) si déploiement séparé.

## Parcours de test complet

1. Inscrivez un recruteur ; configurez sa fiche et publiez une offre.
2. Déconnectez-vous, inscrivez un candidat ; configurez au moins trois compétences et ajoutez éventuellement son CV.
3. Depuis **Découvrir**, manifestez un intérêt pour l'offre créée.
4. Reconnectez le recruteur, ouvrez **Candidats** et acceptez ou refusez la candidature.
5. Reconnectez le candidat : le match accepté permet d'ouvrir une conversation ; envoyez un message. Dans une autre session, ouvrez le compte recruteur pour constater la messagerie temps réel.

## Contrats API utilisés

- `POST /api/auth/signup` / `POST /api/auth/login` / `GET /api/auth/me`
- `GET|PATCH /api/profile`, `POST|GET|DELETE /api/profile/cv|photo|company-logo`
- `GET|POST /api/jobs`, `GET|PATCH|DELETE /api/jobs/:id`
- `GET /api/matches`, `POST /api/matches/offers/:jobOfferId`, `PATCH /api/matches/:id/status`, `GET /api/matches/:id/candidate-cv`
- `GET /api/conversations`, `POST /api/conversations/matches/:matchId`, `GET|POST /api/conversations/:id/messages`, `PATCH /api/conversations/:id/read`
- `GET|PATCH /api/notifications`
- Socket.IO `conversation:join`, `message:new`, `conversation:read`

## Fonctionnalités non couvertes par le backend

Super Like, sauvegarde des candidatures pour plus tard, vérification SIREN, avantages/description d'entreprise, suppression complète du compte et export RGPD : non simulés. Le backend ne fournit pas les photos ou logos publics sans jeton ; leurs endpoints existants utilisent un jeton authentifié.

## Tests

Après démarrage de MongoDB et du backend sur une base **de test uniquement** :

```powershell
npm run test:api
```

Ce test construit un vrai parcours API avec deux comptes temporaires. Il crée des données et ne doit pas être utilisé sur la base de production.

Le serveur npm du conteneur utilisé pour cette reconstruction était inaccessible au moment de la livraison : la compilation Vite et les tests navigateurs restent à réaliser sur votre machine avec `npm ci` puis `npm run build`.
