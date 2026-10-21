const DICTIONARY = {
  nav: {
    dashboard: { fr: "Tableau de bord", en: "Dashboard" },
    scrobbles: { fr: "Scrobbles", en: "Scrobbles" },
    friends: { fr: "Amis", en: "Friends" },
    leaderboards: { fr: "Classements", en: "Leaderboards" },
    insights: { fr: "Analyses", en: "Insights" },
    share: { fr: "Partager", en: "Share" },
    account: { fr: "Compte", en: "Account" },
    language: { fr: "FR", en: "EN" }
  },
  common: {
    topAlbums: { fr: "Top albums", en: "Top Albums" },
    topArtists: { fr: "Top artistes", en: "Top Artists" },
    topTracks: { fr: "Top morceaux", en: "Top Tracks" },
    playsUnit: { fr: "écoutes", en: "plays" },
    cancel: { fr: "Annuler", en: "Cancel" },
    add: { fr: "Ajouter", en: "Add" },
    loading: { fr: "Chargement...", en: "Loading..." },
    never: { fr: "jamais", en: "never" },
    days: { fr: "jour", en: "day" },
    daysPlural: { fr: "jours", en: "days" }
  },
  dashboard: {
    sync: { fr: "Synchroniser", en: "Sync" },
    syncing: { fr: "En cours", en: "Syncing" },
    rangeDay: { fr: "Dernier jour", en: "Last day" },
    rangeWeek: { fr: "Dernière semaine", en: "Last week" },
    rangeMonth: { fr: "Dernier mois", en: "Last month" },
    rangeYear: { fr: "Dernière année", en: "Last year" },
    year: { fr: "Année", en: "Year" },
    month: { fr: "Mois", en: "Month" },
    all: { fr: "Tous", en: "All" },
    minutesListened: { fr: "Minutes écoutées", en: "Minutes Listened" },
    songsPlayed: { fr: "Morceaux joués", en: "Songs Played" },
    dailyAverage: { fr: "Moyenne quotidienne", en: "Daily Average" },
    topSongs: { fr: "Top morceaux", en: "Top Songs" },
    playsPerDay: { fr: "Écoutes par jour", en: "Plays per Day" },
    listeningClock: { fr: "Horloge d'écoute", en: "Listening Clock" },
    listeningClockCaption: {
      fr: "Activité d'écoute par heure locale",
      en: "Listening activity by local hour"
    },
    noListeningData: {
      fr: "Aucune écoute sur cette période",
      en: "No listening data for this period"
    },
    recentScrobbles: { fr: "Scrobbles récents", en: "Recent Scrobbles" },
    lastSyncPrefix: { fr: "Dernière synchro :", en: "Last sync:" },
    cacheLoaded: {
      fr: "Chargé depuis le cache du tableau de bord",
      en: "Loaded from dashboard cache"
    },
    cacheRefreshed: {
      fr: "Cache du tableau de bord actualisé",
      en: "Dashboard cache refreshed"
    },
    loadError: {
      fr: "Erreur de chargement du tableau de bord",
      en: "Error loading dashboard"
    },
    syncStarted: { fr: "Synchro démarrée", en: "Sync started" },
    syncAlreadyRunning: {
      fr: "Une synchro est déjà en cours",
      en: "A sync is already running"
    },
    syncFailed: { fr: "Échec de la synchro", en: "Sync failed" },
    syncCompleted: { fr: "Synchro terminée", en: "Sync completed" },
    syncingStatus: { fr: "Synchronisation...", en: "Syncing..." },
    songArtistHeader: { fr: "Morceau / Artiste", en: "Song / Artist" },
    playsHeader: { fr: "Écoutes", en: "Plays" },
    new: { fr: "Nouveau", en: "New" },
    allHistory: {
      fr: "Tout l'historique disponible",
      en: "All available history"
    },
    openAlbumOnLastfm: { fr: "Ouvrir l'album sur Last.fm", en: "Open album on Last.fm" },
    openArtistOnLastfm: { fr: "Ouvrir l'artiste sur Last.fm", en: "Open artist on Last.fm" },
    openTrackOnLastfm: { fr: "Ouvrir le morceau sur Last.fm", en: "Open track on Last.fm" }
  },
  insights: {
    title: { fr: "Analyses", en: "Insights" },
    activity: { fr: "Activité (12 derniers mois)", en: "Activity (last 12 months)" },
    less: { fr: "Moins", en: "Less" },
    more: { fr: "Plus", en: "More" },
    peak: {
      fr: "Pic : {from}–{to} heure locale · {count} écoutes",
      en: "Peak: {from}–{to} local time · {count} plays"
    },
    playsPerWeek: { fr: "Écoutes par semaine", en: "Plays per Week" },
    artistsOverTime: {
      fr: "Top artistes dans le temps",
      en: "Top Artists Over Time"
    }
  },
  scrobbles: {
    listeningNow: { fr: "En écoute", en: "Listening now" },
    justNow: { fr: "à l'instant", en: "just now" },
    minutesAgo: { fr: "il y a {count} min", en: "{count} min ago" },
    hoursAgo: { fr: "il y a {count} h", en: "{count} h ago" },
    daysAgo: { fr: "il y a {count} j", en: "{count} days ago" },
    showMore: { fr: "Voir plus", en: "Show more" },
    deleteConfirm: {
      fr: "Supprimer aussi ce scrobble de la base locale (stats your_lastfm) ?",
      en: "Also remove this scrobble from the local database (your_lastfm stats)?"
    },
    deleteFailed: {
      fr: "Impossible de supprimer le scrobble localement : {message}",
      en: "Could not delete the scrobble locally: {message}"
    }
  },
  leaderboards: {
    title: { fr: "Classements personnalisés", en: "Custom Leaderboards" },
    communityCharts: { fr: "Classements Last.fm", en: "Community charts" },
    createFirstGroup: { fr: "Créez votre premier groupe", en: "Create your first group" },
    groups: { fr: "Groupes", en: "Groups" },
    selectedGroup: { fr: "Groupe sélectionné", en: "Selected group" },
    timeRange: { fr: "Période", en: "Time range" },
    from: { fr: "Du", en: "From" },
    to: { fr: "Au", en: "To" },
    rankingType: { fr: "Type de classement", en: "Ranking" },
    artists: { fr: "Artistes", en: "Artists" },
    albums: { fr: "Albums", en: "Albums" },
    tracks: { fr: "Morceaux", en: "Tracks" },
    apply: { fr: "Appliquer", en: "Apply" },
    refresh: { fr: "Rafraîchir", en: "Refresh" },
    ignoreCache: {
      fr: "Ignorer les données en cache",
      en: "Ignore cached data"
    },
    building: {
      fr: "Construction des classements du groupe depuis Last.fm...",
      en: "Building group charts from Last.fm..."
    },
    totalScrobbles: { fr: "Scrobbles totaux", en: "Total scrobbles" },
    membersWithData: { fr: "Membres avec données", en: "Members with data" },
    currentLeader: { fr: "Leader actuel", en: "Current leader" },
    memberRanking: { fr: "Classement des membres", en: "Member ranking" },
    scrobblesByListener: { fr: "Scrobbles par auditeur", en: "Scrobbles by listener" },
    groupChart: { fr: "Top du groupe", en: "Group chart" },
    rangeSeparator: { fr: "à", en: "to" },
    leadsWith: { fr: "en tête avec", en: "leads with" },
    partialResult: { fr: "résultat partiel", en: "partial result" },
    staleCacheUsed: {
      fr: "cache périmé utilisé après une erreur Last.fm",
      en: "using stale cache after a Last.fm error"
    },
    cacheStale: { fr: "Cache périmé", en: "Stale cache" },
    cached: { fr: "En cache", en: "Cached" },
    updated: { fr: "Mis à jour", en: "Updated" },
    couldNotLoad: { fr: "Impossible de charger ce classement", en: "Could not load this leaderboard" },
    couldNotLoadGroups: { fr: "Impossible de charger les groupes", en: "Could not load leaderboard groups" },
    couldNotLoadTopTracks: { fr: "Impossible de charger les top morceaux", en: "Could not load top tracks" },
    couldNotSave: { fr: "Impossible d'enregistrer le groupe", en: "Could not save the group" },
    couldNotDelete: { fr: "Impossible de supprimer le groupe", en: "Could not delete the group" },
    localGroup: { fr: "Groupe local", en: "Local group" },
    createGroup: { fr: "Créer un groupe de classement", en: "Create leaderboard group" },
    editGroup: { fr: "Modifier le groupe de classement", en: "Edit leaderboard group" },
    groupName: { fr: "Nom du groupe", en: "Group name" },
    groupNamePlaceholder: { fr: "Auditeurs du week-end", en: "Weekend listeners" },
    lastfmUsernames: { fr: "Noms d'utilisateur Last.fm", en: "Last.fm usernames" },
    addMe: { fr: "M'ajouter", en: "Add me" },
    memberPlaceholder: {
      fr: "Saisissez un nom d'utilisateur puis Entrée",
      en: "Type a username and press Enter"
    },
    atLeastTwoMembers: { fr: "Au moins 2 membres.", en: "At least 2 members." },
    saveGroup: { fr: "Enregistrer le groupe", en: "Save group" },
    saveChanges: { fr: "Enregistrer les modifications", en: "Save changes" },
    createGroupButton: { fr: "Créer le groupe", en: "Create group" },
    groupNameRequired: { fr: "Le nom du groupe est requis", en: "Group name is required" },
    addTwoUsers: {
      fr: "Ajoutez au moins deux utilisateurs Last.fm",
      en: "Add at least two Last.fm users"
    },
    usernamesNoSpaces: {
      fr: "Les noms d'utilisateur Last.fm ne peuvent pas contenir d'espaces",
      en: "Last.fm usernames cannot contain spaces"
    },
    itemDetails: { fr: "Détails", en: "Item details" },
    loadingTopTracks: { fr: "Chargement des top morceaux...", en: "Loading top tracks..." },
    loadingItem: { fr: "Chargement de {name}...", en: "Loading {name}..." },
    noItems: { fr: "Aucun résultat sur cette période.", en: "No results were returned for this range." },
    noMatchingTracks: {
      fr: "Aucun morceau correspondant trouvé sur cette période.",
      en: "No matching tracks were found in this range."
    },
    listener: { fr: "auditeur", en: "listener" },
    listenerPlural: { fr: "auditeurs", en: "listeners" }
  },
  share: {
    generator: { fr: "Générateur", en: "Generator" },
    timePeriod: { fr: "Période", en: "Time Period" },
    last7: { fr: "7 derniers jours", en: "Last 7 Days" },
    last30: { fr: "30 derniers jours", en: "Last 30 Days" },
    last3m: { fr: "3 derniers mois", en: "Last 3 Months" },
    last6m: { fr: "6 derniers mois", en: "Last 6 Months" },
    lastYear: { fr: "Dernière année", en: "Last Year" },
    allTime: { fr: "Tout l'historique", en: "All Time" },
    format: { fr: "Format", en: "Format" },
    include: { fr: "Inclure", en: "Include" },
    generate: { fr: "Générer", en: "Generate" },
    generating: { fr: "Génération de votre récapitulatif...", en: "Generating your recap..." },
    selectOptions: {
      fr: "Choisissez vos options puis cliquez sur Générer",
      en: "Select options and click Generate"
    },
    download: { fr: "Télécharger l'image", en: "Download Image" }
  },
  account: {
    dataPrivacy: { fr: "Données & confidentialité", en: "Data & Privacy" },
    exportCsv: { fr: "Exporter CSV", en: "Export CSV" },
    importCsv: { fr: "Importer CSV", en: "Import CSV" },
    importNote: {
      fr: "L'import peut prendre du temps selon la taille du fichier.",
      en: "Importing may take a while depending on file size."
    },
    uploading: { fr: "Envoi en cours...", en: "Uploading..." },
    importSuccess: {
      fr: "Succès ! {count} nouveaux scrobbles importés.",
      en: "Success! {count} new scrobbles imported."
    },
    duplicatesIgnored: { fr: "{count} doublons ignorés.", en: "{count} duplicates ignored." },
    skippedRows: { fr: "{count} lignes invalides ignorées.", en: "{count} invalid rows skipped." },
    errorPrefix: { fr: "Erreur : {message}", en: "Error: {message}" },
    user: { fr: "Utilisateur", en: "User" },
    scrobblesLabel: { fr: "Scrobbles", en: "Scrobbles" },
    artistsLabel: { fr: "Artistes", en: "Artists" },
    albumsLabel: { fr: "Albums", en: "Albums" },
    tracksLabel: { fr: "Morceaux", en: "Tracks" }
  },
  friends: {
    loading: { fr: "Chargement de la liste d'amis...", en: "Loading friends list..." },
    you: { fr: "Vous", en: "You" },
    compatibilityLevel: { fr: "Niveau de compatibilité", en: "Compatibility Level" },
    compHigh: { fr: "ÉLEVÉ", en: "HIGH" },
    compMedium: { fr: "MOYEN", en: "MEDIUM" },
    compLow: { fr: "FAIBLE", en: "LOW" },
    compVeryLow: { fr: "TRÈS FAIBLE", en: "VERY LOW" },
    totalScrobbles: { fr: "Scrobbles totaux", en: "Total scrobbles" },
    totalArtists: { fr: "Artistes totaux", en: "Total artists" },
    totalAlbums: { fr: "Albums totaux", en: "Total albums" },
    yourAvatar: { fr: "Votre avatar", en: "Your avatar" }
  },
  covers: {
    addCover: { fr: "＋ Ajouter une pochette", en: "＋ Add cover" },
    coverAlt: { fr: "— pochette", en: "cover" },
    uploadFor: { fr: "Envoyer une pochette pour {album}", en: "Upload cover for {album}" },
    uploadFailed: { fr: "Échec de l'envoi de la pochette", en: "Cover upload failed" }
  },
  modal: {
    loadingTracks: { fr: "Chargement des morceaux...", en: "Loading tracks..." }
  },
  errors: {
    connection: {
      fr: "Impossible de se connecter à YourLastFM. Vérifiez que le serveur fonctionne encore.",
      en: "Could not connect to YourLastFM. Check whether the server is still running."
    }
  },
  artist: {
    back: { fr: "Retour", en: "Back" },
    topTracks: { fr: "Top titres", en: "Top tracks" },
    albums: { fr: "Albums écoutés", en: "Albums listened" },
    noBio: { fr: "Pas de biographie disponible.", en: "No biography available." },
    playsStat: { fr: "{count} écoutes", en: "{count} plays" },
    tracksStat: { fr: "{count} titres", en: "{count} tracks" },
    albumsStat: { fr: "{count} albums", en: "{count} albums" },
    firstListen: { fr: "Première écoute", en: "First listen" },
    lastListen: { fr: "Dernière écoute", en: "Last listen" },
    viewPage: { fr: "Voir la page de l'artiste", en: "Open the artist page" },
    loadError: { fr: "Impossible de charger la page artiste", en: "Could not load the artist page" }
  },
  album: {
    back: { fr: "Retour", en: "Back" },
    tracks: { fr: "Titres de l'album", en: "Album tracks" },
    tracksStat: { fr: "{count} titres", en: "{count} tracks" },
    viewPage: { fr: "Voir la page de l'album", en: "Open the album page" }
  },
  search: {
    placeholder: { fr: "Rechercher artiste, album, titre...", en: "Search artist, album, track..." },
    title: { fr: "Recherche", en: "Search" },
    noResults: { fr: "Aucun résultat pour « {query} »", en: "No results for \"{query}\"" }
  },
  track: {
    back: { fr: "Retour", en: "Back" },
    history: { fr: "Historique d'écoute", en: "Listening history" },
    rank: { fr: "N° {rank} de l'artiste", en: "Artist rank #{rank}" },
    scrobbleNote: {
      fr: "{shown} derniers affichés sur {total} scrobbles",
      en: "{shown} latest shown out of {total} scrobbles"
    },
    viewPage: { fr: "Voir la page du titre", en: "Open the track page" }
  },
  months: {
    jan: { fr: "Janvier", en: "January" },
    feb: { fr: "Février", en: "February" },
    mar: { fr: "Mars", en: "March" },
    apr: { fr: "Avril", en: "April" },
    may: { fr: "Mai", en: "May" },
    jun: { fr: "Juin", en: "June" },
    jul: { fr: "Juillet", en: "July" },
    aug: { fr: "Août", en: "August" },
    sep: { fr: "Septembre", en: "September" },
    oct: { fr: "Octobre", en: "October" },
    nov: { fr: "Novembre", en: "November" },
    dec: { fr: "Décembre", en: "December" }
  },
  comparison: {
    previous24h: { fr: "24 dernières heures", en: "previous 24 hours" },
    previous7d: { fr: "7 derniers jours", en: "previous 7 days" },
    previousMonth: { fr: "mois précédent", en: "previous month" },
    previousYear: { fr: "année précédente", en: "previous year" },
    allHistory: { fr: "Tout l'historique disponible", en: "All available history" },
    matchingMonths: {
      fr: "Tous les mois correspondants dans l'historique",
      en: "All matching months across your history"
    }
  },
  sync: {
    notStarted: { fr: "Pas commencé", en: "Not started" },
    unknown: { fr: "Statut inconnu", en: "Unknown status" },
    resuming: {
      fr: "Reprise de la synchronisation interrompue...",
      en: "Resuming interrupted synchronization..."
    },
    connecting: { fr: "Connexion à Last.fm...", en: "Connecting to Last.fm..." },
    page: {
      fr: "Synchronisation : page {page} sur {totalPages} ({percent} %)",
      en: "Syncing page {page} of {totalPages} ({percent}%)"
    },
    completed: {
      fr: "Synchronisation terminée : {count} nouveaux scrobbles",
      en: "Sync completed with {count} new scrobbles"
    },
    failed: { fr: "Échec de la synchronisation", en: "Sync failed" },
    failedRetry: {
      fr: "{detail}. La même fenêtre sera retentée.",
      en: "{detail}. The same sync window will be retried."
    }
  }
};

