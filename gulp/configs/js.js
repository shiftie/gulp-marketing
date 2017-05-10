'use strict';

const meta = require('./meta');

module.exports = {
    'zendesk': {
        'srcDir': `${meta.zendeskAssets}/${meta.srcDir}/js`,
        'destDir': `${meta.zendeskAssets}/${meta.distDir}/js`,
        'entryPoints': [
            'bootstrap.js',
            'app.js',
            'pages/*.js'
        ],
        'commonFilename': 'common.js',
        'prodSuffix': '.min',
    },
    'relate': {
        'srcDir': `${meta.relateAssets}/${meta.srcDir}/js`,
        'destDir': `${meta.relateAssets}/${meta.distDir}`,
        'entryPoints': [
            'bootstrap.js',
            'app.js',
        ],
        'commonFilename': 'common.js',
        'prodSuffix': '.min',
    },
}