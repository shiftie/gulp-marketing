const env = require('./env');
const meta = require('./meta');

module.exports = {
    'zendesk': {
        [env.dev]: {
            'srcDir': `${meta.zendeskAssets}/${meta.srcDir}/images`,
            'destDir': `${meta.zendeskAssets}/${meta.distDir}/images`,
        },
        [env.prod]: {
            'srcDir': `${meta.zendeskAssets}/${meta.srcDir}/images`,
            'destDir': `//zen-marketing-assets-new-structure.s3-us-west-2.amazonaws.com/images`,
        }
    },
    'relate': {
        [env.dev]: {
            'srcDir': `${meta.relateAssets}/${meta.srcDir}/images`,
            'destDir': `${meta.relateAssets}/${meta.distDir}/images`,
        },
        [env.prod]: {
            'srcDir': `${meta.relateAssets}/${meta.srcDir}/images`,
            'destDir': `//zen-marketing-assets-new-structure.s3-us-west-2.amazonaws.com/images`,
        }
    }
}