import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';

/* ───────────────────────────────────────────────────────────────
   i18n — Dashboard bilingue FR / EN.

   Conception :
   - `lang` est l'état React (source de vérité) ; il est aussi miroité dans
     une variable de module (`_lang`) pour que les helpers « plats »
     (statusLabel, roleLabel, categoryLabel, t…) restent synchrones sans hook.
   - Au changement de langue, App remonte tout l'arbre (key={lang}) : toute la
     page se re-rend, y compris ces helpers plats. Simple et sans angle mort.
   - La préférence est persistée dans localStorage.
   ─────────────────────────────────────────────────────────────── */

export type Lang = 'fr' | 'en';

const STORAGE_KEY = 'ipck_admin_lang';

function readInitial(): Lang {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'fr' || v === 'en') return v;
    // Devine depuis le navigateur, défaut FR.
    return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'fr';
  } catch {
    return 'fr';
  }
}

// Miroir module — lu par les helpers plats (t/statusLabel/…).
let _lang: Lang = readInitial();
export function currentLang(): Lang {
  return _lang;
}

/** Locale BCP-47 pour les formats date/nombre selon la langue courante. */
export function dateLocale(): string {
  return _lang === 'fr' ? 'fr-FR' : 'en-US';
}

/* ── Dictionnaire ──────────────────────────────────────────────
   Chaque entrée porte ses deux variantes. `t(key)` choisit selon la
   langue courante. Les libellés inconnus retombent sur la clé. */
type Entry = { fr: string; en: string };

