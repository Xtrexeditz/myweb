const axios = require('axios');

// In-memory cache for fast IP lookups (cache for 24 hours)
const geoCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Check if an IP address is a private/local network address
 */
function isPrivateIP(ip) {
  if (!ip) return true;
  const cleanIp = ip.replace(/^::ffff:/, '');
  return (
    cleanIp === '127.0.0.1' ||
    cleanIp === '::1' ||
    cleanIp === 'localhost' ||
    cleanIp.startsWith('192.168.') ||
    cleanIp.startsWith('10.') ||
    cleanIp.startsWith('172.16.') ||
    cleanIp.startsWith('172.17.') ||
    cleanIp.startsWith('172.18.') ||
    cleanIp.startsWith('172.19.') ||
    cleanIp.startsWith('172.20.') ||
    cleanIp.startsWith('172.21.') ||
    cleanIp.startsWith('172.22.') ||
    cleanIp.startsWith('172.23.') ||
    cleanIp.startsWith('172.24.') ||
    cleanIp.startsWith('172.25.') ||
    cleanIp.startsWith('172.26.') ||
    cleanIp.startsWith('172.27.') ||
    cleanIp.startsWith('172.28.') ||
    cleanIp.startsWith('172.29.') ||
    cleanIp.startsWith('172.30.') ||
    cleanIp.startsWith('172.31.')
  );
}

/**
 * Resolve IP to Geolocation data
 * @param {string} rawIp 
 * @returns {Promise<object>}
 */
async function getGeoLocation(rawIp) {
  const ip = (rawIp || '').replace(/^::ffff:/, '').trim();

  const defaultGeo = {
    ip: ip || '127.0.0.1',
    country: 'Local Network',
    countryCode: 'IN',
    region: 'Madhya Pradesh',
    city: 'Sanawad (Dev)',
    zip: '451111',
    timezone: 'Asia/Kolkata',
    isp: 'Localhost',
    org: 'XTrex Dev Studio',
    lat: 22.1756,
    lon: 76.0645
  };

  if (!ip || isPrivateIP(ip)) {
    return defaultGeo;
  }

  // Check cache first
  const cached = geoCache.get(ip);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  try {
    // Primary lookup via ip-api.com
    const response = await axios.get(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`, {
      timeout: 3000
    });

    if (response.data && response.data.status === 'success') {
      const data = {
        ip: response.data.query || ip,
        country: response.data.country || 'Unknown',
        countryCode: response.data.countryCode || 'XX',
        region: response.data.regionName || response.data.region || '',
        city: response.data.city || 'Unknown',
        zip: response.data.zip || '',
        timezone: response.data.timezone || '',
        isp: response.data.isp || '',
        org: response.data.org || '',
        lat: response.data.lat || 0,
        lon: response.data.lon || 0
      };

      geoCache.set(ip, { data, timestamp: Date.now() });
      return data;
    }
  } catch (err) {
    // Fallback lookup via ipapi.co
    try {
      const fallback = await axios.get(`https://ipapi.co/${ip}/json/`, { timeout: 2500 });
      if (fallback.data && !fallback.data.error) {
        const data = {
          ip: fallback.data.ip || ip,
          country: fallback.data.country_name || 'Unknown',
          countryCode: fallback.data.country_code || 'XX',
          region: fallback.data.region || '',
          city: fallback.data.city || 'Unknown',
          zip: fallback.data.postal || '',
          timezone: fallback.data.timezone || '',
          isp: fallback.data.org || '',
          org: fallback.data.org || '',
          lat: fallback.data.latitude || 0,
          lon: fallback.data.longitude || 0
        };

        geoCache.set(ip, { data, timestamp: Date.now() });
        return data;
      }
    } catch (fallbackErr) {
      console.warn(`[Geo] Geolocation lookup failed for IP ${ip}:`, fallbackErr.message);
    }
  }

  return {
    ip,
    country: 'Unknown',
    countryCode: 'XX',
    region: '',
    city: 'Unknown',
    zip: '',
    timezone: '',
    isp: '',
    org: '',
    lat: 0,
    lon: 0
  };
}

module.exports = {
  getGeoLocation,
  isPrivateIP
};
