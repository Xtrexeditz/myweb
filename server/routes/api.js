const express = require('express');
const router = express.Router();
const requestIp = require('request-ip');
const { UAParser } = require('ua-parser-js');
const Visitor = require('../models/Visitor');
const Contact = require('../models/Contact');
const { getGeoLocation } = require('../utils/geo');

// Middleware to authenticate admin requests
const authenticateAdmin = (req, res, next) => {
  const adminSecret = (process.env.ADMIN_SECRET_KEY || 'xtrex2026').trim().toLowerCase();
  const rawProvidedKey = req.headers['x-admin-key'] || req.query.adminKey || '';
  const providedKey = rawProvidedKey.toString().trim().toLowerCase();

  // Case-insensitive match to handle mobile keyboard auto-capitalization (Xtrex2026 vs xtrex2026)
  if (!providedKey || providedKey !== adminSecret) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Invalid Admin Password.'
    });
  }
  next();
};

/**
 * =========================================================================
 * 1. VISITOR TRACKING ENDPOINTS
 * =========================================================================
 */

// POST /api/track/visit - Record a new page visit
router.post('/track/visit', async (req, res) => {
  try {
    const clientIp = requestIp.getClientIp(req) || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgentString = req.headers['user-agent'] || '';

    // Parse User Agent
    const parser = new UAParser(userAgentString);
    const uaResult = parser.getResult();

    const {
      visitorId,
      screen = {},
      language = 'en',
      referrer = 'Direct',
      landingPage = '/',
      social = {},
      instagramHandle = null,
      utmSource = null,
      isBot = false
    } = req.body;

    if (!visitorId) {
      return res.status(400).json({ success: false, message: 'visitorId is required' });
    }

    // Resolve Geolocation asynchronously
    const geo = await getGeoLocation(clientIp);

    // Enhanced Social Platform & Username Detection
    let detectedPlatform = social.platform || 'Direct';
    let detectedUsername = social.username || instagramHandle || null;
    let detectedSourceType = social.sourceType || 'Web';
    let profileUrl = social.profileUrl || null;

    const refLower = (referrer || '').toLowerCase();
    const uaLower = userAgentString.toLowerCase();

    if (!social.platform || social.platform === 'Direct') {
      if (refLower.includes('instagram.com') || uaLower.includes('instagram')) {
        detectedPlatform = 'Instagram';
        detectedSourceType = uaLower.includes('instagram') ? 'In-App Browser' : 'Web Link';
      } else if (refLower.includes('linkedin.com') || refLower.includes('lnkd.in') || uaLower.includes('linkedin')) {
        detectedPlatform = 'LinkedIn';
        detectedSourceType = uaLower.includes('linkedin') ? 'In-App Browser' : 'Web Link';
      } else if (refLower.includes('whatsapp.com') || refLower.includes('whatsapp') || uaLower.includes('whatsapp')) {
        detectedPlatform = 'WhatsApp';
        detectedSourceType = 'Chat / Status Link';
      } else if (refLower.includes('t.co') || refLower.includes('twitter.com') || refLower.includes('x.com')) {
        detectedPlatform = 'Twitter / X';
        detectedSourceType = 'Post / Bio Link';
      } else if (refLower.includes('youtube.com')) {
        detectedPlatform = 'YouTube';
        detectedSourceType = 'Video / Community Link';
      } else if (refLower.includes('github.com')) {
        detectedPlatform = 'GitHub';
        detectedSourceType = 'Profile / Repo Link';
      } else if (refLower.includes('facebook.com') || uaLower.includes('fbav') || uaLower.includes('fban')) {
        detectedPlatform = 'Facebook';
        detectedSourceType = 'Post / In-App Link';
      }
    }

    // Generate Profile URL if username is present
    if (detectedUsername && !profileUrl) {
      const cleanUser = detectedUsername.replace(/^@/, '');
      if (detectedPlatform === 'Instagram') profileUrl = `https://instagram.com/${cleanUser}`;
      else if (detectedPlatform === 'LinkedIn') profileUrl = `https://linkedin.com/in/${cleanUser}`;
      else if (detectedPlatform === 'Twitter / X') profileUrl = `https://x.com/${cleanUser}`;
      else if (detectedPlatform === 'GitHub') profileUrl = `https://github.com/${cleanUser}`;
      else if (detectedPlatform === 'WhatsApp' && /^\+?[0-9]{7,15}$/.test(cleanUser)) profileUrl = `https://wa.me/${cleanUser.replace(/^\+/, '')}`;
    }

    // Count previous visits by this visitor
    let pastVisitCount = 0;
    try {
      pastVisitCount = await Visitor.countDocuments({ visitorId });
    } catch (e) {
      pastVisitCount = 0;
    }

    const newVisitor = new Visitor({
      visitorId,
      ip: geo.ip || clientIp,
      country: geo.country || 'Unknown',
      countryCode: geo.countryCode || 'XX',
      region: geo.region || '',
      city: geo.city || 'Unknown',
      zip: geo.zip || '',
      timezone: geo.timezone || '',
      isp: geo.isp || '',
      org: geo.org || '',
      lat: geo.lat || 0,
      lon: geo.lon || 0,
      browser: {
        name: uaResult.browser.name || 'Unknown',
        version: uaResult.browser.version || '',
        major: uaResult.browser.major || ''
      },
      os: {
        name: uaResult.os.name || 'Unknown',
        version: uaResult.os.version || ''
      },
      device: {
        type: uaResult.device.type || (userAgentString.includes('Mobile') ? 'Mobile' : 'Desktop'),
        vendor: uaResult.device.vendor || '',
        model: uaResult.device.model || ''
      },
      userAgent: userAgentString,
      screen: {
        width: screen.width || 0,
        height: screen.height || 0,
        pixelRatio: screen.pixelRatio || 1
      },
      language,
      referrer: referrer || 'Direct',
      landingPage: landingPage || '/',
      social: {
        platform: detectedPlatform,
        username: detectedUsername,
        profileUrl,
        sourceType: detectedSourceType
      },
      instagramHandle: detectedPlatform === 'Instagram' ? (detectedUsername || 'Instagram Visitor') : null,
      utmSource,
      visitCount: pastVisitCount + 1,
      isBot: isBot || /bot|googlebot|crawler|spider|robot|crawling/i.test(userAgentString),
      duration: 0,
      timestamp: new Date()
    });

    const savedVisitor = await newVisitor.save();

    return res.status(201).json({
      success: true,
      visitId: savedVisitor._id,
      visitorId: savedVisitor.visitorId,
      city: savedVisitor.city,
      country: savedVisitor.country
    });
  } catch (error) {
    console.error('[Track Visit Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record visit',
      error: error.message
    });
  }
});