const DICT: Record<string, Entry> = {
  // App shell / header
  'app.suite': { fr: 'IPCK House', en: 'IPCK House' },
  'app.admin': { fr: 'Admin', en: 'Admin' },
  'header.notifications': { fr: 'Notifications', en: 'Notifications' },
  'header.help': { fr: 'Aide', en: 'Help' },
  'header.logout': { fr: 'Déconnexion', en: 'Log out' },
  'header.menu': { fr: 'Basculer le menu', en: 'Toggle menu' },
  'header.lang': { fr: 'Changer de langue', en: 'Change language' },
  'header.staff': { fr: 'Staff', en: 'Staff' },
  'sidenav.systemsOk': { fr: 'Tous les systèmes opérationnels', en: 'All systems operational' },

  // Navigation
  'nav.overview': { fr: "Vue d'ensemble", en: 'Overview' },
  'nav.care': { fr: 'Soin pastoral', en: 'Pastoral care' },
  'nav.people': { fr: 'Membres', en: 'Members' },
  'nav.community': { fr: 'Communauté', en: 'Community' },
  'nav.giving': { fr: 'Dons', en: 'Giving' },
  'nav.content': { fr: 'Contenus', en: 'Content' },
  'nav.devotions': { fr: 'Dévotions', en: 'Devotions' },
  'nav.communications': { fr: 'Communications', en: 'Communications' },
  'nav.activity': { fr: 'Activité', en: 'Activity' },
  'nav.cat.community': { fr: 'Communauté', en: 'Community' },
  'nav.cat.finance': { fr: 'Finance', en: 'Finance' },
  'nav.cat.content': { fr: 'Contenu', en: 'Content' },
  'nav.cat.broadcast': { fr: 'Diffusion', en: 'Broadcast' },
  'nav.cat.supervision': { fr: 'Supervision', en: 'Supervision' },

  // États (state.tsx)
  'state.cannotConnect': { fr: 'Connexion impossible', en: 'Cannot connect' },
  'state.loadFailed': { fr: 'Échec du chargement', en: 'Loading failed' },
  'state.retry': { fr: 'Réessayer', en: 'Retry' },
  'state.retrying': { fr: 'Nouvel essai…', en: 'Retrying…' },
  'state.noData': { fr: 'Aucune donnée.', en: 'No data.' },
  'state.syncing': { fr: 'Actualisation…', en: 'Refreshing…' },
  'state.syncTitle': { fr: 'Synchronisation avec le serveur', en: 'Syncing with the server' },
  'state.stale': { fr: 'Données possiblement obsolètes', en: 'Data may be stale' },
  'state.staleTitle': { fr: 'La dernière synchronisation a échoué', en: 'Last sync failed' },
  'state.sessionCheck': { fr: 'Vérification de la session…', en: 'Checking session…' },

  // Feedback (confirm défauts)
  'confirm.cancel': { fr: 'Annuler', en: 'Cancel' },
  'confirm.confirm': { fr: 'Confirmer', en: 'Confirm' },
  'toast.close': { fr: 'Fermer', en: 'Close' },

  // Overview
  'overview.title': { fr: "Vue d'ensemble", en: 'Overview' },
  'overview.subtitle': {
    fr: 'Indicateurs clés en direct · communauté, soin, dons & contenus',
    en: 'Live key metrics · community, care, giving & content',
  },
  'overview.loadingKpis': { fr: 'Chargement des indicateurs…', en: 'Loading metrics…' },
  'overview.engagement': { fr: 'Engagement', en: 'Engagement' },
  'overview.engagementSub': {
    fr: 'Activité des membres sur 7 jours · vs cible',
    en: 'Member activity over 7 days · vs target',
  },
  'overview.engagementEmpty': { fr: "Aucune donnée d'engagement.", en: 'No engagement data.' },
  'overview.loadingEngagement': { fr: "Chargement de l'engagement…", en: 'Loading engagement…' },
  'overview.live': { fr: 'en direct', en: 'live' },
  'overview.seeDetail': { fr: 'Voir le détail →', en: 'See detail →' },
  'overview.target': { fr: 'cible', en: 'target' },

  // KPI labels (Overview)
  'kpi.members': { fr: 'Membres actifs', en: 'Active members' },
  'kpi.giving': { fr: 'Dons · ce mois-ci', en: 'Giving · this month' },
  'kpi.viewers': { fr: 'Direct · pic du jour', en: 'Live · daily peak' },
  'kpi.prayers': { fr: 'File de prières · en attente', en: 'Prayer queue · pending' },
  'kpi.devo': { fr: 'Complétion dévotion', en: 'Devotional completion' },
  'engagement.devotionalCompletion': { fr: 'Complétion dévotion', en: 'Devotional completion' },
  'engagement.membersActive7d': { fr: 'Membres actifs (7 j)', en: 'Members active (7d)' },

  // ── People ──
  'people.title': { fr: 'Membres', en: 'Members' },
  'people.subtitle': {
    fr: 'Annuaire de la communauté & nouveaux arrivants',
    en: 'Community directory & newcomers',
  },
  'people.directory': { fr: 'Annuaire', en: 'Directory' },
  'people.members': { fr: 'membres', en: 'members' },
  'people.emptyDirectory': { fr: "Aucun membre dans l'annuaire.", en: 'No members in the directory.' },
  'people.loadingDirectory': { fr: "Chargement de l'annuaire…", en: 'Loading directory…' },
  'people.colMember': { fr: 'Membre', en: 'Member' },
  'people.colPhone': { fr: 'Téléphone', en: 'Phone' },
  'people.colRole': { fr: 'Rôle', en: 'Role' },
  'people.colStreak': { fr: 'Série', en: 'Streak' },
  'people.incompleteProfile': { fr: 'Profil incomplet', en: 'Incomplete profile' },
  'people.newMembers': { fr: 'Nouveaux membres', en: 'New members' },
  'people.recent': { fr: 'récents', en: 'recent' },
  'people.emptyNew': { fr: 'Aucun nouveau membre', en: 'No new members' },
  'people.loading': { fr: 'Chargement…', en: 'Loading…' },
  'people.colJoined': { fr: 'Inscrit le', en: 'Joined' },
  'people.member': { fr: 'Membre', en: 'Member' },
  'people.streakDays': { fr: 'jour(s) consécutif(s)', en: 'consecutive day(s)' },
  'people.eyebrow': { fr: 'Membre', en: 'Member' },
  'people.joinedOn': { fr: "a rejoint l'IPCK le", en: 'joined IPCK on' },
  'people.streakOngoing': { fr: 'Série de lecture en cours :', en: 'Reading streak in progress:' },
  'people.streakDaysShort': { fr: 'jour(s).', en: 'day(s).' },
  'people.noStreak': { fr: 'Aucune série de lecture en cours.', en: 'No reading streak in progress.' },
  'people.identity': { fr: 'Identité', en: 'Identity' },
  'people.name': { fr: 'Nom', en: 'Name' },
  'people.engagement': { fr: 'Engagement', en: 'Engagement' },
  'people.streak': { fr: 'Série', en: 'Streak' },
  'people.streakHint': {
    fr: 'Nombre de jours consécutifs de lecture de la dévotion.',
    en: 'Number of consecutive days reading the devotional.',
  },
  'role.desc.admin': {
    fr: 'Administrateur — accès complet au dashboard, dont les exports financiers.',
    en: 'Administrator — full dashboard access, including financial exports.',
  },
  'role.desc.pastor': {
    fr: 'Pasteur — gère le soin pastoral, les contenus et la communauté.',
    en: 'Pastor — manages pastoral care, content and community.',
  },
  'role.desc.group_leader': {
    fr: 'Responsable de groupe — anime un groupe de maison.',
    en: 'Group leader — leads a house group.',
  },
  'role.desc.member': {
    fr: 'Membre de la communauté — utilise l’app mobile.',
    en: 'Community member — uses the mobile app.',
  },

  // ── Giving ──
  'giving.title': { fr: 'Dons', en: 'Giving' },
  'giving.subtitle': {
    fr: 'Suivi des fonds et des canaux · ledger réconcilié',
    en: 'Funds & channels tracking · reconciled ledger',
  },
  'giving.export': { fr: 'Exporter CSV', en: 'Export CSV' },
  'giving.exporting': { fr: 'Export…', en: 'Exporting…' },
  'giving.loadingKpis': { fr: 'Chargement des indicateurs…', en: 'Loading metrics…' },
  'giving.monthToDate': { fr: 'Mois en cours', en: 'Month to date' },
  'giving.donationsThisMonth': { fr: 'don(s) reçu(s) ce mois-ci', en: 'donation(s) received this month' },
  'giving.noDonationsMonth': { fr: 'Aucun don ce mois-ci', en: 'No donations this month' },
  'giving.ytdAllFunds': { fr: 'YTD (tous fonds)', en: 'YTD (all funds)' },
  'giving.ofAnnualBudget': { fr: 'du budget annuel', en: 'of annual budget' },
  'giving.funds': { fr: 'fonds', en: 'funds' },
  'giving.byFund': { fr: 'Par fonds', en: 'By fund' },
  'giving.byFundSub': { fr: 'Progression YTD vs budget annuel', en: 'YTD progress vs annual budget' },
  'giving.ofBudget': { fr: 'du budget', en: 'of budget' },
  'giving.noFund': { fr: 'Aucun fonds', en: 'No funds' },
  'giving.byChannel': { fr: 'Par canal', en: 'By channel' },
  'giving.byChannelSub': { fr: 'Répartition du mois en cours', en: 'Breakdown for the current month' },
  'giving.donationsCount': { fr: 'don(s)', en: 'donation(s)' },
  'giving.ofTotal': { fr: 'du total', en: 'of total' },
  'giving.noDonationsMonthDot': { fr: 'Aucun don ce mois-ci.', en: 'No donations this month.' },
  'giving.recent': { fr: 'Dons récents', en: 'Recent donations' },
  'giving.lastMovements': { fr: 'derniers mouvements', en: 'latest movements' },
  'giving.emptyLedger': {
    fr: "Aucun don enregistré pour l'instant.",
    en: 'No donations recorded yet.',
  },
  'giving.loadingLedger': { fr: 'Chargement du ledger…', en: 'Loading ledger…' },
  'giving.colRef': { fr: 'Référence', en: 'Reference' },
  'giving.colDate': { fr: 'Date', en: 'Date' },
  'giving.colFund': { fr: 'Fonds', en: 'Fund' },
  'giving.colChannel': { fr: 'Canal', en: 'Channel' },
  'giving.colAmount': { fr: 'Montant', en: 'Amount' },
  'giving.colStatus': { fr: 'Statut', en: 'Status' },
  'giving.confirmExportTitle': { fr: 'Exporter les dons en CSV ?', en: 'Export donations to CSV?' },
  'giving.confirmExportMsg': {
    fr: 'Un fichier contenant les données financières (montants, donateurs non anonymes) sera téléchargé. Manipulez-le conformément à la confidentialité.',
    en: 'A file containing financial data (amounts, non-anonymous donors) will be downloaded. Handle it in line with confidentiality.',
  },
  'giving.confirmExportLabel': { fr: 'Exporter', en: 'Export' },
  'giving.exportGenerated': { fr: 'Export généré', en: 'Export generated' },
  'giving.exportFailed': { fr: "L'export a échoué", en: 'Export failed' },
  'giving.eyebrow': { fr: 'Don', en: 'Donation' },
  'giving.donationOf': { fr: 'Don de', en: 'Donation of' },
  'giving.towardFund': { fr: 'vers le fonds «', en: 'toward the «' },
  'giving.fundClose': { fr: '»', en: '» fund' },
  'giving.via': { fr: 'via', en: 'via' },
  'giving.anonymously': { fr: ', à titre anonyme', en: ', anonymously' },
  'giving.transaction': { fr: 'Transaction', en: 'Transaction' },
  'giving.paymentChannel': { fr: 'Canal de paiement', en: 'Payment channel' },
  'giving.donorAndDate': { fr: 'Donateur & date', en: 'Donor & date' },
  'giving.donor': { fr: 'Donateur', en: 'Donor' },
  'giving.donorAnonHint': { fr: 'Le don a été fait de manière anonyme.', en: 'The donation was made anonymously.' },
  'giving.anonymous': { fr: 'Anonyme', en: 'Anonymous' },
  'giving.donStatus.received': {
    fr: 'Paiement reçu et réconcilié — comptabilisé dans les totaux du fonds.',
    en: 'Payment received and reconciled — counted in the fund totals.',
  },
  'giving.donStatus.pending': {
    fr: 'Paiement initié, en attente de confirmation du fournisseur.',
    en: 'Payment initiated, awaiting provider confirmation.',
  },
  'giving.donStatus.failed': {
    fr: 'Le paiement a échoué — aucun montant n’a été comptabilisé.',
    en: 'The payment failed — no amount was counted.',
  },
  'channel.wallet': { fr: 'Wallet Amen', en: 'Amen Wallet' },
  'channel.momo': { fr: 'Mobile money', en: 'Mobile money' },
  'channel.mpesa': { fr: 'M-Pesa', en: 'M-Pesa' },
  'channel.airtel': { fr: 'Airtel Money', en: 'Airtel Money' },
  'channel.orange': { fr: 'Orange Money', en: 'Orange Money' },
  'channel.afrimoney': { fr: 'Afrimoney', en: 'Afrimoney' },
  'channel.card': { fr: 'Carte bancaire', en: 'Bank card' },
  'channel.cash': { fr: 'Espèces', en: 'Cash' },

  // ── Communications ──
  'comms.title': { fr: 'Communications', en: 'Communications' },
  'comms.subtitle': {
    fr: "Diffuser une notification push aux membres de l'Église",
    en: 'Broadcast a push notification to church members',
  },
  'comms.noRights': {
    fr: "Vous n'avez pas les droits pour diffuser une notification. Réservé au staff (pasteur/administrateur).",
    en: 'You do not have permission to broadcast a notification. Restricted to staff (pastor/administrator).',
  },
  'comms.realtimeTitle': { fr: 'Diffusion en temps réel', en: 'Real-time broadcast' },
  'comms.realtimeBody': {
    fr: "Le message part en notification push et s'affiche dans l'onglet Today. L'envoi est immédiat et irréversible — relisez l'aperçu avant de diffuser.",
    en: 'The message is sent as a push notification and shows in the Today tab. Delivery is immediate and irreversible — review the preview before broadcasting.',
  },
  'comms.newBroadcast': { fr: 'Nouvelle diffusion', en: 'New broadcast' },
  'comms.newBroadcastSub': {
    fr: 'Composez à gauche, prévisualisez à droite.',
    en: 'Compose on the left, preview on the right.',
  },
  'comms.audience': { fr: 'Audience', en: 'Audience' },
  'comms.audienceAll': { fr: 'Tous les membres', en: 'All members' },
  'comms.audienceAllDesc': { fr: 'Tous les comptes de la communauté.', en: 'All community accounts.' },
  'comms.audienceDevo': { fr: 'Abonnés dévotion', en: 'Devotional subscribers' },
  'comms.audienceDevoDesc': {
    fr: 'Membres qui lisent la dévotion quotidienne.',
    en: 'Members who read the daily devotional.',
  },
  'comms.titleLabel': { fr: 'Titre', en: 'Title' },
  'comms.titlePlaceholder': { fr: 'Ex. Culte de dimanche · 9h', en: 'E.g. Sunday service · 9am' },
  'comms.message': { fr: 'Message', en: 'Message' },
  'comms.messagePlaceholder': {
    fr: 'Le contenu de la notification, clair et concis.',
    en: 'The notification content, clear and concise.',
  },
  'comms.previewMobile': { fr: 'Aperçu sur mobile', en: 'Mobile preview' },
  'comms.pushNow': { fr: 'maintenant', en: 'now' },
  'comms.pushTitlePlaceholder': { fr: 'Titre de la notification', en: 'Notification title' },
  'comms.pushBodyPlaceholder': {
    fr: 'Le message s’affichera ici, tel que les membres le verront.',
    en: 'The message will appear here, as members will see it.',
  },
  'comms.target': { fr: 'Cible :', en: 'Target:' },
  'comms.titleBodyRequired': { fr: ' · titre et message requis', en: ' · title and message required' },
  'comms.sending': { fr: 'Envoi…', en: 'Sending…' },
  'comms.broadcast': { fr: 'Diffuser', en: 'Broadcast' },
  'comms.confirmTitle': { fr: 'Diffuser cette notification ?', en: 'Broadcast this notification?' },
  'comms.confirmMsg': {
    fr: "Le message sera envoyé en push et apparaîtra dans l'onglet Today de tous les membres ciblés. Cette action est irréversible.",
    en: 'The message will be pushed and appear in the Today tab of all targeted members. This action is irreversible.',
  },
  'comms.confirmLabel': { fr: 'Diffuser maintenant', en: 'Broadcast now' },
  'comms.sentTitle': { fr: 'Notification diffusée', en: 'Notification broadcast' },
  'comms.notified': { fr: 'membre(s) notifié(s) ·', en: 'member(s) notified ·' },
  'comms.pushSent': { fr: 'push envoyé(s).', en: 'push(es) sent.' },
  'comms.sendFailed': { fr: 'La diffusion a échoué', en: 'Broadcast failed' },

  // ── Activity ──
  'activity.title': { fr: 'Activité', en: 'Activity' },
  'activity.subtitle': {
    fr: 'Journal des actions transverses de la plateforme',
    en: 'Log of cross-platform actions',
  },
  'activity.feed': { fr: "Flux d'activité", en: 'Activity feed' },
  'activity.entries': { fr: 'entrées', en: 'entries' },
  'activity.empty': { fr: 'Aucune activité enregistrée', en: 'No activity recorded' },
  'activity.loading': { fr: 'Chargement du journal…', en: 'Loading log…' },
  'activity.all': { fr: 'Tout', en: 'All' },
  'activity.emptyFilter': { fr: 'Aucune entrée pour ce filtre.', en: 'No entries for this filter.' },
  'activity.eyebrow': { fr: 'Activité', en: 'Activity' },
  'activity.entry': { fr: "Entrée d'activité", en: 'Activity entry' },
  'activity.actionDetail': { fr: "Détail de l'action", en: 'Action detail' },
  'activity.metadata': { fr: 'Métadonnées', en: 'Metadata' },
  'activity.type': { fr: 'Type', en: 'Type' },
  'activity.actor': { fr: 'Acteur', en: 'Actor' },
  'activity.when': { fr: 'Quand', en: 'When' },
  'activity.timestamp': { fr: 'Horodatage', en: 'Timestamp' },
  // Temps relatif
  'activity.justNow': { fr: "à l'instant", en: 'just now' },
  'activity.minAgo': { fr: 'il y a {n} min', en: '{n} min ago' },
  'activity.hAgo': { fr: 'il y a {n} h', en: '{n} h ago' },
  'activity.yesterday': { fr: 'hier', en: 'yesterday' },
  'activity.dAgo': { fr: 'il y a {n} j', en: '{n} d ago' },
  'activity.today': { fr: "Aujourd'hui", en: 'Today' },
  'activity.yesterdayCap': { fr: 'Hier', en: 'Yesterday' },
  // Types d'événements
  'kind.give': { fr: 'Don', en: 'Donation' },
  'kind.give.desc': { fr: 'Un don a été effectué vers un fonds.', en: 'A donation was made to a fund.' },
  'kind.prayer': { fr: 'Prière', en: 'Prayer' },
  'kind.prayer.desc': { fr: 'Une demande de prière a été soumise.', en: 'A prayer request was submitted.' },
  'kind.appts': { fr: 'Rendez-vous', en: 'Appointment' },
  'kind.appts.desc': {
    fr: 'Un rendez-vous pastoral a été pris ou modifié.',
    en: 'A pastoral appointment was booked or changed.',
  },
  'kind.events': { fr: 'Événement', en: 'Event' },
  'kind.events.desc': { fr: 'Un membre a répondu à un événement (RSVP).', en: 'A member responded to an event (RSVP).' },
  'kind.broadcast': { fr: 'Diffusion', en: 'Broadcast' },
  'kind.broadcast.desc': {
    fr: 'Une notification a été diffusée aux membres.',
    en: 'A notification was broadcast to members.',
  },
  'kind.live': { fr: 'Direct', en: 'Live' },
  'kind.live.desc': { fr: 'Une session de culte en direct a changé d’état.', en: 'A live service session changed state.' },
  'kind.fallback.desc': { fr: 'Action enregistrée dans le journal.', en: 'Action recorded in the log.' },

  // ── Care ──
  'care.title': { fr: 'Soin pastoral', en: 'Pastoral care' },
  'care.subtitle': {
    fr: 'File de prières confidentielle & rendez-vous du jour',
    en: 'Confidential prayer queue & appointments',
  },
  'care.privacyTitle': { fr: 'La confidentialité pastorale est active', en: 'Pastoral confidentiality is active' },
  'care.privacyBody': {
    fr: 'Les demandes de prière privées sont protégées et exclues des analyses, exports et fonctions IA. Chaque accès est journalisé.',
    en: 'Private prayer requests are protected and excluded from analytics, exports and AI features. Each access is logged.',
  },
  'care.prayerQueue': { fr: 'File de prières', en: 'Prayer queue' },
  'care.pending': { fr: 'en attente', en: 'pending' },
  'care.emptyQueue': { fr: 'File vide 🎉', en: 'Queue empty 🎉' },
  'care.loadingQueue': { fr: 'Chargement de la file…', en: 'Loading queue…' },
  'care.colRequester': { fr: 'Demandeur', en: 'Requester' },
  'care.colVisibility': { fr: 'Visibilité', en: 'Visibility' },
  'care.colRequest': { fr: 'Demande', en: 'Request' },
  'care.colActions': { fr: 'Actions', en: 'Actions' },
  'care.approve': { fr: 'Approuver', en: 'Approve' },
  'care.respond': { fr: 'Répondre', en: 'Respond' },
  'care.appointments': { fr: 'Rendez-vous', en: 'Appointments' },
  'care.scheduled': { fr: 'planifiés', en: 'scheduled' },
  'care.emptyAppts': { fr: 'Aucun rendez-vous planifié.', en: 'No appointments scheduled.' },
  'care.loadingAppts': { fr: 'Chargement des rendez-vous…', en: 'Loading appointments…' },
  'care.colWhen': { fr: 'Quand', en: 'When' },
  'care.colMember': { fr: 'Membre', en: 'Member' },
  'care.colTopic': { fr: 'Sujet', en: 'Topic' },
  'care.colStatus': { fr: 'Statut', en: 'Status' },
  'care.confirm': { fr: 'Confirmer', en: 'Confirm' },
  'care.cancel': { fr: 'Annuler', en: 'Cancel' },
  'care.cancelAppt': { fr: 'Annuler le RDV', en: 'Cancel appointment' },
  'care.member': { fr: 'Membre', en: 'Member' },
  // Visibilité
  'visibility.private': { fr: 'Privée', en: 'Private' },
  'visibility.anon': { fr: 'Anonyme', en: 'Anonymous' },
  'visibility.public': { fr: 'Publique', en: 'Public' },
  'visibility.private.desc': {
    fr: 'Confidentielle — visible du staff uniquement, exclue des analyses et exports.',
    en: 'Confidential — visible to staff only, excluded from analytics and exports.',
  },
  'visibility.anon.desc': {
    fr: 'Publique mais anonyme — le nom du demandeur n’est pas affiché.',
    en: 'Public but anonymous — the requester’s name is not shown.',
  },
  'visibility.public.desc': {
    fr: 'Publique — visible et nominative sur le mur de prière.',
    en: 'Public — visible and named on the prayer wall.',
  },
  // Prayer detail
  'care.prayerEyebrow': { fr: 'Demande de prière', en: 'Prayer request' },
  'care.prayerSubmitted': { fr: 'a soumis une demande de prière', en: 'submitted a prayer request' },
  'care.on': { fr: 'le', en: 'on' },
  'care.requestContent': { fr: 'Contenu de la demande', en: 'Request content' },
  'care.pastoralFollowup': { fr: 'Suivi pastoral', en: 'Pastoral follow-up' },
  'care.requester': { fr: 'Demandeur', en: 'Requester' },
  'care.confidentiality': { fr: 'Confidentialité', en: 'Confidentiality' },
  'care.receivedOn': { fr: 'Reçue le', en: 'Received on' },
  'care.prayerStatus.pending': { fr: 'En attente de modération dans la file de care.', en: 'Awaiting moderation in the care queue.' },
  'care.prayerStatus.approved': { fr: 'Approuvée et visible sur le mur de prière.', en: 'Approved and visible on the prayer wall.' },
  'care.prayerStatus.answered': { fr: 'Une réponse pastorale a été envoyée au demandeur.', en: 'A pastoral response was sent to the requester.' },
  'care.prayerStatus.rejected': { fr: 'Demande rejetée.', en: 'Request rejected.' },
  'care.confirmApproveTitle': { fr: 'Approuver cette prière ?', en: 'Approve this prayer?' },
  'care.confirmApproveMsg': {
    fr: 'La demande de {who} sera publiée et sortira de la file de modération.',
    en: 'The request from {who} will be published and leave the moderation queue.',
  },
  'care.approved': { fr: 'Prière approuvée', en: 'Prayer approved' },
  'care.approveFailed': { fr: "L'approbation a échoué", en: 'Approval failed' },
  'care.confirmRespondTitle': { fr: 'Envoyer une réponse pastorale ?', en: 'Send a pastoral response?' },
  'care.confirmRespondMsg': {
    fr: "Un message d'encouragement sera envoyé à {who}.",
    en: 'An encouragement message will be sent to {who}.',
  },
  'care.send': { fr: 'Envoyer', en: 'Send' },
  'care.responseSent': { fr: 'Réponse envoyée', en: 'Response sent' },
  'care.sendFailed': { fr: "L'envoi a échoué", en: 'Sending failed' },
  // Appointment detail
  'care.bookedFor': { fr: 'a pris rendez-vous pour «', en: 'booked an appointment for «' },
  'care.topicClose': { fr: '»', en: '»' },
  'care.appt': { fr: 'Rendez-vous', en: 'Appointment' },
  'care.topic': { fr: 'Sujet', en: 'Topic' },
  'care.dateTime': { fr: 'Date & heure', en: 'Date & time' },
  'care.place': { fr: 'Lieu', en: 'Location' },
  'care.people': { fr: 'Personnes', en: 'People' },
  'care.phone': { fr: 'Téléphone', en: 'Phone' },
  'care.pastor': { fr: 'Pasteur', en: 'Pastor' },
  'care.noPastorAssigned': { fr: 'Aucun pasteur n’a encore été assigné.', en: 'No pastor has been assigned yet.' },
  'care.memberNote': { fr: 'Note du membre', en: 'Member note' },
  'care.history': { fr: 'Historique', en: 'History' },
  'care.requestedOn': { fr: 'Demandé le', en: 'Requested on' },
  'care.apptStatus.tentative': { fr: 'Demande reçue, en attente de confirmation par le staff.', en: 'Request received, awaiting staff confirmation.' },
  'care.apptStatus.confirmed': { fr: 'Rendez-vous confirmé — le membre a été notifié.', en: 'Appointment confirmed — the member was notified.' },
  'care.apptStatus.cancelled': { fr: 'Rendez-vous annulé.', en: 'Appointment cancelled.' },
  'care.confirmApptTitle': { fr: 'Confirmer le rendez-vous ?', en: 'Confirm the appointment?' },
  'care.cancelApptTitle': { fr: 'Annuler le rendez-vous ?', en: 'Cancel the appointment?' },
  'care.confirmApptMsg': {
    fr: 'Le rendez-vous « {topic} » sera marqué confirmé pour le membre.',
    en: 'The « {topic} » appointment will be marked confirmed for the member.',
  },
  'care.cancelApptMsg': {
    fr: 'Le rendez-vous « {topic} » sera annulé. Le membre en sera informé.',
    en: 'The « {topic} » appointment will be cancelled. The member will be notified.',
  },
  'care.apptConfirmed': { fr: 'Rendez-vous confirmé', en: 'Appointment confirmed' },
  'care.apptCancelled': { fr: 'Rendez-vous annulé', en: 'Appointment cancelled' },
  'care.updateFailed': { fr: 'La mise à jour a échoué', en: 'Update failed' },

  // ── Content ──
  'content.title': { fr: 'Contenus', en: 'Content' },
  'content.subtitle': {
    fr: "Vidéos, sermons & directs · l'app se met à jour automatiquement",
    en: 'Videos, sermons & live · the app updates automatically',
  },
  'content.new': { fr: 'Nouveau contenu', en: 'New content' },
  'content.live': { fr: 'Direct', en: 'Live' },
  'content.liveSub': { fr: 'Session de culte en temps réel', en: 'Real-time service session' },
  'content.liveEmpty': {
    fr: 'Aucune session live. Activez « En direct » sur un contenu ci-dessous.',
    en: 'No live session. Enable “Live” on a content item below.',
  },
  'content.loadingLive': { fr: 'Chargement du direct…', en: 'Loading live…' },
  'content.onAir': { fr: 'EN DIRECT', en: 'LIVE' },
  'content.offline': { fr: 'Hors ligne', en: 'Offline' },
  'content.viewers': { fr: 'Spectateurs', en: 'Viewers' },
  'content.peak': { fr: "Pic d'audience", en: 'Peak audience' },
  'content.amens': { fr: 'Amens', en: 'Amens' },
  'content.library': { fr: 'Bibliothèque', en: 'Library' },
  'content.librarySub': {
    fr: 'Collez un lien MP4 / flux HLS (.m3u8) ou un chemin auto-hébergé, choisissez la catégorie et activez le direct.',
    en: 'Paste an MP4 link / HLS stream (.m3u8) or a self-hosted path, pick a category and enable live.',
  },
  'content.emptyLibrary': { fr: 'Aucun contenu dans la bibliothèque.', en: 'No content in the library.' },
  'content.loadingLibrary': { fr: 'Chargement de la bibliothèque…', en: 'Loading library…' },
  'content.colTitle': { fr: 'Titre', en: 'Title' },
  'content.colCategory': { fr: 'Catégorie', en: 'Category' },
  'content.colStatus': { fr: 'Statut', en: 'Status' },
  'content.colLive': { fr: 'En direct', en: 'Live' },
  'content.colActions': { fr: 'Actions', en: 'Actions' },
  'content.featured': { fr: 'À la une', en: 'Featured' },
  'content.no': { fr: 'Non', en: 'No' },
  'content.yes': { fr: 'Oui', en: 'Yes' },
  'content.liveShort': { fr: 'Live', en: 'Live' },
  'content.edit': { fr: 'Éditer', en: 'Edit' },
  'content.delete': { fr: 'Supprimer', en: 'Delete' },
  // Modal
  'content.editHeading': { fr: 'Modifier le contenu', en: 'Edit content' },
  'content.newHeading': { fr: 'Nouveau contenu', en: 'New content' },
  'content.modalLabel': { fr: 'Watch · bibliothèque vidéo', en: 'Watch · video library' },
  'content.saving': { fr: 'Enregistrement…', en: 'Saving…' },
  'content.save': { fr: 'Enregistrer', en: 'Save' },
  'content.cancel': { fr: 'Annuler', en: 'Cancel' },
  'content.identity': { fr: 'Identité', en: 'Identity' },
  'content.fieldTitle': { fr: 'Titre', en: 'Title' },
  'content.speaker': { fr: 'Intervenant', en: 'Speaker' },
  'content.series': { fr: 'Série', en: 'Series' },
  'content.description': { fr: 'Description', en: 'Description' },
  'content.media': { fr: 'Média', en: 'Media' },
  'content.mediaSub': { fr: "Lien lu par l'app mobile", en: 'Link played by the mobile app' },
  'content.videoLink': {
    fr: 'Lien vidéo (MP4 / HLS .m3u8) ou chemin auto-hébergé',
    en: 'Video link (MP4 / HLS .m3u8) or self-hosted path',
  },
  'content.videoLinkPlaceholder': {
    fr: '/media/videos/sunday-service.mp4  ou  https://…/stream.m3u8',
    en: '/media/videos/sunday-service.mp4  or  https://…/stream.m3u8',
  },
  'content.thumbnail': { fr: "Vignette (URL d'image, optionnel)", en: 'Thumbnail (image URL, optional)' },
  'content.duration': { fr: 'Durée (ex. 38 min)', en: 'Duration (e.g. 38 min)' },
  'content.classifyBroadcast': { fr: 'Classement & diffusion', en: 'Classification & broadcast' },
  'content.category': { fr: 'Catégorie', en: 'Category' },
  'content.status': { fr: 'Statut', en: 'Status' },
  'content.type': { fr: 'Type', en: 'Type' },
  'content.typeVideo': { fr: 'Vidéo', en: 'Video' },
  'content.typeLive': { fr: 'En direct', en: 'Live' },
  'content.setFeatured': { fr: 'Mettre à la une', en: 'Feature' },
  'content.preview': { fr: 'Aperçu', en: 'Preview' },
  'content.previewTitle': { fr: 'Titre du contenu', en: 'Content title' },
  'content.toSave': { fr: 'Pour enregistrer :', en: 'To save:' },
  'content.created': { fr: 'Contenu créé', en: 'Content created' },
  'content.updated': { fr: 'Contenu mis à jour', en: 'Content updated' },
  'content.saveFailed': { fr: "L'enregistrement a échoué", en: 'Saving failed' },
  // Status hints
  'content.statusHint.published': { fr: 'Visible immédiatement dans l’app mobile des membres.', en: 'Immediately visible in the members’ mobile app.' },
  'content.statusHint.draft': { fr: 'Brouillon — invisible des membres tant qu’il n’est pas publié.', en: 'Draft — hidden from members until published.' },
  'content.statusHint.scheduled': { fr: 'Programmé — invisible jusqu’à publication manuelle.', en: 'Scheduled — hidden until manually published.' },
  // Validation
  'content.errVideoRequired': { fr: 'Le lien vidéo est obligatoire.', en: 'The video link is required.' },
  'content.errVideoFormat': {
    fr: 'Entrez une URL http(s) (MP4/HLS) ou un chemin auto-hébergé commençant par /media/.',
    en: 'Enter an http(s) URL (MP4/HLS) or a self-hosted path starting with /media/.',
  },
  'content.errThumb': { fr: 'La vignette doit être une URL http(s).', en: 'The thumbnail must be an http(s) URL.' },
  'content.errTitleRequired': { fr: 'Le titre est obligatoire.', en: 'The title is required.' },
  // Toggle live
  'content.confirmGoLiveTitle': { fr: 'Passer ce contenu en direct ?', en: 'Set this content live?' },
  'content.confirmStopLiveTitle': { fr: 'Arrêter le direct ?', en: 'Stop the live?' },
  'content.confirmGoLiveMsg': {
    fr: "« {title} » sera signalé EN DIRECT dans l'app mobile des membres.",
    en: '“{title}” will be flagged LIVE in the members’ mobile app.',
  },
  'content.confirmStopLiveMsg': {
    fr: '« {title} » ne sera plus signalé en direct.',
    en: '“{title}” will no longer be flagged live.',
  },
  'content.goLive': { fr: 'Passer en direct', en: 'Go live' },
  'content.stop': { fr: 'Arrêter', en: 'Stop' },
  'content.liveOn': { fr: 'Direct activé', en: 'Live enabled' },
  'content.liveOff': { fr: 'Direct arrêté', en: 'Live stopped' },
  'content.toggleFailed': { fr: 'Le changement a échoué', en: 'The change failed' },
  // Delete
  'content.confirmDeleteTitle': { fr: 'Supprimer ce contenu ?', en: 'Delete this content?' },
  'content.confirmDeleteMsg': {
    fr: "« {title} » sera définitivement retiré de l'app. Cette action est irréversible.",
    en: '“{title}” will be permanently removed from the app. This action is irreversible.',
  },
  'content.deleted': { fr: 'Contenu supprimé', en: 'Content deleted' },
  'content.deleteFailed': { fr: 'La suppression a échoué', en: 'Deletion failed' },
  // Detail
  'content.eyebrow': { fr: 'Contenu', en: 'Content' },
  'content.liveContent': { fr: 'Contenu diffusé en direct', en: 'Live-broadcast content' },
  'content.vod': { fr: 'Vidéo à la demande', en: 'On-demand video' },
  'content.ofCategory': { fr: 'de la catégorie «', en: 'in the «' },
  'content.categoryClose': { fr: '»', en: '» category' },
  'content.presentedBy': { fr: ', présenté par', en: ', presented by' },
  'content.publishedVisible': { fr: 'Publié et visible dans l’app mobile.', en: 'Published and visible in the mobile app.' },
  'content.scheduledNotYet': { fr: 'Programmé — pas encore visible.', en: 'Scheduled — not yet visible.' },
  'content.draftHidden': { fr: 'Brouillon — non visible des membres.', en: 'Draft — hidden from members.' },
  'content.info': { fr: 'Informations', en: 'Information' },
  'content.broadcast': { fr: 'Diffusion', en: 'Broadcast' },
  'content.liveFlagHint': { fr: 'Signalé EN DIRECT dans l’app.', en: 'Flagged LIVE in the app.' },
  'content.publishedOn': { fr: 'Publié le', en: 'Published on' },
  'content.videoLinkField': { fr: 'Lien vidéo', en: 'Video link' },

  // ── Devotions ──
  'devo.title': { fr: 'Dévotions', en: 'Devotions' },
  'devo.subtitle': {
    fr: 'Dévotion quotidienne · verset, méditation, prière & application',
    en: 'Daily devotional · verse, meditation, prayer & application',
  },
  'devo.new': { fr: 'Nouvelle dévotion', en: 'New devotional' },
  'devo.published': { fr: 'Publiées', en: 'Published' },
  'devo.devotionals': { fr: 'dévotions', en: 'devotionals' },
  'devo.emptyPublished': { fr: 'Aucune dévotion publiée pour le moment.', en: 'No devotional published yet.' },
  'devo.loading': { fr: 'Chargement des dévotions…', en: 'Loading devotionals…' },
  'devo.colDate': { fr: 'Date', en: 'Date' },
  'devo.colDevotional': { fr: 'Dévotion', en: 'Devotional' },
  'devo.colVerse': { fr: 'Verset', en: 'Verse' },
  'devo.colStatus': { fr: 'Statut', en: 'Status' },
  'devo.upcoming': { fr: 'À venir', en: 'Upcoming' },
  'devo.scheduled': { fr: 'planifiées', en: 'scheduled' },
  'devo.emptyUpcoming': { fr: 'Aucune dévotion programmée.', en: 'No scheduled devotional.' },
  'devo.loadingPlanning': { fr: 'Chargement du planning…', en: 'Loading schedule…' },
  'devo.colWhen': { fr: 'Quand', en: 'When' },
  'devo.colTitle': { fr: 'Titre', en: 'Title' },
  // Modal
  'devo.modalHeading': { fr: 'Nouvelle dévotion', en: 'New devotional' },
  'devo.modalLabel': { fr: 'Today · dévotion quotidienne', en: 'Today · daily devotional' },
  'devo.saving': { fr: 'Enregistrement…', en: 'Saving…' },
  'devo.save': { fr: 'Enregistrer', en: 'Save' },
  'devo.cancel': { fr: 'Annuler', en: 'Cancel' },
  'devo.publication': { fr: 'Publication', en: 'Publication' },
  'devo.publicationSub': { fr: 'Quand et comment elle paraît', en: 'When and how it appears' },
  'devo.devoDate': { fr: 'Date de la dévotion', en: 'Devotional date' },
  'devo.status': { fr: 'Statut', en: 'Status' },
  'devo.scheduledPublish': { fr: 'Publication programmée', en: 'Scheduled publication' },
  'devo.invalidPublishDate': { fr: 'Date de publication invalide.', en: 'Invalid publication date.' },
  'devo.scheduledNeedsDate': {
    fr: 'Une dévotion programmée exige une date de publication.',
    en: 'A scheduled devotional requires a publication date.',
  },
  'devo.scripture': { fr: 'Écriture', en: 'Scripture' },
  'devo.scriptureSub': { fr: 'Le verset du jour', en: 'The verse of the day' },
  'devo.fieldTitle': { fr: 'Titre', en: 'Title' },
  'devo.reference': { fr: 'Référence', en: 'Reference' },
  'devo.referencePlaceholder': { fr: 'ex. Jean 3:16', en: 'e.g. John 3:16' },
  'devo.verseText': { fr: 'Texte du verset', en: 'Verse text' },
  'devo.preview': { fr: 'Aperçu', en: 'Preview' },
  'devo.versePlaceholder': {
    fr: "Le verset s'affichera ici, tel que les membres le verront.",
    en: 'The verse will appear here, as members will see it.',
  },
  'devo.meditationPrayer': { fr: 'Méditation & prière', en: 'Meditation & prayer' },
  'devo.meditation': { fr: 'Méditation', en: 'Meditation' },
  'devo.prayer': { fr: 'Prière', en: 'Prayer' },
  'devo.application': { fr: 'Application', en: 'Application' },
  'devo.applicationSub': { fr: 'Mettre en pratique', en: 'Put into practice' },
  'devo.applyTitle': { fr: "Titre de l'application", en: 'Application title' },
  'devo.steps': { fr: 'Étapes — une par ligne', en: 'Steps — one per line' },
  'devo.stepsPlaceholder': {
    fr: 'Relire le verset à voix haute\nPrier pour une personne précise\nNoter une action concrète',
    en: 'Re-read the verse aloud\nPray for a specific person\nNote a concrete action',
  },
  'devo.minStep': { fr: 'Au moins une étape requise', en: 'At least one step required' },
  'devo.stepsDetected': { fr: 'étape(s) détectée(s)', en: 'step(s) detected' },
  'devo.author': { fr: 'Auteur (optionnel)', en: 'Author (optional)' },
  'devo.authorPlaceholder': { fr: 'ex. Pasteur Joseph', en: 'e.g. Pastor Joseph' },
  'devo.toSave': { fr: 'Pour enregistrer :', en: 'To save:' },
  'devo.published.toast': { fr: 'Dévotion publiée', en: 'Devotional published' },
  'devo.saved': { fr: 'Dévotion enregistrée', en: 'Devotional saved' },
  'devo.saveFailed': { fr: "L'enregistrement a échoué", en: 'Saving failed' },
  // Status hints
  'devo.statusHint.published': { fr: 'Visible par les membres selon la date de publication.', en: 'Visible to members according to the publication date.' },
  'devo.statusHint.draft': { fr: 'Brouillon — invisible des membres tant qu’il n’est pas publié.', en: 'Draft — hidden from members until published.' },
  'devo.statusHint.scheduled': { fr: 'Programmé — nécessite une date/heure de publication ci-dessous.', en: 'Scheduled — requires a publication date/time below.' },
  // Validation
  'devo.errDate': { fr: 'La date est obligatoire (ex. 2026-06-01).', en: 'The date is required (e.g. 2026-06-01).' },
  'devo.errDateShort': { fr: 'La date est obligatoire.', en: 'The date is required.' },
  'devo.errTitle': { fr: 'Le titre est obligatoire.', en: 'The title is required.' },
  'devo.errVerseRef': { fr: 'La référence du verset est obligatoire.', en: 'The verse reference is required.' },
  'devo.errVerseText': { fr: 'Le texte du verset est obligatoire.', en: 'The verse text is required.' },
  'devo.errBody': { fr: 'La méditation est obligatoire.', en: 'The meditation is required.' },
  'devo.errPrayer': { fr: 'La prière est obligatoire.', en: 'The prayer is required.' },
  'devo.errApplyTitle': { fr: "Le titre de l'application est obligatoire.", en: 'The application title is required.' },
  'devo.errSteps': { fr: "Ajoutez au moins une étape d'application (une par ligne).", en: 'Add at least one application step (one per line).' },
  'devo.errScheduledNeedsDate': { fr: 'Un statut « programmé » exige une date/heure de publication.', en: 'A “scheduled” status requires a publication date/time.' },
  'devo.errPublishInvalid': { fr: 'La date de publication est invalide.', en: 'The publication date is invalid.' },
  // Detail
  'devo.eyebrow': { fr: 'Dévotion quotidienne', en: 'Daily devotional' },
  'devo.fallbackTitle': { fr: 'Dévotion', en: 'Devotional' },
  'devo.devotionalOf': { fr: 'Dévotion du', en: 'Devotional of' },
  'devo.anchoredOn': { fr: 'ancrée sur', en: 'anchored on' },
  'devo.writtenBy': { fr: ', rédigée par', en: ', written by' },
  'devo.publishedReadable': { fr: 'Publiée et lisible par les membres.', en: 'Published and readable by members.' },
  'devo.scheduledNotYet': { fr: 'Programmée — pas encore visible.', en: 'Scheduled — not yet visible.' },
  'devo.draftHidden': { fr: 'Brouillon — non visible des membres.', en: 'Draft — hidden from members.' },
  'devo.info': { fr: 'Informations', en: 'Information' },
  'devo.date': { fr: 'Date', en: 'Date' },
  'devo.keyVerse': { fr: 'Verset clé', en: 'Key verse' },
  'devo.authorField': { fr: 'Auteur', en: 'Author' },
  'devo.publication.field': { fr: 'Publication', en: 'Publication' },

  // ── Community ──
  'community.title': { fr: 'Communauté', en: 'Community' },
  'community.subtitle': { fr: "Groupes de maison & événements de l'Église", en: 'House groups & church events' },
  'community.member': { fr: 'Membre', en: 'Member' },
  'community.full': { fr: 'Complet', en: 'Full' },
  // Groups panel
  'community.groups': { fr: 'Groupes', en: 'Groups' },
  'community.groupsCount': { fr: 'groupes', en: 'groups' },
  'community.newShort': { fr: 'Nouveau', en: 'New' },
  'community.newGroup': { fr: 'Nouveau groupe', en: 'New group' },
  'community.emptyGroups': { fr: "Aucun groupe de maison pour l'instant.", en: 'No house groups yet.' },
  'community.loadingGroups': { fr: 'Chargement des groupes…', en: 'Loading groups…' },
  'community.colGroup': { fr: 'Groupe', en: 'Group' },
  'community.colLeader': { fr: 'Leader', en: 'Leader' },
  'community.colMembers': { fr: 'Membres', en: 'Members' },
  'community.colConversation': { fr: 'Conversation', en: 'Conversation' },
  'community.openConversation': { fr: 'Ouvrir la conversation du groupe', en: 'Open group conversation' },
  'community.conversationOf': { fr: 'Conversation de {name}', en: 'Conversation of {name}' },
  // Events panel
  'community.events': { fr: 'Événements', en: 'Events' },
  'community.eventsScheduled': { fr: 'planifiés', en: 'scheduled' },
  'community.newEvent': { fr: 'Nouvel événement', en: 'New event' },
  'community.emptyEvents': { fr: 'Aucun événement planifié.', en: 'No events scheduled.' },
  'community.loadingEvents': { fr: 'Chargement des événements…', en: 'Loading events…' },
  'community.colWhen': { fr: 'Quand', en: 'When' },
  'community.colEvent': { fr: 'Événement', en: 'Event' },
  'community.colRsvp': { fr: 'RSVP', en: 'RSVP' },
  // Group members
  'community.membersTitle': { fr: 'Membres', en: 'Members' },
  'community.searchMember': { fr: 'Rechercher un membre à ajouter…', en: 'Search for a member to add…' },
  'community.add': { fr: 'Ajouter', en: 'Add' },
  'community.memberAdded': { fr: 'Membre ajouté', en: 'Member added' },
  'community.addFailed': { fr: "L'ajout a échoué", en: 'Adding failed' },
  'community.confirmRemoveTitle': { fr: 'Retirer ce membre ?', en: 'Remove this member?' },
  'community.confirmRemoveMsg': { fr: '{name} sera retiré du groupe.', en: '{name} will be removed from the group.' },
  'community.remove': { fr: 'Retirer', en: 'Remove' },
  'community.memberRemoved': { fr: 'Membre retiré', en: 'Member removed' },
  'community.removeFailed': { fr: 'Le retrait a échoué', en: 'Removal failed' },
  'community.emptyGroupMembers': { fr: 'Aucun membre dans ce groupe.', en: 'No members in this group.' },
  'community.loadingMembers': { fr: 'Chargement des membres…', en: 'Loading members…' },
  'community.removeFromGroup': { fr: 'Retirer du groupe', en: 'Remove from group' },
  // Conversation
  'community.conversationEyebrow': { fr: 'Conversation du groupe', en: 'Group conversation' },
  'community.emptyConversation': { fr: 'Aucun message dans ce groupe.', en: 'No messages in this group.' },
  'community.loadingConversation': { fr: 'Chargement de la conversation…', en: 'Loading conversation…' },
  'community.confirmDeleteMsgTitle': { fr: 'Supprimer ce message ?', en: 'Delete this message?' },
  'community.confirmDeleteMsgMsg': {
    fr: 'Le message de {who} sera définitivement retiré de la conversation.',
    en: 'The message from {who} will be permanently removed from the conversation.',
  },
  'community.deleteMsg': { fr: 'Supprimer', en: 'Delete' },
  'community.msgDeleted': { fr: 'Message supprimé', en: 'Message deleted' },
  'community.msgDeleteFailed': { fr: 'La suppression a échoué', en: 'Deletion failed' },
  'community.deleteMessage': { fr: 'Supprimer le message', en: 'Delete message' },
  // Group modal
  'community.groupCreated': { fr: 'Groupe créé', en: 'Group created' },
  'community.createFailed': { fr: 'La création a échoué', en: 'Creation failed' },
  'community.modalNewGroup': { fr: 'Nouveau groupe', en: 'New group' },
  'community.modalGroupLabel': { fr: 'Communauté · groupe de maison', en: 'Community · house group' },
  'community.creating': { fr: 'Création…', en: 'Creating…' },
  'community.create': { fr: 'Créer', en: 'Create' },
  'community.cancel': { fr: 'Annuler', en: 'Cancel' },
  'community.groupFallback': { fr: 'Groupe', en: 'Group' },
  'community.groupNamePlaceholder': { fr: 'Nom du groupe', en: 'Group name' },
  'community.meetSchedulePlaceholder': { fr: 'Horaire de rencontre', en: 'Meeting schedule' },
  'community.name': { fr: 'Nom', en: 'Name' },
  'community.meets': { fr: 'Rencontres (ex. Mardi 19h)', en: 'Meets (e.g. Tuesday 7pm)' },
  'community.description': { fr: 'Description', en: 'Description' },
  // Event modal
  'community.eventCreated': { fr: 'Événement créé', en: 'Event created' },
  'community.modalNewEvent': { fr: 'Nouvel événement', en: 'New event' },
  'community.modalEventLabel': { fr: 'Communauté · agenda', en: 'Community · calendar' },
  'community.eventName': { fr: "Nom de l'événement", en: 'Event name' },
  'community.date': { fr: 'Date', en: 'Date' },
  'community.time': { fr: 'Heure', en: 'Time' },
  'community.place': { fr: 'Lieu', en: 'Location' },
  'community.capacity': { fr: 'Capacité', en: 'Capacity' },
  'community.eventNamePlaceholder': { fr: "Nom de l'événement", en: 'Event name' },
  'community.capacitySeats': { fr: 'Capacité : {n} places', en: 'Capacity: {n} seats' },
  // Group detail
  'community.groupEyebrow': { fr: 'Groupe de maison', en: 'House group' },
  'community.groupLeadGathering': { fr: 'Groupe de maison réunissant', en: 'House group gathering' },
  'community.membersLower': { fr: 'membre(s)', en: 'member(s)' },
  'community.ledBy': { fr: ', animé par', en: ', led by' },
  'community.meetsAt': { fr: '. Se réunit', en: '. Meets' },
  'community.info': { fr: 'Informations', en: 'Information' },
  'community.leader': { fr: 'Leader', en: 'Leader' },
  'community.meetings': { fr: 'Rencontres', en: 'Meetings' },
  // Event detail
  'community.eventEyebrow': { fr: 'Événement', en: 'Event' },
  'community.eventPlannedOn': { fr: 'Événement prévu le', en: 'Event scheduled for' },
  'community.atPlace': { fr: 'à', en: 'at' },
  'community.confirmedParticipants': { fr: 'participant(s) confirmé(s)', en: 'confirmed participant(s)' },
  'community.outOfSeats': { fr: 'sur {n} places', en: 'of {n} seats' },
  'community.details': { fr: 'Détails', en: 'Details' },
  'community.dateTime': { fr: 'Date & heure', en: 'Date & time' },
  'community.participation': { fr: 'Participation', en: 'Participation' },
  'community.ofCapacity': { fr: '{n}% de la capacité', en: '{n}% of capacity' },

  // ── Login ──
  'login.title': { fr: 'Connexion staff', en: 'Staff sign-in' },
  'login.subtitle': {
    fr: 'Accès réservé aux pasteurs et administrateurs.',
    en: 'Access restricted to pastors and administrators.',
  },
  'login.error': { fr: 'Erreur', en: 'Error' },
  'login.phone': { fr: 'Téléphone (E.164)', en: 'Phone (E.164)' },
  'login.requestCode': { fr: 'Recevoir le code', en: 'Get the code' },
  'login.otp': {
    fr: 'Code OTP (visible dans les logs backend en dev)',
    en: 'OTP code (shown in backend logs in dev)',
  },
  'login.signIn': { fr: 'Se connecter', en: 'Sign in' },
  'login.changeNumber': { fr: 'Changer de numéro', en: 'Change number' },
  'login.serverUnreachable': {
    fr: 'Serveur injoignable. Vérifiez votre connexion réseau et réessayez.',
    en: 'Server unreachable. Check your network connection and try again.',
  },
  'login.genericError': { fr: 'Une erreur est survenue.', en: 'An error occurred.' },
};

