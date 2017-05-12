'use strict';

const gulp = require('gulp');
const gutil = require('gulp-util');
let config = require('../configs/images')[gutil.env.site];

gulp.task('images', function () {
    const env = gutil.env.debug ? envs.dev : envs.prod;
    if (gutil.env.debug) {
        // If dev mode, only copy images do public folder
        config = config[env];
        // TODO
    }
    return gulp.src(config, {read: false})
		  .pipe(clean());
});