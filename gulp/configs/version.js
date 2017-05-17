const meta = require('./meta');
const jsConfig = require('./js');
const cssConfig = require('./css');

module.exports = {
    'zendesk': {
        'filePath': '.version-zendesk',
        'src': [
            `${meta.zendeskAssets}/${meta.distDir}/**/*{${cssConfig.zendesk.prodSuffix}.css,${jsConfig.zendesk.prodSuffix}.js,${cssConfig.zendesk.prodSuffix}.css.gz,${jsConfig.zendesk.prodSuffix}.js.gz}`
        ],
        'dest': `${meta.zendeskAssets}/${meta.distDir}`,
    },
    'relate': {
        'filePath': '.version-relate',
        'src': [
            `${meta.relateAssets}/${meta.distDir}/**/*{${cssConfig.relate.prodSuffix}.css,${jsConfig.relate.prodSuffix}.js}`
        ],
        'dest': `${meta.relateAssets}/${meta.distDir}`,
    }
};