/** Traduit une clé selon la langue courante (helper plat, sans hook). */
export function t(key: string): string {
  const e = DICT[key];
  if (!e) return key;
  return e[_lang] ?? e.fr;
}

/* ── Statuts / rôles / catégories : libellés bilingues ──────────── */
export type Tone =
  | 'gray' | 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'magenta' | 'teal';

export const STATUS_MAP: Record<string, { tone: Tone; fr: string; en: string }> = {
  published: { tone: 'green', fr: 'Publié', en: 'Published' },
  scheduled: { tone: 'yellow', fr: 'Programmé', en: 'Scheduled' },
  draft: { tone: 'gray', fr: 'Brouillon', en: 'Draft' },
  confirmed: { tone: 'green', fr: 'Confirmé', en: 'Confirmed' },
  tentative: { tone: 'yellow', fr: 'À confirmer', en: 'Tentative' },
  cancelled: { tone: 'red', fr: 'Annulé', en: 'Cancelled' },
  received: { tone: 'green', fr: 'Reçu', en: 'Received' },
  pending: { tone: 'yellow', fr: 'En attente', en: 'Pending' },
  failed: { tone: 'red', fr: 'Échoué', en: 'Failed' },
  approved: { tone: 'green', fr: 'Approuvée', en: 'Approved' },
  answered: { tone: 'blue', fr: 'Répondue', en: 'Answered' },
  rejected: { tone: 'red', fr: 'Rejetée', en: 'Rejected' },
};

