// This should be the entry point of ASYNC loaded script
// (not mandatory for early layout setting)

import './globals.js'; // Shows how to expose globals, DO NOT DO THIS :)
import './plugins.js';

console.log('im app & im heavy weight & loaded ASYNC');

// Globals work
$(function() {
    $('body').addClass('ready');
});