// Pour ajouter une langue : ajouter son code ici, puis une entrée par clé
// du dictionnaire ci-dessus (fr reste la valeur de repli si une clé manque).
const LOCALES = ["fr", "en"];

let currentLocale = LOCALES.includes(localStorage.getItem("locale"))
  ? localStorage.getItem("locale")
  : "fr";

export function getLocale() {
  return currentLocale;
}

export function getLocales() {
  return [...LOCALES];
}

export function getNextLocale() {
  const index = LOCALES.indexOf(currentLocale);
  return LOCALES[(index + 1) % LOCALES.length];
}

export function t(key, params = {}) {
  const parts = key.split(".");
  let entry = DICTIONARY;
  for (const part of parts) {
    entry = entry?.[part];
    if (!entry) return key;
  }

  const template = entry[currentLocale] ?? entry.fr ?? key;
  return String(template).replace(/\{(\w+)\}/g, (match, name) =>
    params[name] !== undefined ? String(params[name]) : match
  );
}

export function setLocale(locale) {
  if (!LOCALES.includes(locale)) return;
  if (locale === currentLocale) return;

  currentLocale = locale;
  localStorage.setItem("locale", locale);
  applyStaticTranslations();
  window.dispatchEvent(new CustomEvent("localechange", { detail: { locale } }));
}

export function applyStaticTranslations(root = document) {
  root.querySelectorAll("[data-i18n]").forEach(element => {
    element.textContent = t(element.dataset.i18n);
  });

  root.querySelectorAll("[data-i18n-placeholder]").forEach(element => {
    element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
  });

  root.querySelectorAll("[data-i18n-title]").forEach(element => {
    element.setAttribute("title", t(element.dataset.i18nTitle));
  });

  root.querySelectorAll("[data-i18n-aria-label]").forEach(element => {
    element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
  });

  document.documentElement.lang = currentLocale;
}
