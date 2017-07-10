'use strict';

const gulp = require('gulp');
const gutil = require('gulp-util');
const imagemin = require('gulp-imagemin');
const config = require('../configs/images');
const siteConfig = config[gutil.env.site];

gulp.task('images', function (cb) {
    gulp.src(`${siteConfig.srcDir}/**/*`)
        .pipe(imagemin(config.optimization))
        .pipe(gulp.dest(siteConfig.srcDir));

    // TODO: call S3 image upload script via siteConfig.uploadScript

    cb();
});