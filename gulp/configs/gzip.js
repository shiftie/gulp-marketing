const meta = require('./meta');
const jsConfig = require('./js');
const cssConfig = require('./css');

module.exports = {
    'zendesk': {
        'src': [
            `${meta.zendeskAssets}/${meta.distDir}/**/*{.html,.xml,.json,${cssConfig.zendesk.prodSuffix}.css,${jsConfig.zendesk.prodSuffix}.js}`
        ],
        'dest': `${meta.zendeskAssets}/${meta.distDir}`,
    },
    'relate': {
        'src': [
            `${meta.relateAssets}/${meta.distDir}/**/*{.html,.xml,.json,${cssConfig.relate.prodSuffix}.css,${jsConfig.relate.prodSuffix}.js}`
        ],
        'dest': `${meta.relateAssets}/${meta.distDir}`,
    }
}