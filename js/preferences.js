// ─────────────────────────────────────────────
// preferences.js — Modal préférences utilisateur
// ─────────────────────────────────────────────

const PrefsModal = {

  cities: [],
  types: [],

  init(cities, types) {
    this.cities = cities;
    this.types  = types;
    this.render();
    this.bindEvents();
  },

  render() {
    const existing = document.getElementById('prefs-modal-overlay');
    if (existing) existing.remove();

    const prefs = FLANA.getPrefs();

    const cityChips = this.cities.map(city => `
      <button class="chip ${prefs.cities.includes(city) ? 'selected' : ''}"
              data-type="city" data-value="${city}">${city}</button>
    `).join('');

    const typeChips = Object.entries(FLANA.labels).map(([key, label]) => `
      <button class="chip ${prefs.types.includes(key) ? 'selected' : ''}"
              data-type="type" data-value="${key}">${FLANA.typeEmoji(key)} ${label}</button>
    `).join('');

    const html = `
      <div class="modal-overlay" id="prefs-modal-overlay">
        <div class="modal" role="dialog" aria-modal="true" aria-label="Mes préférences">
          <div class="modal-header">
            <h2 class="modal-title">Mes préférences</h2>
            <button class="modal-close" id="prefs-close" aria-label="Fermer">✕</button>
          </div>

          <p style="font-size:0.85rem;color:var(--gris);margin-bottom:1.5rem;line-height:1.6;">
            Choisissez vos villes et types d'événements préférés. Ils remonteront automatiquement en premier dans votre feed.
          </p>

          <div class="modal-section">
            <div class="modal-section-title">📍 Villes préférées</div>
            <div class="chips" id="city-chips">${cityChips}</div>
          </div>

          <div class="modal-section">
            <div class="modal-section-title">🎯 Types d'événements</div>
            <div class="chips" id="type-chips">${typeChips}</div>
          </div>

          <div class="modal-actions">
            <button class="btn-primary" id="prefs-save">Enregistrer mes préférences</button>
            <button class="btn-reset" id="prefs-reset">Réinitialiser</button>
          </div>
        </div>
      </div>`;

    document.body.insertAdjacentHTML('beforeend', html);
  },

  bindEvents() {
    // Ouvrir chips
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('chip')) {
        e.target.classList.toggle('selected');
      }
      if (e.target.id === 'prefs-close' || e.target === document.getElementById('prefs-modal-overlay')) {
        this.close();
      }
      if (e.target.id === 'prefs-save') { this.save(); }
      if (e.target.id === 'prefs-reset') { this.reset(); }
      if (e.target.id === 'open-prefs' || e.target.closest('#open-prefs')) { this.open(); }
    });

    // Fermer avec Échap
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
  },

  open() {
    const overlay = document.getElementById('prefs-modal-overlay');
    if (overlay) overlay.classList.add('open');
  },

  close() {
    const overlay = document.getElementById('prefs-modal-overlay');
    if (overlay) overlay.classList.remove('open');
  },

  save() {
    const cities = [...document.querySelectorAll('#city-chips .chip.selected')].map(c => c.dataset.value);
    const types  = [...document.querySelectorAll('#type-chips .chip.selected')].map(c => c.dataset.value);
    FLANA.savePrefs({ cities, types });
    this.close();
    // Recharger la page pour appliquer les préférences
    if (typeof window.refreshFeed === 'function') {
      window.refreshFeed();
    } else {
      window.location.reload();
    }
  },

  reset() {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
    FLANA.resetPrefs();
    this.close();
    if (typeof window.refreshFeed === 'function') {
      window.refreshFeed();
    } else {
      window.location.reload();
    }
  },
};

window.PrefsModal = PrefsModal;
