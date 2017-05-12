'use strict';

const gulp = require('gulp');
const gutil = require('gulp-util');
const config = require('../configs/clean')[gutil.env.site];
const clean = require('gulp-clean');

gulp.task('clean', function () {
    return gulp.src(config, {read: false})
		  .pipe(clean());
});