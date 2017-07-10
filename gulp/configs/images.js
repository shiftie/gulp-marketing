const env = require('./env');
const meta = require('./meta');

module.exports = {
    'optimization': {
        'optimizationLevel': 3,
        'progessive': true,
        'interlaced': true
    },
    'zendesk': {
        'srcDir': `${meta.zendeskAssets}/${meta.srcDir}/images`,
        'uploadScript': `scripts/uploadImages.js`,
    },
    'relate': {
        'srcDir': `${meta.relateAssets}/${meta.srcDir}/images`,
        'uploadScript': `scripts/uploadImages.js`,
    }
}