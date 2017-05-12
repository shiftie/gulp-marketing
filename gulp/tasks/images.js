'use strict';

const gulp = require('gulp');
const gutil = require('gulp-util');
const del = require('del');
const vinylPaths = require('vinyl-paths');
const imagemin = require('gulp-imagemin');
const envs = require('../configs/env');
const config = require('../configs/images');
let siteConfig = config[gutil.env.site];

gulp.task('images', function () {
    const env = gutil.env.debug ? envs.dev : envs.prod;
    if (gutil.env.debug) {
        // If dev mode, only optimize & move images to public folder
        siteConfig = siteConfig[env];

        return gulp.src(`${siteConfig.srcDir}/**/*`)
            .pipe(vinylPaths(del))
            .pipe(imagemin(config.optimization))
		    .pipe(gulp.dest(siteConfig.destDir));
    }else {
        return;
        // TODO
    }
});