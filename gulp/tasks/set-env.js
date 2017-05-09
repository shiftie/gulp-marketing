'use strict';

const gulp = require('gulp');
const gutil = require('gulp-util');
const envs = require('../configs/env');
const argv = require('yargs').argv;

gulp.task('set-env', function (callback) {
    gutil.env.debug = !(process.env.NODE_ENV === envs.prod);
    gutil.env.site = argv.site;

    callback();
});