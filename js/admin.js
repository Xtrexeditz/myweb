/**
 * XTrex Admin Analytics & Telemetry Dashboard Controller
 */

(function () {
  'use strict';

  // API Base resolution
  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const API_BASE = isLocalDev && window.location.port !== '5000' && window.location.protocol.startsWith('http')
    ? 'http://localhost:5000/api'
    : '/api';

  // State
  let adminKey = sessionStorage.getItem('xtrex_admin_key') || '';
  let currentPage = 1;
  let totalPages = 1;
  let autoRefreshTimer = null;
  let currentVisitorsData = [];
  let availableCountries = new Set();

  // DOM Elements
  const authModal = document.getElementById('auth-modal');
  const authForm = document.getElementById('auth-form');
  const adminKeyInput = document.getElementById('admin-key-input');
  const authError = document.getElementById('auth-error');
  const adminApp = document.getElementById('admin-app');

  const statTotalVisits = document.getElementById('stat-total-visits');
  const statUniqueVisitors = document.getElementById('stat-unique-visitors');
  const statTodayVisits = document.getElementById('stat-today-visits');
  const statAvgDuration = document.getElementById('stat-avg-duration');

  const visitorsTbody = document.getElementById('visitors-tbody');
  const messagesTbody = document.getElementById('messages-tbody');
  const tabVisitorCount = document.getElementById('tab-visitor-count');
  const tabMsgCount = document.getElementById('tab-msg-count');
  const tableShowingLabel = document.getElementById('table-showing-label');
  const msgShowingLabel = document.getElementById('msg-showing-label');

  const filterSearch = document.getElementById('filter-search');
  const filterDevice = document.getElementById('filter-device');
  const filterCountry = document.getElementById('filter-country');
  const filterPlatform = document.getElementById('filter-platform');
  const genPlatform = document.getElementById('gen-platform');
  const genUsername = document.getElementById('gen-username');
  const genCopyBtn = document.getElementById('gen-copy-btn');
  const genLinkPreview = document.getElementById('gen-link-preview');

  const autoRefreshChk = document.getElementById('auto-refresh-chk');
  const refreshBtn = document.getElementById('refresh-btn');
  const exportCsvBtn = document.getElementById('export-csv-btn');
  const logoutBtn = document.getElementById('logout-btn');

  const prevPageBtn = document.getElementById('prev-page-btn');
  const nextPageBtn = document.getElementById('next-page-btn');
  const pageInfoText = document.getElementById('page-info-text');

  // Country Code to Emoji Flag
  function getFlagEmoji(countryCode) {
    if (!countryCode || countryCode === 'XX' || countryCode.length !== 2) return '🌐';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }

  // Format Duration
  function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return '< 5s';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }

  // Format IST Date & Time
  function formatIST(dateString) {
    if (!dateString) return 'Just now';
    const d = new Date(dateString);
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  // Helper for Authenticated Fetch
  async function apiFetch(endpoint, options = {}) {
    options.headers = options.headers || {};
    options.headers['x-admin-key'] = adminKey;
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    if (res.status === 401) {
      handleUnauthorized();
      throw new Error('Unauthorized');
    }
    return res.json();
  }

  function handleUnauthorized() {
    sessionStorage.removeItem('xtrex_admin_key');
    adminKey = '';
    adminApp.classList.add('hidden');
    authModal.classList.remove('hidden');
    authError.textContent = 'Invalid or expired PIN. Please enter admin PIN again.';
  }

  // Check Authentication
  async function checkAuth(keyToTest) {
    try {
      const res = await fetch(`${API_BASE}/admin/verify`, {
        headers: { 'x-admin-key': keyToTest }
      });
      if (res.ok) {
        adminKey = keyToTest;
        sessionStorage.setItem('xtrex_admin_key', adminKey);
        authModal.classList.add('hidden');
        adminApp.classList.remove('hidden');
        initDashboard();
        return true;
      } else {
        authError.textContent = 'Incorrect Password. Access Denied.';
        return false;
      }
    } catch (e) {
      authError.textContent = 'Backend server not reachable on http://localhost:5000';
      return false;
    }
  }

  // Init Dashboard Data
  async function initDashboard() {
    await Promise.all([loadStats(), loadVisitors(1), loadMessages()]);
    setupAutoRefresh();
  }

  // Load High-Level Stats
  async function loadStats() {
    try {
      const data = await apiFetch('/admin/stats');
      if (data.success && data.stats) {
        const s = data.stats;
        statTotalVisits.textContent = s.totalVisits.toLocaleString();
        statUniqueVisitors.textContent = s.uniqueVisitors.toLocaleString();
        statTodayVisits.textContent = s.todayVisits.toLocaleString();
        statAvgDuration.textContent = formatDuration(s.avgDuration);

        tabVisitorCount.textContent = s.totalVisits;
        tabMsgCount.textContent = s.totalMessages;

        renderInsights(s);
      }
    } catch (e) {
      console.warn('Stats fetch error:', e);
    }
  }

  // Render Insights Tab
  function renderInsights(stats) {
    // Top Countries
    const topCountriesEl = document.getElementById('top-countries-list');
    if (topCountriesEl) {
      if (!stats.topCountries || stats.topCountries.length === 0) {
        topCountriesEl.innerHTML = '<p class="muted-text">No visitor country records yet.</p>';
      } else {
        const maxVal = stats.topCountries[0].count || 1;
        topCountriesEl.innerHTML = stats.topCountries.map(c => `
          <div>
            <div class="breakdown-row">
              <span>${getFlagEmoji(c._id.code)} <strong>${c._id.country}</strong></span>
              <span><strong>${c.count}</strong> visits</span>
            </div>
            <div class="breakdown-bar-wrap">
              <div class="breakdown-bar-fill" style="width: ${(c.count / maxVal) * 100}%"></div>
            </div>
          </div>
        `).join('');
      }
    }

    // Devices
    const devicesEl = document.getElementById('device-breakdown-list');
    if (devicesEl) {
      if (!stats.devices || stats.devices.length === 0) {
        devicesEl.innerHTML = '<p class="muted-text">No device metrics yet.</p>';
      } else {
        const maxD = Math.max(...stats.devices.map(d => d.count), 1);
        devicesEl.innerHTML = stats.devices.map(d => `
          <div>
            <div class="breakdown-row">
              <span>📱 <strong>${d._id || 'Desktop'}</strong></span>
              <span><strong>${d.count}</strong></span>
            </div>
            <div class="breakdown-bar-wrap">
              <div class="breakdown-bar-fill" style="width: ${(d.count / maxD) * 100}%; background: #10B981;"></div>
            </div>
          </div>
        `).join('');
      }
    }

    // Browsers
    const browsersEl = document.getElementById('browser-breakdown-list');
    if (browsersEl) {
      if (!stats.browsers || stats.browsers.length === 0) {
        browsersEl.innerHTML = '<p class="muted-text">No browser metrics yet.</p>';
      } else {
        const maxB = Math.max(...stats.browsers.map(b => b.count), 1);
        browsersEl.innerHTML = stats.browsers.map(b => `
          <div>
            <div class="breakdown-row">
              <span>🌐 <strong>${b._id || 'Chrome'}</strong></span>
              <span><strong>${b.count}</strong></span>
            </div>
            <div class="breakdown-bar-wrap">
              <div class="breakdown-bar-fill" style="width: ${(b.count / maxB) * 100}%; background: #A855F7;"></div>
            </div>
          </div>
        `).join('');
      }
    }

    // Referrers
    const referrersEl = document.getElementById('referrer-breakdown-list');
    if (referrersEl) {
      if (!stats.referrers || stats.referrers.length === 0) {
        referrersEl.innerHTML = '<p class="muted-text">No referrer data yet.</p>';
      } else {
        const maxR = Math.max(...stats.referrers.map(r => r.count), 1);
        referrersEl.innerHTML = stats.referrers.map(r => `
          <div>
            <div class="breakdown-row">
              <span>🔗 <strong>${r._id || 'Direct'}</strong></span>
              <span><strong>${r.count}</strong></span>
            </div>
            <div class="breakdown-bar-wrap">
              <div class="breakdown-bar-fill" style="width: ${(r.count / maxR) * 100}%; background: #FF1744;"></div>
            </div>
          </div>
        `).join('');
      }
    }
  }

  // Load Visitors Table
  async function loadVisitors(page = 1) {
    try {
      currentPage = page;
      const search = encodeURIComponent(filterSearch.value.trim());
      const device = encodeURIComponent(filterDevice.value);
      const country = encodeURIComponent(filterCountry.value);
      const platform = filterPlatform ? encodeURIComponent(filterPlatform.value) : '';

      const endpoint = `/admin/visitors?page=${page}&limit=25&search=${search}&device=${device}&country=${country}&platform=${platform}`;
      const data = await apiFetch(endpoint);

      if (data.success) {
        currentVisitorsData = data.data || [];
        totalPages = data.pagination.pages || 1;
        renderVisitorsTable(currentVisitorsData);
        updatePagination(data.pagination);

        // Populate country filter dropdown
        currentVisitorsData.forEach(v => {
          if (v.country && v.country !== 'Unknown') availableCountries.add(v.country);
        });
        updateCountryDropdown();
      }
    } catch (e) {
      console.warn('Visitors load error:', e);
    }
  }

  function updateCountryDropdown() {
    const selected = filterCountry.value;
    const countries = Array.from(availableCountries).sort();
    let html = '<option value="">All Countries</option>';
    countries.forEach(c => {
      html += `<option value="${c}" ${c === selected ? 'selected' : ''}>${c}</option>`;
    });
    filterCountry.innerHTML = html;
  }

  function renderVisitorsTable(visitors) {
    if (!visitors || visitors.length === 0) {
      visitorsTbody.innerHTML = `
        <tr>
          <td colspan="10" class="loading-td">No visitor logs found matching your filters.</td>
        </tr>
      `;
      tableShowingLabel.textContent = '0 records';
      return;
    }

    tableShowingLabel.textContent = `Showing ${visitors.length} records`;

    visitorsTbody.innerHTML = visitors.map(v => {
      const flag = getFlagEmoji(v.countryCode);
      const devType = (v.device && v.device.type) ? v.device.type.toLowerCase() : 'desktop';
      const devBadgeClass = devType.includes('mobile') ? 'mobile' : (devType.includes('tablet') ? 'tablet' : 'desktop');
      const devIcon = devType.includes('mobile') ? '📱' : (devType.includes('tablet') ? '📲' : '💻');

      // Social Info & Username detection
      const soc = v.social || {};
      const platformName = soc.platform || (v.instagramHandle ? 'Instagram' : (v.referrer && v.referrer.includes('instagram.com') ? 'Instagram' : 'Direct'));
      const username = soc.username || (platformName === 'Instagram' ? v.instagramHandle : null);
      const profileUrl = soc.profileUrl;

      let socialHtml = '';
      const pLow = platformName.toLowerCase();

      if (pLow.includes('instagram')) {
        socialHtml = `
          <div class="social-col-cell">
            <span class="social-badge instagram">📸 Instagram</span>
            ${username ? `<div class="social-user-wrap"><a href="${profileUrl || `https://instagram.com/${username.replace(/^@/, '')}`}" target="_blank" class="social-user-link">@${username.replace(/^@/, '')} ↗</a></div>` : '<div class="social-sub-tag">In-App / Bio</div>'}
          </div>
        `;
      } else if (pLow.includes('linkedin')) {
        socialHtml = `
          <div class="social-col-cell">
            <span class="social-badge linkedin">💼 LinkedIn</span>
            ${username ? `<div class="social-user-wrap"><a href="${profileUrl || `https://linkedin.com/in/${username.replace(/^@/, '')}`}" target="_blank" class="social-user-link">${username} ↗</a></div>` : '<div class="social-sub-tag">Post / Profile</div>'}
          </div>
        `;
      } else if (pLow.includes('whatsapp')) {
        socialHtml = `
          <div class="social-col-cell">
            <span class="social-badge whatsapp">💬 WhatsApp</span>
            ${username ? `<div class="social-user-wrap"><span class="social-user-tag">${username}</span></div>` : '<div class="social-sub-tag">Chat / Status</div>'}
          </div>
        `;
      } else if (pLow.includes('twitter') || pLow === 'x') {
        socialHtml = `
          <div class="social-col-cell">
            <span class="social-badge twitter">🐦 Twitter / X</span>
            ${username ? `<div class="social-user-wrap"><a href="${profileUrl || `https://x.com/${username.replace(/^@/, '')}`}" target="_blank" class="social-user-link">@${username.replace(/^@/, '')} ↗</a></div>` : '<div class="social-sub-tag">Post Link</div>'}
          </div>
        `;
      } else {
        socialHtml = `
          <div class="social-col-cell">
            <span class="social-badge direct">🌐 ${platformName}</span>
            ${username ? `<div class="social-user-wrap"><span class="social-user-tag">${username}</span></div>` : '<div class="social-sub-tag">Direct / Web</div>'}
          </div>
        `;
      }

      return `
        <tr>
          <td>
            <span class="live-status-badge" style="padding: 2px 6px; font-size: 0.7rem;">
              <span class="pulse-dot"></span> Logged
            </span>
          </td>
          <td>
            <div class="id-cell">
              <span class="id-badge vid-badge" title="Visitor Client ID">${v.visitorId || 'Unknown'}</span>
              <div class="db-id-sub" title="MongoDB Database Object ID">DB: <span class="mono-id">${v._id}</span></div>
            </div>
          </td>
          <td>
            ${socialHtml}
          </td>
          <td>
            <div class="location-cell">
              <div class="location-primary">${flag} ${v.city || 'Unknown'}, ${v.country || ''}</div>
              <div class="location-sub">${v.region ? v.region + ' • ' : ''}${v.isp || v.org || ''}</div>
            </div>
          </td>
          <td>
            <span class="ip-badge">${v.ip || 'Unknown'}</span>
          </td>
          <td>
            <span class="device-badge ${devBadgeClass}">
              ${devIcon} ${v.os ? (v.os.name + (v.os.version ? ' ' + v.os.version : '')) : 'Unknown OS'}
            </span>
          </td>
          <td>
            <strong>${v.browser ? v.browser.name : 'Unknown'}</strong>
            <small style="color: #64748B;">${v.browser && v.browser.version ? 'v' + v.browser.version.split('.')[0] : ''}</small>
          </td>
          <td>
            <div style="font-size: 0.85rem; font-weight: 600;">${formatIST(v.timestamp)}</div>
            <div style="font-size: 0.75rem; color: #64748B;">Visits: #${v.visitCount || 1}</div>
          </td>
          <td>
            <span class="duration-tag">${formatDuration(v.duration)}</span>
          </td>
          <td>
            <button class="btn-del-row" onclick="window.deleteVisitorRecord('${v._id}')" title="Delete record">🗑️</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Load Contact Messages
  async function loadMessages() {
    try {
      const data = await apiFetch('/admin/messages');
      if (data.success) {
        const msgs = data.data || [];
        tabMsgCount.textContent = msgs.length;
        msgShowingLabel.textContent = `${msgs.length} Total Messages`;
        renderMessagesTable(msgs);
      }
    } catch (e) {
      console.warn('Messages load error:', e);
    }
  }

  function renderMessagesTable(msgs) {
    if (!msgs || msgs.length === 0) {
      messagesTbody.innerHTML = `
        <tr>
          <td colspan="7" class="loading-td">No contact form messages yet.</td>
        </tr>
      `;
      return;
    }

    messagesTbody.innerHTML = msgs.map(m => `
      <tr>
        <td><span class="id-badge vid-badge" title="MongoDB Contact ID">${m._id}</span></td>
        <td><strong>${m.name}</strong></td>
        <td><a href="mailto:${m.email}" style="color: var(--m-laser-blue);">${m.email}</a></td>
        <td style="max-width: 320px; word-break: break-word;">${m.message}</td>
        <td>
          <div class="location-primary">${m.city || ''}, ${m.country || ''}</div>
          <span class="ip-badge">${m.ip || ''}</span>
        </td>
        <td>${formatIST(m.timestamp)}</td>
        <td>
          <button class="btn-del-row" onclick="window.deleteContactRecord('${m._id}')">🗑️</button>
        </td>
      </tr>
    `).join('');
  }

  // Delete Handlers
  window.deleteVisitorRecord = async function (id) {
    if (!confirm('Are you sure you want to delete this visitor log?')) return;
    try {
      await apiFetch(`/admin/visitors/${id}`, { method: 'DELETE' });
      await loadVisitors(currentPage);
      await loadStats();
    } catch (e) {}
  };

  window.deleteContactRecord = async function (id) {
    if (!confirm('Are you sure you want to delete this contact message?')) return;
    try {
      await apiFetch(`/admin/messages/${id}`, { method: 'DELETE' });
      await loadMessages();
      await loadStats();
    } catch (e) {}
  };

  // Pagination
  function updatePagination(pagination) {
    pageInfoText.textContent = `Page ${pagination.page} of ${pagination.pages || 1}`;
    prevPageBtn.disabled = pagination.page <= 1;
    nextPageBtn.disabled = pagination.page >= pagination.pages;
  }

  prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) loadVisitors(currentPage - 1);
  });

  nextPageBtn.addEventListener('click', () => {
    if (currentPage < totalPages) loadVisitors(currentPage + 1);
  });

  // Export CSV
  exportCsvBtn.addEventListener('click', () => {
    if (!currentVisitorsData || currentVisitorsData.length === 0) {
      alert('No visitor data available to export.');
      return;
    }

    const headers = [
      'Timestamp (IST)',
      'Visitor ID',
      'Database ID',
      'Social Platform',
      'Username',
      'Profile URL',
      'Source Type',
      'IP Address',
      'City',
      'Region',
      'Country',
      'Device',
      'OS',
      'Browser',
      'Duration (Sec)',
      'Visit Count'
    ];

    const rows = currentVisitorsData.map(v => {
      const soc = v.social || {};
      const platform = soc.platform || (v.instagramHandle ? 'Instagram' : 'Direct');
      const user = soc.username || (platform === 'Instagram' ? v.instagramHandle : '');
      return [
        `"${formatIST(v.timestamp)}"`,
        `"${v.visitorId || ''}"`,
        `"${v._id || ''}"`,
        `"${platform}"`,
        `"${user}"`,
        `"${soc.profileUrl || ''}"`,
        `"${soc.sourceType || ''}"`,
        `"${v.ip || ''}"`,
        `"${v.city || ''}"`,
        `"${v.region || ''}"`,
        `"${v.country || ''}"`,
        `"${v.device ? v.device.type : ''}"`,
        `"${v.os ? v.os.name : ''}"`,
        `"${v.browser ? v.browser.name : ''}"`,
        v.duration || 0,
        v.visitCount || 1
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `xtrex_visitors_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // Social Link Generator Handler
  if (genCopyBtn) {
    genCopyBtn.addEventListener('click', () => {
      const p = genPlatform ? genPlatform.value : 'Instagram';
      const u = genUsername ? genUsername.value.trim().replace(/^@/, '') : '';
      if (!u) {
        if (genLinkPreview) {
          genLinkPreview.innerHTML = '<span style="color: #F87171;">⚠️ Please enter a username/name to generate a tracking link.</span>';
        }
        return;
      }

      const origin = window.location.origin;
      let trackUrl = `${origin}/?u=${encodeURIComponent(u)}&platform=${encodeURIComponent(p.toLowerCase())}`;
      if (p === 'Instagram') trackUrl = `${origin}/?ig=${encodeURIComponent(u)}`;
      else if (p === 'LinkedIn') trackUrl = `${origin}/?li=${encodeURIComponent(u)}`;
      else if (p === 'WhatsApp') trackUrl = `${origin}/?wa=${encodeURIComponent(u)}`;
      else if (p === 'Twitter') trackUrl = `${origin}/?tw=${encodeURIComponent(u)}`;

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(trackUrl);
        }
      } catch (err) {}

      if (genLinkPreview) {
        genLinkPreview.innerHTML = `✅ <strong>Copied to clipboard!</strong> Share on ${p}: <span style="text-decoration: underline; color: #38BDF8;">${trackUrl}</span>`;
      }
    });
  }

  // Tab switching
  document.querySelectorAll('.dash-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.dash-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const pane = document.getElementById(targetId);
      if (pane) pane.classList.add('active');
    });
  });

  // Filters & Search
  let searchDebounce = null;
  filterSearch.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => loadVisitors(1), 300);
  });

  if (filterPlatform) filterPlatform.addEventListener('change', () => loadVisitors(1));
  filterDevice.addEventListener('change', () => loadVisitors(1));
  filterCountry.addEventListener('change', () => loadVisitors(1));

  refreshBtn.addEventListener('click', () => {
    loadStats();
    loadVisitors(currentPage);
    loadMessages();
  });

  // Auto Refresh
  function setupAutoRefresh() {
    if (autoRefreshTimer) clearInterval(autoRefreshTimer);
    if (autoRefreshChk.checked) {
      autoRefreshTimer = setInterval(() => {
        if (!document.hidden && adminKey) {
          loadStats();
          loadVisitors(currentPage);
          loadMessages();
        }
      }, 15000); // Every 15s
    }
  }

  autoRefreshChk.addEventListener('change', setupAutoRefresh);

  // Logout / Lock
  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('xtrex_admin_key');
    adminKey = '';
    adminApp.classList.add('hidden');
    authModal.classList.remove('hidden');
    adminKeyInput.value = '';
    if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  });

  // Auth Form Submit
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const enteredPin = adminKeyInput.value.trim();
    if (!enteredPin) return;
    await checkAuth(enteredPin);
  });

  // Initial Auth Check on Page Load
  if (adminKey) {
    checkAuth(adminKey);
  } else {
    authModal.classList.remove('hidden');
  }

})();
