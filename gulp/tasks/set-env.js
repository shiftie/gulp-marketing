'use strict';

const gulp = require('gulp');
const gutil = require('gulp-util');
const envs = require('../configs/env');
const argv = require('yargs').argv;

gulp.task('set-env', function () {
    gutil.env.debug = !(argv.env === envs.prod);
    gutil.env.site = argv.site;

    return;
});