const meta = require('./meta');

module.exports = {
    'zendesk': {
        'src': [ `${meta.zendeskAssets}/${meta.distDir}/**/*.{html,xml,json,css,js}` ],
        'dest': `${meta.zendeskAssets}/${meta.distDir}`,
    },
    'relate': {
        'src': [ `${meta.relateAssets}/${meta.distDir}/**/*.{html,xml,json,css,js}` ],
        'dest': `${meta.relateAssets}/${meta.distDir}`,
    }
}