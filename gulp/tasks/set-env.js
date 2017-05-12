'use strict';

const gulp = require('gulp');
const gutil = require('gulp-util');
const argv = require('yargs').argv;
const fs = require('fs');
const envs = require('../configs/env');
const cssConfig = require('../configs/css');
const imagesConfig = require('../configs/images');

function writeEnvDependentVariables() {
    const env = gutil.env.debug ? envs.dev : envs.prod;

    // SCSS image path variable (local images folder or S3 for prod)
    fs.writeFileSync(
        cssConfig[gutil.env.site].envVarsFile,
        `$cdn-assets-img: "${imagesConfig[gutil.env.site][env].destDir}";`
    );
}

gulp.task('set-env', function (callback) {
    gutil.env.debug = !(process.env.NODE_ENV === envs.prod);
    gutil.env.site = argv.site || 'zendesk';

    writeEnvDependentVariables();

    callback();
});