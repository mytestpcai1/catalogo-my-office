const state = {
  items: [],
  metadata: {},
  activeSection: 'main', // 'main' | 'entertainment'
  searchQuery: '',
  selectedCategory: 'all',
  selectedDevice: 'all', // 'all' | 'Smartphone' | 'PC'
  selectedAccessMode: 'all' // 'all' | 'online' | 'local' | 'hybrid'
};

async function loadCatalog() {
  try {
    let data = null;
    if (window.location.protocol !== 'file:') {
      try {
        const res = await fetch('./data/catalog.json', { cache: 'no-store' });
        if (res.ok) data = await res.json();
      } catch (_) {}
    }
    if (!data && window.CATALOG_FALLBACK) {
      data = window.CATALOG_FALLBACK;
    }
    if (!data) throw new Error('Catalogo non trovato');
    state.items = data.items || [];
    state.metadata = data.metadata || {};
    renderMetadata();
    populateCategories();
    renderCards();
  } catch (err) {
    console.error('Errore caricamento catalog.json:', err);
    document.getElementById('cardsContainer').innerHTML = `
      <div class="empty-state">
        <p>Impossibile caricare <code>data/catalog.json</code> (${err.message}).</p>
      </div>
    `;
  }
}

function renderMetadata() {
  const m = state.metadata;
  const scanEl = document.getElementById('metaLastScan');
  const auditEl = document.getElementById('metaLastAudit');
  const mainCountEl = document.getElementById('countMain');
  const entCountEl = document.getElementById('countEntertainment');

  if (scanEl && m.lastBiweeklyScan) scanEl.textContent = m.lastBiweeklyScan;
  if (auditEl && m.lastMonthlyAudit) auditEl.textContent = m.lastMonthlyAudit;

  const mainItems = state.items.filter(i => i.section === 'main');
  const entItems = state.items.filter(i => i.section === 'entertainment');

  if (mainCountEl) mainCountEl.textContent = mainItems.length;
  if (entCountEl) entCountEl.textContent = entItems.length;
}

function populateCategories() {
  const select = document.getElementById('categoryFilter');
  const sectionItems = state.items.filter(i => i.section === state.activeSection);
  const categories = [...new Set(sectionItems.map(i => i.category))];

  select.innerHTML = `<option value="all">Tutte le categorie (${sectionItems.length})</option>`;
  categories.forEach(cat => {
    const count = sectionItems.filter(i => i.category === cat).length;
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = `${cat} (${count})`;
    select.appendChild(opt);
  });
  state.selectedCategory = 'all';
}

function matchesAccessFilter(item, modeFilter) {
  if (modeFilter === 'all') return true;
  const mode = (item.accessMode || '').toLowerCase();
  if (modeFilter === 'online') return mode.includes('solo online');
  if (modeFilter === 'local') return mode.includes('locale');
  if (modeFilter === 'hybrid') return mode.includes('ibrido');
  return true;
}