// POST /api/track/duration - Update active duration on page
router.post('/track/duration', async (req, res) => {
  try {
    const { visitId, duration } = req.body;
    if (!visitId || typeof duration !== 'number') {
      return res.status(400).json({ success: false, message: 'visitId and duration required' });
    }

    await Visitor.findByIdAndUpdate(visitId, {
      $set: { duration: Math.min(duration, 86400) } // Max 24 hours
    });

    return res.json({ success: true, message: 'Duration updated' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * =========================================================================
 * 2. CONTACT FORM ENDPOINTS
 * =========================================================================
 */

// POST /api/contact - Store contact message
router.post('/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
    }

    const clientIp = requestIp.getClientIp(req) || req.socket.remoteAddress || '127.0.0.1';
    const geo = await getGeoLocation(clientIp);

    const newContact = new Contact({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      ip: geo.ip || clientIp,
      city: geo.city || 'Unknown',
      country: geo.country || 'Unknown',
      userAgent: req.headers['user-agent'] || '',
      timestamp: new Date()
    });

    await newContact.save();

    return res.status(201).json({
      success: true,
      message: 'Message delivered and saved successfully!'
    });
  } catch (error) {
    console.error('[Contact Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * =========================================================================
 * 3. ADMIN ANALYTICS & DASHBOARD ENDPOINTS
 * =========================================================================
 */

// GET /api/admin/verify - Verify admin pin/key
router.get('/admin/verify', authenticateAdmin, (req, res) => {
  return res.json({ success: true, message: 'Authorized' });
});

// GET /api/admin/stats - High-level metrics for dashboard cards & charts
router.get('/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    const totalVisits = await Visitor.countDocuments();
    const uniqueVisitorsCount = (await Visitor.distinct('visitorId')).length;
    const totalMessages = await Contact.countDocuments();

    // Past 24 hours visits
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const todayVisits = await Visitor.countDocuments({ timestamp: { $gte: yesterday } });

    // Top Countries
    const topCountries = await Visitor.aggregate([
      { $group: { _id: { country: '$country', code: '$countryCode' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 }
    ]);

    // Device breakdown
    const devices = await Visitor.aggregate([
      { $group: { _id: '$device.type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Browser breakdown
    const browsers = await Visitor.aggregate([
      { $group: { _id: '$browser.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Top referrers
    const referrers = await Visitor.aggregate([
      { $group: { _id: '$referrer', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Average duration
    const avgDurationResult = await Visitor.aggregate([
      { $match: { duration: { $gt: 0 } } },
      { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
    ]);
    const avgDuration = avgDurationResult.length > 0 ? Math.round(avgDurationResult[0].avgDuration) : 0;

    return res.json({
      success: true,
      stats: {
        totalVisits,
        uniqueVisitors: uniqueVisitorsCount,
        todayVisits,
        totalMessages,
        avgDuration,
        topCountries,
        devices,
        browsers,
        referrers
      }
    });
  } catch (error) {
    console.error('[Admin Stats Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/visitors - Paginated visitor logs
router.get('/admin/visitors', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const search = (req.query.search || '').trim();
    const country = (req.query.country || '').trim();
    const device = (req.query.device || '').trim();
    const platform = (req.query.platform || '').trim();

    const query = {};

    if (country) {
      query.country = new RegExp(country, 'i');
    }
    if (device) {
      query['device.type'] = new RegExp(device, 'i');
    }
    if (platform) {
      query['social.platform'] = new RegExp(platform, 'i');
    }
    if (search) {
      query.$or = [
        { ip: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') },
        { country: new RegExp(search, 'i') },
        { 'browser.name': new RegExp(search, 'i') },
        { 'os.name': new RegExp(search, 'i') },
        { 'social.platform': new RegExp(search, 'i') },
        { 'social.username': new RegExp(search, 'i') },
        { referrer: new RegExp(search, 'i') },
        { instagramHandle: new RegExp(search, 'i') }
      ];
    }

    const total = await Visitor.countDocuments(query);
    const visitors = await Visitor.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({
      success: true,
      data: visitors,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error('[Admin Visitors Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/messages - Contact form inbox
router.get('/admin/messages', authenticateAdmin, async (req, res) => {
  try {
    const messages = await Contact.find().sort({ timestamp: -1 }).limit(100);
    return res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/admin/visitors/:id - Delete visitor log
router.delete('/admin/visitors/:id', authenticateAdmin, async (req, res) => {
  try {
    await Visitor.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Visitor record deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/admin/messages/:id - Delete contact message
router.delete('/admin/messages/:id', authenticateAdmin, async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Message record deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
