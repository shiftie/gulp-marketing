const gutil = require('gulp-util');
const cssConfig = require('./css')[gutil.env.site];
const jsConfig = require('./js')[gutil.env.site];

module.exports = {
    'zendesk': [
        `${cssConfig.dest}`,
        `${jsConfig.destDir}`
    ],
    'relate': [
        `${cssConfig.dest}`,
        `${jsConfig.destDir}`
    ],
}