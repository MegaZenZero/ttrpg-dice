module.exports = {
  name: "TTRPG Dice",
  capabilities: ["getUserContext"],
  zoomAppComponents: ["sidebar"],

  // Content Security Policy for Zoom’s in‐client WebView
  csp: {
    // Scripts: allow your code plus Firebase SDK and JSONP fallbacks
    scriptSrc: [
      "'self'",
      "'unsafe-inline'",     // remove once you’ve finalized and minified
      "'unsafe-eval'",       // remove for production
      "https://*.firebaseio.com",
      "https://www.gstatic.com",
      "https://www.googleapis.com"
    ],
    // Network calls: realtime DB over HTTPS and WebSockets
    connectSrc: [
      "'self'",
      "https://*.firebaseio.com",
      "wss://*.firebaseio.com",
      "https://www.googleapis.com"
    ],
    // Inline styles for Tailwind’s generated classes
    styleSrc: [
      "'self'",
      "'unsafe-inline'"
    ],
    // Images and data URIs
    imgSrc: [
      "'self'",
      "data:"
    ]
  }
};