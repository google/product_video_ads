(function (window) {
    window.__env = window.__env || {};
  
    window.__env.client_id = '$FRONTEND_CLIENT_ID'
    window.__env.api_key = '$FRONTEND_API_KEY'
  
    // Whether or not to enable debug mode
    // Setting this to false will disable console output
    window.__env.enableDebug = true;
  }(this));