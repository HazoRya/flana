// ─────────────────────────────────────────────
// flana.js — Module principal
// Architecture préparée pour migration Supabase
// ─────────────────────────────────────────────

const FLANA = {

  // ── CONFIG ──
  config: {
    eventsUrl: 'data/events.json',
    storageKey: 'flana_preferences',
    // Future migration : remplacer eventsUrl par un appel Supabase
    // supabaseUrl: 'https://xxx.supabase.co',
    // supabaseKey: 'votre-clé-publique',
  },

  // ── COULEURS PAR TYPE ──
  colors: {
    'brocante':   '#4A6741',
    'marche':     '#C4602A',
    'concert':    '#6B9BD2',
    'exposition': '#8A8070',
    'fete-locale':'#B5813A',
    'sport':      '#3A7B8C',
    'atelier':    '#A05C7B',
  },

  // ── LABELS PAR TYPE ──
  labels: {
    'brocante':   'Brocante',
    'marche':     'Marché',
    'concert':    'Concert',
    'exposition': 'Exposition',
    'fete-locale':'Fête locale',
    'sport':      'Sport',
    'atelier':    'Atelier',
  },

  // ── CHARGEMENT ÉVÉNEMENTS ──
  // Préparé pour être remplacé par un fetch Supabase
  async loadEvents() {
    try {
      const res = await fetch(this.config.eventsUrl);
      if (!res.ok) throw new Error('Impossible de charger les événements');
      const events = await res.json();
      return events.filter(e => this.isUpcoming(e.date));
    } catch (err) {
      console.error('Erreur chargement événements:', err);
      return [];
    }
  },

  // ── PRÉFÉRENCES UTILISATEUR ──
  getPrefs() {
    try {
      const raw = localStorage.getItem(this.config.storageKey);
      return raw ? JSON.parse(raw) : { cities: [], types: [] };
    } catch { return { cities: [], types: [] }; }
  },

  savePrefs(prefs) {
    try {
      localStorage.setItem(this.config.storageKey, JSON.stringify(prefs));
    } catch (err) {
      console.error('Erreur sauvegarde préférences:', err);
    }
  },

  resetPrefs() {
    localStorage.removeItem(this.config.storageKey);
  },

  hasPrefs() {
    const p = this.getPrefs();
    return p.cities.length > 0 || p.types.length > 0;
  },

  // ── SCORING ÉVÉNEMENTS ──
  // Trie les événements selon les préférences
  scoreEvent(event, prefs) {
    let score = 0;
    if (prefs.cities.includes(event.city)) score += 10;
    if (prefs.types.includes(event.type)) score += 5;
    if (event.isAssociation) score += 2;
    if (event.isFree) score += 1;
    return score;
  },

  sortByPrefs(events, prefs) {
    return [...events].sort((a, b) => {
      const scoreDiff = this.scoreEvent(b, prefs) - this.scoreEvent(a, prefs);
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(a.date) - new Date(b.date);
    });
  },

  // ── FILTRES ──
  filterEvents(events, filters = {}) {
    return events.filter(e => {
      if (filters.dept && e.department !== filters.dept) return false;
      if (filters.city && e.city !== filters.city) return false;
      if (filters.type && e.type !== filters.type) return false;
      if (filters.isFree === true && !e.isFree) return false;
      if (filters.isAssociation === true && !e.isAssociation) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!e.title.toLowerCase().includes(q) &&
            !e.city.toLowerCase().includes(q) &&
            !e.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  },

  // ── UTILITAIRES DATE ──
  isUpcoming(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateStr) >= today;
  },

  formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long'
    });
  },

  formatDateShort(dateStr) {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long'
    });
  },

  dateBadge(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor((new Date(dateStr) - today) / (1000*60*60*24));
    if (diff === 0) return { label: "Aujourd'hui", cls: 'badge-urgent' };
    if (diff === 1) return { label: 'Demain', cls: 'badge-urgent' };
    if (diff <= 7)  return { label: 'Cette semaine', cls: 'badge-soon' };
    if (diff <= 30) return { label: 'Ce mois-ci', cls: 'badge-soon' };
    return { label: this.formatDateShort(dateStr), cls: 'badge-later' };
  },

  // ── RENDU CARTE ──
  renderCard(event, size = 'normal') {
    const color = this.colors[event.type] || '#8A8070';
    const label = this.labels[event.type] || event.type;
    const db = this.dateBadge(event.date);
    const tarif = event.isFree ? 'Gratuit' : 'Payant';
    const tarifCls = event.isFree ? 'badge-green' : 'badge-orange';
    const img = event.imageUrl
      ? `<div class="card-img" style="background-image:url('${event.imageUrl}')"></div>`
      : `<div class="card-img card-img-placeholder" style="background:${color}20"><span style="font-size:2rem">${this.typeEmoji(event.type)}</span></div>`;

    return `
      <a class="event-card ${size === 'small' ? 'event-card-small' : ''}" href="evenement.html?id=${event.id}">
        ${img}
        <div class="card-body">
          <div class="card-badges">
            <span class="badge badge-date ${db.cls}">${db.label}</span>
            ${event.isAssociation ? '<span class="badge badge-asso">🤝 Association</span>' : ''}
          </div>
          <div class="card-cat" style="color:${color}">
            <span class="cat-dot" style="background:${color}"></span>
            ${label}
          </div>
          <div class="card-title">${event.title}</div>
          <div class="card-meta">
            <span>📍 ${event.city}</span>
            <span>🕐 ${event.time}${event.endTime ? ' – ' + event.endTime : ''}</span>
          </div>
        </div>
        <div class="card-footer">
          <span class="badge ${tarifCls}">${tarif}</span>
          <span class="card-dept">${event.department}</span>
        </div>
      </a>`;
  },

  typeEmoji(type) {
    const map = { brocante:'🛍️', marche:'🥕', concert:'🎵', exposition:'🎨', 'fete-locale':'🎉', sport:'🚴', atelier:'🎭' };
    return map[type] || '📅';
  },

  // ── ÉTAT VIDE ──
  renderEmpty(message = 'Aucun événement trouvé') {
    return `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>Rien par ici pour l'instant</h3>
        <p>${message}</p>
      </div>`;
  },

  // ── VILLES DISPONIBLES ──
  getCities(events) {
    return [...new Set(events.map(e => e.city))].sort();
  },

  getTypes(events) {
    return [...new Set(events.map(e => e.type))];
  },
};

// Exporter pour les modules
window.FLANA = FLANA;