export const ROLE_MAP: Record<string, { tone: Tone; fr: string; en: string }> = {
  admin: { tone: 'purple', fr: 'Administrateur', en: 'Administrator' },
  pastor: { tone: 'blue', fr: 'Pasteur', en: 'Pastor' },
  group_leader: { tone: 'teal', fr: 'Responsable', en: 'Leader' },
  member: { tone: 'gray', fr: 'Membre', en: 'Member' },
};

export const CATEGORY_MAP: Record<string, Entry> = {
  sermon: { fr: 'Sermon', en: 'Sermon' },
  podcast: { fr: 'Podcast', en: 'Podcast' },
  teaching: { fr: 'Enseignement', en: 'Teaching' },
  worship: { fr: 'Louange', en: 'Worship' },
  testimony: { fr: 'Témoignage', en: 'Testimony' },
  other: { fr: 'Autre', en: 'Other' },
};

/* ── Contexte React ─────────────────────────────────────────────── */
interface LangApi {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: string) => string;
}

const LangContext = createContext<LangApi | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(_lang);

  const setLang = useCallback((l: Lang) => {
    _lang = l;
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* stockage indisponible — la préférence reste en mémoire */
    }
    document.documentElement.lang = l;
    setLangState(l);
  }, []);

  const toggle = useCallback(() => {
    setLang(_lang === 'fr' ? 'en' : 'fr');
  }, [setLang]);

  const value = useMemo<LangApi>(() => ({ lang, setLang, toggle, t }), [lang, setLang, toggle]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangApi {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang doit être utilisé dans LangProvider');
  return ctx;
}
