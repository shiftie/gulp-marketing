'use strict';

const meta = require('./meta');

module.exports = {
    'zendesk': {
        'srcDir': `${meta.zenAssets}/src/js`,
        'destDir': `${meta.zenAssets}/public/js`,
        'entryPoints': [
            'bootstrap.js',
            'app.js',
            'pages/*.js'
        ],
        'commonFilename': 'common.js',
        'prodSuffix': '.min',
    },
    'relate': {
        'srcDir': `${meta.rltAssets}/src/js`,
        'destDir': `${meta.rltAssets}/js`,
        'entryPoints': [
            'bootstrap.js',
            'app.js',
        ],
        'commonFilename': 'common.js',
        'prodSuffix': '.min',
    },
    'zopim': {
        'srcDir': `${meta.zpmAssets}/src/js`,
        'destDir': `${meta.zpmAssets}/src/js`,
        'entryPoints': [
            'bootstrap.js',
            'app.js',
        ],
        'commonFilename': 'common.js',
        'prodSuffix': '.min',
    },
}