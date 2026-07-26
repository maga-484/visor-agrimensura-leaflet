export default [
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // APIs del navegador
        console: 'readonly',
        document: 'readonly',
        window: 'readonly',
        localStorage: 'readonly',
        navigator: 'readonly',
        Map: 'readonly',
        Set: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        DOMParser: 'readonly',
        CustomEvent: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        // Librerías externas via CDN
        L: 'readonly',           // Leaflet
        shp: 'readonly',         // shpjs
        topojson: 'readonly',    // topojson-client
      }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-undef': 'error',
    }
  }
];
