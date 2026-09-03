/**
 * XTrex Visitor Intelligence & Analytics Tracker
 * Automatically collects visitor metrics (Screen, Referrer, Instagram tags, Session duration)
 * and transmits them to the MongoDB backend.
 */

(function () {
  'use strict';

  // Config: Determine API Base URL dynamically
  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const API_BASE = isLocalDev && window.location.port !== '5000' && window.location.protocol.startsWith('http')
    ? 'http://localhost:5000/api'
    : '/api';

  // 1. Generate or Retrieve Unique Visitor ID
  function getOrCreateVisitorId() {
    const STORAGE_KEY = 'xtrex_visitor_uuid';
    let vid = localStorage.getItem(STORAGE_KEY);
    if (!vid) {
      vid = 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
      try {
        localStorage.setItem(STORAGE_KEY, vid);
      } catch (e) {
        // Fallback for private browsing
      }
    }
    return vid;
  }

  // 2. Parse URL parameters & Social Media Identity
  function getSocialMediaIdentity() {
    const params = new URLSearchParams(window.location.search);
    const ua = (navigator.userAgent || '').toLowerCase();
    const ref = (document.referrer || '').toLowerCase();

    // Check query params for username or social handles
    let explicitUser = params.get('u') || params.get('user') || params.get('username') || params.get('name') || params.get('handle') || null;
    const igParam = params.get('ig') || params.get('instagram') || null;
    const liParam = params.get('li') || params.get('linkedin') || null;
    const waParam = params.get('wa') || params.get('whatsapp') || params.get('phone') || null;
    const twParam = params.get('tw') || params.get('twitter') || params.get('x') || null;
    const platformParam = params.get('platform') || params.get('from') || params.get('source') || null;
    const refParam = params.get('ref') || null;

    let platform = 'Direct';
    let username = explicitUser;
    let sourceType = 'Web';
    let profileUrl = null;

    // Detect Platform & Assign Specific Handles
    if (igParam) {
      platform = 'Instagram';
      username = igParam;
      sourceType = 'Instagram Link';
      profileUrl = `https://instagram.com/${igParam.replace(/^@/, '')}`;
    } else if (liParam) {
      platform = 'LinkedIn';
      username = liParam;
      sourceType = 'LinkedIn Post/Profile';
      profileUrl = `https://linkedin.com/in/${liParam.replace(/^@/, '')}`;
    } else if (waParam) {
      platform = 'WhatsApp';
      username = waParam;
      sourceType = 'WhatsApp Chat/Status';
      if (/^\+?[0-9]{7,15}$/.test(waParam)) profileUrl = `https://wa.me/${waParam.replace(/^\+/, '')}`;
    } else if (twParam) {
      platform = 'Twitter / X';
      username = twParam;
      sourceType = 'Twitter/X Post';
      profileUrl = `https://x.com/${twParam.replace(/^@/, '')}`;
    } else if (platformParam) {
      const pLow = platformParam.toLowerCase();
      if (pLow.includes('insta')) platform = 'Instagram';
      else if (pLow.includes('link')) platform = 'LinkedIn';
      else if (pLow.includes('what') || pLow.includes('wa')) platform = 'WhatsApp';
      else if (pLow.includes('twit') || pLow === 'x') platform = 'Twitter / X';
      else if (pLow.includes('you')) platform = 'YouTube';
      else if (pLow.includes('git')) platform = 'GitHub';
      else platform = platformParam;
      sourceType = 'Campaign / Custom Tag';
    } else if (refParam) {
      const rLow = refParam.toLowerCase();
      if (rLow.includes('insta')) platform = 'Instagram';
      else if (rLow.includes('link')) platform = 'LinkedIn';
      else if (rLow.includes('what') || rLow.includes('wa')) platform = 'WhatsApp';
    }

    // Detect via In-App Browser User-Agents & Referrers if not explicit
    if (platform === 'Direct') {
      if (ua.includes('instagram') || ref.includes('instagram.com')) {
        platform = 'Instagram';
        sourceType = ua.includes('instagram') ? 'Instagram In-App Browser' : 'Instagram Web';
      } else if (ua.includes('linkedin') || ref.includes('linkedin.com') || ref.includes('lnkd.in')) {
        platform = 'LinkedIn';
        sourceType = ua.includes('linkedin') ? 'LinkedIn In-App' : 'LinkedIn Web';
      } else if (ua.includes('whatsapp') || ref.includes('whatsapp.com')) {
        platform = 'WhatsApp';
        sourceType = 'WhatsApp Chat Link';
      } else if (ua.includes('twitter') || ref.includes('t.co') || ref.includes('twitter.com') || ref.includes('x.com')) {
        platform = 'Twitter / X';
        sourceType = 'Twitter / X Link';
      } else if (ref.includes('youtube.com')) {
        platform = 'YouTube';
        sourceType = 'YouTube Description/Link';
      } else if (ref.includes('github.com')) {
        platform = 'GitHub';
        sourceType = 'GitHub Profile';
      } else if (ua.includes('fban') || ua.includes('fbav') || ref.includes('facebook.com')) {
        platform = 'Facebook';
        sourceType = 'Facebook App/Web';
      }
    }

    // Persist identified username in localStorage so returning visits keep identity
    const STORAGE_SOCIAL_KEY = 'xtrex_social_id';
    if (username) {
      try {
        localStorage.setItem(STORAGE_SOCIAL_KEY, JSON.stringify({ platform, username, profileUrl }));
      } catch(e) {}
    } else {
      // Check if previous visit identified this visitor
      try {
        const savedSocial = localStorage.getItem(STORAGE_SOCIAL_KEY);
        if (savedSocial) {
          const parsed = JSON.parse(savedSocial);
          if (parsed && parsed.username) {
            username = parsed.username;
            if (platform === 'Direct') platform = parsed.platform || 'Direct';
            profileUrl = parsed.profileUrl || profileUrl;
          }
        }
      } catch(e) {}
    }

    return {
      platform,
      username,
      profileUrl,
      sourceType,
      utmSource: params.get('utm_source') || (platform !== 'Direct' ? platform : null)
    };
  }

  // 3. Collect Client Metrics
  function gatherClientData() {
    const social = getSocialMediaIdentity();
    const referrer = document.referrer || 'Direct';

    return {
      visitorId: getOrCreateVisitorId(),
      screen: {
        width: window.screen ? window.screen.width : 0,
        height: window.screen ? window.screen.height : 0,
        pixelRatio: window.devicePixelRatio || 1
      },
      language: navigator.language || navigator.userLanguage || 'en',
      referrer: referrer,
      landingPage: window.location.pathname + window.location.search,
      social: {
        platform: social.platform,
        username: social.username,
        profileUrl: social.profileUrl,
        sourceType: social.sourceType
      },
      instagramHandle: social.platform === 'Instagram' ? (social.username || 'Instagram Visitor') : null,
      utmSource: social.utmSource,
      isBot: navigator.webdriver || false
    };
  }

  // State
  let currentVisitId = null;
  let activeSeconds = 0;
  let lastActiveTimestamp = Date.now();
  let durationInterval = null;

  // 4. Send Initial Visit Payload
  async function recordVisit() {
    try {
      const payload = gatherClientData();
      const response = await fetch(`${API_BASE}/track/visit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.visitId) {
          currentVisitId = data.visitId;
          startDurationTracking();
        }
      }
    } catch (err) {
      // Backend may be starting or offline
      console.debug('[XTrex Tracker]: Telemetry handshake queued.', err.message);
    }
  }

  // 5. Active Duration Tracking
  function startDurationTracking() {
    if (durationInterval) clearInterval(durationInterval);

    // Track active seconds only when window/tab is visible
    durationInterval = setInterval(() => {
      if (!document.hidden) {
        activeSeconds += 1;
        
        // Send heartbeat update every 30 seconds
        if (activeSeconds > 0 && activeSeconds % 30 === 0) {
          syncDuration();
        }
      }
    }, 1000);

    // Send final duration beacon on page exit
    window.addEventListener('pagehide', syncDurationBeacon);
    window.addEventListener('beforeunload', syncDurationBeacon);
  }

  function syncDuration() {
    if (!currentVisitId || activeSeconds < 2) return;
    try {
      fetch(`${API_BASE}/track/duration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitId: currentVisitId, duration: activeSeconds }),
        keepalive: true
      }).catch(() => {});
    } catch (e) {}
  }

  function syncDurationBeacon() {
    if (!currentVisitId || activeSeconds < 2) return;
    try {
      const payload = JSON.stringify({ visitId: currentVisitId, duration: activeSeconds });
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(`${API_BASE}/track/duration`, blob);
      } else {
        syncDuration();
      }
    } catch (e) {}
  }

  // Initialize on page load
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    recordVisit();
  } else {
    document.addEventListener('DOMContentLoaded', recordVisit);
  }

  // Expose global tracker helper for contact forms
  window.XTrexTracker = {
    getVisitorId: getOrCreateVisitorId,
    getApiBase: () => API_BASE,
    submitContact: async (name, email, message) => {
      try {
        const res = await fetch(`${API_BASE}/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message })
        });
        return await res.json();
      } catch (err) {
        return { success: false, message: err.message };
      }
    }
  };
})();
