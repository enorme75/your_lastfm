# DEV-NOTES — Fork personnel de YourLastFM

> Ce fichier documente le contexte du fork. Il permet de reprendre le travail
> (ou une session avec un assistant IA) sans avoir à relire l'historique de
> discussion d'origine.

## Objectif

Fork **solo** (pas de contribution upstream prévue) de
[Gomaink/your_lastfm](https://github.com/Gomaink/your_lastfm) :
dashboard self-hosted qui synchronise les scrobbles Last.fm dans une base
SQLite et affiche des statistiques d'écoute.

Objectif du fork : **enrichir l'expérience** —

- plus de stats et de graphiques ;
- visuels plus grands (pochettes, images d'artistes) ;
- bios et images d'artistes (API Last.fm `artist.getinfo`, clé gratuite, avec
  cache) ;
- pages artistes dédiées (`/artist/:nom`) : top morceaux écoutés, historique
  personnel ;
- et autres améliorations au fil de l'eau.

Stack d'origine : **Node.js + SQLite** (`data/stats.db`, cache d'images dans
`data/image-cache/`). Synchro incrémentale Last.fm, comparaison entre amis,
leaderboards de groupe, images recap. Images d'artistes via l'API publique
Deezer (Spotify non requis).

## Contraintes et règles du fork

- **Licence MIT** : conserver la notice de copyright d'origine (fichier
  `LICENSE` de Gomaink) dans le dépôt. C'est la seule obligation.
