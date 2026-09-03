const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  visitorId: {
    type: String,
    required: true,
    index: true
  },
  ip: {
    type: String,
    default: 'Unknown',
    index: true
  },
  country: {
    type: String,
    default: 'Unknown'
  },
  countryCode: {
    type: String,
    default: 'XX'
  },
  region: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: 'Unknown'
  },
  zip: {
    type: String,
    default: ''
  },
  timezone: {
    type: String,
    default: ''
  },
  isp: {
    type: String,
    default: ''
  },
  org: {
    type: String,
    default: ''
  },
  lat: {
    type: Number,
    default: 0
  },
  lon: {
    type: Number,
    default: 0
  },
  browser: {
    name: { type: String, default: 'Unknown' },
    version: { type: String, default: '' },
    major: { type: String, default: '' }
  },
  os: {
    name: { type: String, default: 'Unknown' },
    version: { type: String, default: '' }
  },
  device: {
    type: { type: String, default: 'Desktop' },
    vendor: { type: String, default: '' },
    model: { type: String, default: '' }
  },
  userAgent: {
    type: String,
    default: ''
  },
  screen: {
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    pixelRatio: { type: Number, default: 1 }
  },
  language: {
    type: String,
    default: 'en'
  },
  referrer: {
    type: String,
    default: 'Direct'
  },
  landingPage: {
    type: String,
    default: '/'
  },
  social: {
    platform: {
      type: String,
      default: 'Direct'
    },
    username: {
      type: String,
      default: null
    },
    profileUrl: {
      type: String,
      default: null
    },
    sourceType: {
      type: String,
      default: 'Web'
    }
  },
  instagramHandle: {
    type: String,
    default: null
  },
  utmSource: {
    type: String,
    default: null
  },
  duration: {
    type: Number,
    default: 0 // Duration in seconds
  },
  visitCount: {
    type: Number,
    default: 1
  },
  isBot: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Visitor', visitorSchema);
