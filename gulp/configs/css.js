'use strict';

const gutil = require('gulp-util');
const meta = require('./meta');

module.exports = {
    'options': {
        'autoprefixer': {
            'browsers': [
                'last 2 versions',
            ],
            'cascade': true
        },
    },
    'zendesk': {
        'src': [ `${meta.zendeskAssets}/${meta.srcDir}/css/**/*.scss` ],
        'dest': `${meta.zendeskAssets}/${meta.distDir}/css`,
        'prodSuffix': `.min`,
    },
    'relate': {
        'src': [ `${meta.relateAssets}/${meta.srcDir}/css/**/*.scss` ],
        'dest': `${meta.relateAssets}/${meta.distDir}/css`,
        'prodSuffix': `.min`,
    },
}