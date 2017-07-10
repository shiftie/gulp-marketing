'use strict';

const gulp = require('gulp');
const gutil = require('gulp-util');
const argv = require('yargs').argv;
const envs = require('../configs/env');

gulp.task('set-env', [], function (callback) {
    gutil.env.debug = !(process.env.NODE_ENV === envs.prod);
    gutil.env.site = argv.site || 'zendesk';

    callback();
});