- **Lien avec l'original maintenu** : remote nommé `upstream` pointant vers
  `https://github.com/Gomaink/your_lastfm.git`. Même en solo, merger les
  correctifs upstream (surtout la sync Last.fm, la partie la plus fragile
  face aux changements d'API).
- **Tag de référence** : après la première installation fonctionnelle du code
  d'origine, poser un tag `upstream-base` pour faciliter les merges futurs.
- **Décisions prises dans la discussion d'origine** :
  - Koito a été écarté (projet instable, breaking changes fréquents, gros
    backfill au démarrage sur historique importé massif).
  - YourLastFM retenu : stack simple, toutes les données en local dans
    SQLite, licence MIT.
  - Fork solo assumé : les features très personnelles vont dans le fork ;
    pas d'obligation de proposer en upstream.

## Roadmap (par ordre de coût croissant)

1. **Visuels plus grands / layout** — pur CSS/front, aucun risque sur la base.
2. **Nouveaux graphiques** — requêtes SQL sur `stats.db` + nouveaux endpoints
   API (heatmap d'activité, écoutes par jour/semaine, évolution des top
   artistes dans le temps).
3. **Pages artistes + bios** — route `/artist/:nom`, données depuis SQLite,
   bio + image via l'API Last.fm (`artist.getinfo`), mise en cache dans le
   mécanisme de cache API existant.
4. **Suite** — selon envies.

## Environnement de développement (macOS)

- **Homebrew** puis **Node.js LTS** (`brew install node@22` ou équivalent —
  version à aligner sur le `FROM node:XX` du Dockerfile d'origine).
- **Git** (Xcode Command Line Tools) avec authentification SSH vers GitHub.
- **OrbStack** (ou Docker Desktop) pour builder/tester l'image.
- **VS Code** :
  - extension **Prettier - Code formatter** (l'officielle, éditeur
    "Prettier") — l'extension utilise la version de Prettier du projet
    si elle existe ; ne rien installer tant que le dépôt ne l'exige pas ;
  - extension **ESLint** (Microsoft) — idem : fonctionne toute seule si
    ESLint est dans les dépendances du projet ;
  - réglage **Editor: Format On Save** activé.
- Règle générale : **faire ce que fait le projet d'origine** en matière de
  lint/format. Ne pas ajouter d'outils avant d'avoir lu le code.

## Déploiement cible

- **NAS Synology DS920+** (projet « DS920+ ») : les conteneurs sont Docker.
- Builder l'image **sur le Mac**, pas sur le NAS (CPU faible).
- Publication : image sur **GHCR** (`ghcr.io/<compte>/your-lastfm`), idéalement
  via GitHub Actions à chaque push ; le NAS fait un simple `docker pull`.
- L'app est en **lecture seule sur Last.fm** : aucun changement côté
  scrobblers existants (LMS continue de scrobbler vers Last.fm normalement).

## Prochaines étapes

1. Forker le dépôt sur GitHub (bouton Fork), le passer en privé si souhaité.
2. Cloner : `git clone git@github.com:<compte>/your_lastfm.git`
   puis `git remote add upstream https://github.com/Gomaink/your_lastfm.git`.
3. `npm install`, lire le README, créer une clé API Last.fm (`.env`).
4. Faire tourner **l'original tel quel** avec le compte Last.fm : première
   sync complète, `stats.db` rempli avec les vraies données.
5. `git tag upstream-base`.
6. Cartographier le code : où sont les routes, les requêtes SQL, le front
   (framework ? vanilla ?) — puis estimer la charge de chaque feature.
7. Créer une branche `dev` et commencer par la feature 1 (CSS/layout).

## Avancement (session du 2026-10-17)

- Étapes 1, 2, 5, 6 faites. Renommé ce fichier en `DEV-NOTES.md`
  (l'ancien nom commençait par `# `).
- `npm install` échoue avec Node 26 (better-sqlite3 12.5.0 ne compile pas).
  Solution retenue : `brew install node@22` (keg-only, n'écrase pas le node
  du système) et lancer les commandes avec
  `export PATH=/opt/homebrew/opt/node@22/bin:$PATH`.
  Aligné sur le `FROM node:22-bookworm-slim` du Dockerfile.
- `npm test` : 33/33 tests passent avec Node 22.23.3.
- **Première sync complète faite** (2026-10-17) : 223 129 scrobbles importés
  depuis le compte `OUF`, `data/stats.db` = 54 Mo. `node src/initial-sync.js`
  (~19 min, quelques retries ERR_BAD_RESPONSE gérés sans perte).
- API vérifiée : `/api/summary` et `/api/top-artists` répondent avec les
  vraies données. Lancer avec `node src/api.js` (port 1533).
- **Branche `dev` créée** et feature 1 (CSS/layout) bien avancée
  (commits `4388ba0`, `d4fccae`, `ed29293`, `2bae67f`) :
  - Top Albums / Top Artists / Top Songs en pleine largeur ;
  - albums : cartes uniformes 240 px avec pochette pleine largeur
    (piège CSS : `.cover-wrapper.large` fixe 140 px écrase une règle de
    même spécificité, il faut un sélecteur plus fort) ;
  - artistes et chansons : podium des 3 premiers à gauche (covers 110 px,
    numéro à gauche de la cover, grille `36px 110px 1fr`), suite de la
    liste à droite avec petites images (`.top-split`, 2fr/3fr, empile
    sous 900 px) ;
  - page scrobbles : covers 96 px arrondies avec ombre, textes agrandis
    (72 px sur mobile).
- Point en suspens : identité git auto-détectée (`@MacBook-Air-de-Martin.local`)
  à corriger avec `git config --global user.email` avant le premier push.
  **Réglé** (2026-10-17) : `enorme75 <29152882+enorme75@users.noreply.github.com>`.
- **Feature 2 faite** (2026-10-17) : heatmap d'activité 12 mois (DOM/CSS
  pur, pas de plugin Chart.js), plays per week (bar), top artists over
  time (line, top 6 par mois). **Déplacés sur une page « Insights »
  dédiée** (sidebar, `#insights-view`, module `public/js/insights.js`)
  car non liés aux filtres du dashboard : endpoint
  `GET /api/insights` avec son propre cache
  (`insights:tz{offset}`, clé par fuseau horaire), service
  `getInsights()` dans `src/services/dashboard.js` (les trois requêtes y
  vivent : `getActivityCalendar`, `getPlaysPerWeek`,
  `getArtistEvolution`, toutes en tout-historique sauf la heatmap
  limitée à 12 mois). Le payload `/api/dashboard` est revenu à sa forme
  d'origine.
- Reste : ajustements éventuels du layout, puis feature 2 (nouveaux
  graphiques) et feature 3 (pages artistes + bios) selon la roadmap.

## Cartographie du code (upstream-base, v1.3.0)

### Architecture générale

- **Back** : Express 5, CommonJS, Node >= 22. Pas de framework ORM —
  `better-sqlite3` avec des `db.prepare()` bruts.
- **Front** : **vanilla JS** (pas de framework), Bootstrap 5.3 et Chart.js
  4.4 chargés en CDN. SPA : `public/index.html` (une seule page, ~660 lignes)
  + modules `public/js/*.js` + `public/style.css` (~2300 lignes).
- **Tests** : `node --test`, 11 fichiers dans `test/`, essentiellement sur
  les utils et le dashboard. Pas de test front.

### Schéma SQLite (`src/db.js`)

- `scrobbles(artist, track, track_duration, album, album_image, played_at)`
  avec `UNIQUE(artist, track, played_at)` et 4 index
  (`played_at`, `artist+played_at`, `artist+album`, `artist+track`) —
  suffisant pour heatmap, écoutes par jour/semaine, top artistes par période.
- `artists(artist PRIMARY KEY, artist_image, updated_at)` — image via Deezer
  (`src/services/deezerArtistImage.js`, cache dans
  `src/services/artistImageCache.js`). Les images d'artistes **existent
  déjà** ; la feature 1 n'a qu'à les afficher en plus grand.
- `metadata`, `dashboard_cache` (clé + numéro de révision, invalidée après
  sync/import), et 6 tables `leaderboard_*`.

### Routes API (`src/api.js`, ~600 lignes, tout au même endroit)

- Dashboard : `/api/dashboard` (endpoint **combiné** unique depuis la 1.2.0,
  filtrable par période), `/api/summary`, `/api/plays-per-day`,
  `/api/top-artists`, `/api/top-tracks`, `/api/top-albums`,
  `/api/recent-scrobbles`, `/api/user-stats`.
- Sync : `/api/sync` (POST), `/api/sync/status`, `/api/last-sync`.
- Covers/images : `/api/image-proxy`, `/api/album-cover` (upload),
  `/api/album-tracks`.
- Amis/groupes : `/api/friends`, `/api/friends/compare/:username`,
  CRUD + résultats `/api/leaderboards/groups...`.
- Divers : `/api/health`, import/export CSV, `/api/generate-share`.
- Point clé : les filtres de période sont centralisés dans
  `src/utils/dashboardFilter.js` (`toSqlFilter`) — toute nouvelle stat doit
  passer par là pour rester filtrable et cohérente.

### Charge estimée des features

1. **Visuels plus grands / layout** — faible. `style.css` + `index.html`
   + modules front concernés (`albums.js`, `artists.js`, `topSongs.js`).
   Aucun back, aucune migration.
2. **Nouveaux graphiques** — moyen. Le bon point d'entrée est le service
   `src/services/dashboard.js` (requêtes SQL) + l'endpoint combiné
   `/api/dashboard` pour bénéficier du `dashboard_cache` existant ; côté
   front, `public/js/charts.js` et `chartTheme.js`. Risque bas : les index
   nécessaires existent déjà.
3. **Pages artistes + bios** — le plus lourd des trois. Aucune route
   paramétrée n'existe aujourd'hui et le front n'a pas de routeur : il
   faudra soit ajouter un routage hash dans la SPA, soit une seconde page
   servie par Express. `artist.getinfo` n'est pas encore appelé (seul
   `album.getinfo` l'est, dans `src/services/lastfm-album.js` — bon modèle
   à recopier pour le client Last.fm + cache). Prévoir une table
   `artist_info` (bio, tags, url Last.fm) avec TTL sur `updated_at`, sur le
   modèle de `artists`. Attention : les noms d'artistes sont des clés TEXT
   exactes — encoder proprement les slugs d'URL (`encodeURIComponent`).

## Idée backlog : supprimer des scrobbles depuis l'app

Vérifié le 2026-10-17 : **Last.fm n'expose aucune API officielle de
suppression de scrobble** (pas de `track.scrobble.delete`). La suppression
n'est possible que :

- à l'unité sur le site web (bibliothèque / morceaux récents) ;
- en masse via des outils tiers qui **simulent une session navigateur
  connectée** sur last.fm : `chrs-myrs/lastfm-scrobble-purger`
  (Node, testé jusqu'à 35 000 scrobbles), extension Last.FM Unscrobbler,
  userscripts Greasyfork. Fragile (dépend du HTML du site, jamais du
  moindre endpoint officiel).

Trois options pour le fork, par coût croissant :

1. **Exclusion locale** (recommandé en premier) : règles de filtrage
   (artiste/motif) ou suppression directe dans `stats.db`, avec
   invalidation du `dashboard_cache`. Ne touche pas à Last.fm, respecte le
   postulat « lecture seule », coût faible. Limite : les scrobbles
   existent toujours côté Last.fm et reviendront si on purge/recrée la
   base (donc plutôt filtres persistants que deletes purs).
   **Partiellement fait** (2026-10-17) : suppression **par scrobble** via
   `DELETE /api/scrobbles` (service `src/services/scrobbleDeletion.js`),
   table `deleted_scrobbles` empêchant la sync de ré-insérer un scrobble
   supprimé localement (garde dans `sync.js`), et check d'intégrité
   tenant compte des exclusions (`integrity-check.js`). Côté front : la
   poubelle ouvre Last.fm et propose la suppression locale (confirm).
   Reste à faire : règles de filtrage par artiste/motif, si besoin.
2. **Lien d'action vers le site** : bouton par scrobble qui ouvre la page
   Last.fm correspondante pour suppression manuelle. Coût trivial,
   UX moyenne. **Fait** (2026-10-17) : `getUserLibraryTrackUrl()` dans
   `src/utils/lastfmUrl.js`, champ `delete_url` sur
   `/api/recent-scrobbles`, icône poubelle `.scrobble-delete` dans
   `public/js/scrobbles.js` + `style.css`. Cible :
   `last.fm/user/{user}/library/music/{artist}/_/{track}` (page
   bibliothèque du morceau, avec `/_/` obligatoire ; slugs repris tels
   quels de l'URL canonique `track.url` renvoyée par l'API Last.fm —
   ne pas ré-encoder soi-même : encodage Last.fm spécifique, ex.
   apostrophe en `%27`).
3. **Vraie suppression côté Last.fm** : scraper le site avec un cookie de
   session stocké dans `.env`. Coût élevé, maintenance continue, risque de
   casser à chaque évolution du site, zone grise côté CGU. Ne se lance
   que si vraiment nécessaire.

Décision à prendre : commencer par l'option 1 (filtres/exclusion locale),
et ne monter à l'option 3 que si le besoin est réel.