function getFilteredItems() {
  const q = state.searchQuery.trim().toLowerCase();

  return state.items.filter(item => {
    if (item.section !== state.activeSection) return false;
    if (state.selectedCategory !== 'all' && item.category !== state.selectedCategory) return false;

    if (state.selectedDevice === 'Smartphone' && !item.mobileCompatible) return false;
    if (state.selectedDevice === 'PC' && !item.pcCompatible) return false;

    if (!matchesAccessFilter(item, state.selectedAccessMode)) return false;

    if (q) {
      const subText = (item.subItems || []).map(s => `${s.name} ${s.platform}`).join(' ');
      const tagsText = (item.tags || []).join(' ');
      const haystack = `${item.title} ${item.summary} ${item.verificationNote} ${item.category} ${item.author} ${item.msgId} ${tagsText} ${subText}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderCards() {
  const container = document.getElementById('cardsContainer');
  const countLabel = document.getElementById('resultsCount');
  const filtered = getFilteredItems();

  countLabel.textContent = `Visualizzati ${filtered.length} contenuti verificati`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>Nessun contenuto trovato con questi filtri</h3>
        <p style="margin-top: 0.4rem;">Prova a reimpostare la ricerca o cambiare il filtro dispositivo/modalità.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const isFullVerified = item.verdict === 'Verificato';
    const verdictClass = isFullVerified ? 'verdict-ok' : 'verdict-note';
    const verdictIcon = isFullVerified ? '📘' : '⚠️';

    const isOnlineOnly = (item.accessMode || '').toLowerCase().includes('solo online');
    const modeBadgeClass = isOnlineOnly ? 'mode-online' : 'mode-local';
    const modeIcon = isOnlineOnly ? '🌐' : '⚙️';

    const deviceBadges = [];
    if (item.pcCompatible) deviceBadges.push('<span class="pill-device">💻 PC</span>');
    if (item.mobileCompatible) deviceBadges.push('<span class="pill-device">📱 Smartphone</span>');

    const subItemsHtml = (item.subItems && item.subItems.length > 0)
      ? `
        <details class="subitems-details">
          <summary>Mostra tutti i ${item.subItems.length} link / elementi inclusi</summary>
          <ul class="subitems-list">
            ${item.subItems.map(sub => `
              <li>
                ${sub.url && sub.url !== '#copy'
                  ? `<a href="${escapeHtml(sub.url)}" target="_blank" rel="noopener noreferrer">🔗 ${escapeHtml(sub.name)}</a>`
                  : `<span>📌 ${escapeHtml(sub.name)}</span>`
                }
                <span class="sub-platform-tag">${escapeHtml(sub.platform || '')}</span>
              </li>
            `).join('')}
          </ul>
        </details>
      `
      : '';

    const snippetHtml = item.copySnippet
      ? `
        <div class="snippet-box">
          <code class="snippet-code" title="${escapeHtml(item.copySnippet)}">${escapeHtml(item.copySnippet)}</code>
          <button class="copy-btn" data-copy="${escapeHtml(item.copySnippet)}">Copia</button>
        </div>
      `
      : '';

    const tagsHtml = (item.tags || []).map(t => `<span class="tag-chip">#${escapeHtml(t)}</span>`).join('');

    return `
      <article class="card">
        <div class="card-header">
          <div class="card-badges-top">
            <span class="msg-badge">Msg ${escapeHtml(item.msgId)} • ${escapeHtml(item.author)}</span>
            <span class="verdict-badge ${verdictClass}">${verdictIcon} ${escapeHtml(item.verdict)} (${escapeHtml(item.nexusGrade)})</span>
          </div>
          <span class="category-tag">${escapeHtml(item.category)}</span>
          <h2 class="card-title">${escapeHtml(item.title)}</h2>
        </div>

        <div class="tech-matrix">
          <div class="matrix-row">
            <span class="matrix-label">Modalità:</span>
            <span class="pill-mode ${modeBadgeClass}">${modeIcon} ${escapeHtml(item.accessMode)}</span>
          </div>
          <div class="matrix-row">
            <span class="matrix-label">Dispositivi:</span>
            ${deviceBadges.join(' ')}
          </div>
          <div class="os-note">ℹ️ ${escapeHtml(item.osDetails)}</div>
        </div>

        <p class="card-summary">${escapeHtml(item.summary)}</p>

        <div class="verification-box ${isFullVerified ? '' : 'warn'}">
          <strong>Verifica Nexus (${escapeHtml(item.lastVerified)}):</strong> ${escapeHtml(item.verificationNote)}
        </div>

        ${subItemsHtml}
        ${snippetHtml}

        <div class="card-footer">
          <div class="tags-row">${tagsHtml}</div>
          <div class="actions-row">
            <a class="btn-primary" href="${escapeHtml(item.directUrl)}" target="_blank" rel="noopener noreferrer">
              🚀 ${escapeHtml(item.directLabel || 'Apri Risorsa')}
            </a>
            <a class="btn-secondary" href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener noreferrer" title="Apri il post originale salvato su WhatsApp">
              Post Originale ↗
            </a>
          </div>
        </div>
      </article>
    `;
  }).join('');

  container.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-copy');
      try {
        await navigator.clipboard.writeText(text);
        const orig = btn.textContent;
        btn.textContent = 'Copiato! ✓';
        setTimeout(() => { btn.textContent = orig; }, 1800);
      } catch (_) {
        btn.textContent = 'Errore';
      }
    });
  });
}

function setupListeners() {
  document.querySelectorAll('.section-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.section-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.activeSection = tab.getAttribute('data-section');
      populateCategories();
      renderCards();
    });
  });

  document.getElementById('searchInput').addEventListener('input', e => {
    state.searchQuery = e.target.value;
    renderCards();
  });

  document.getElementById('categoryFilter').addEventListener('change', e => {
    state.selectedCategory = e.target.value;
    renderCards();
  });

  document.getElementById('deviceFilter').addEventListener('change', e => {
    state.selectedDevice = e.target.value;
    renderCards();
  });

  document.getElementById('accessFilter').addEventListener('change', e => {
    state.selectedAccessMode = e.target.value;
    renderCards();
  });

  document.getElementById('resetFiltersBtn').addEventListener('click', () => {
    state.searchQuery = '';
    state.selectedCategory = 'all';
    state.selectedDevice = 'all';
    state.selectedAccessMode = 'all';
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = 'all';
    document.getElementById('deviceFilter').value = 'all';
    document.getElementById('accessFilter').value = 'all';
    renderCards();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupListeners();
  loadCatalog();
});
