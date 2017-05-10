const config = require('./meta');

module.exports = {
     'zendesk': [ `${config.zendeskAssets}/${config.distDir}` ],
     'relate': [ `${config.relateAssets}/${config.distDir}` ],
}