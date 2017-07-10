const meta = require('./meta');
const jsConfig = require('./js');
const cssConfig = require('./css');

module.exports = {
    'manifest': 'rev-manifest.json',
    'basePath': '.',
    'zendesk': {
        'src': [
            `${meta.zendeskAssets}/${meta.distDir}/**/*{${cssConfig.zendesk.prodSuffix}.css,${jsConfig.zendesk.prodSuffix}.js}`
        ],
    },
    'relate': {
        'src': [
            `${meta.relateAssets}/${meta.distDir}/**/*{${cssConfig.relate.prodSuffix}.css,${jsConfig.relate.prodSuffix}.js,${cssConfig.relate.prodSuffix}.css.gz,${jsConfig.relate.prodSuffix}.js.gz}`
        ],
    }
};