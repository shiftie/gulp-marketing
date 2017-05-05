'use strict';

const requireDir = require('require-dir');
const gulp = require('gulp');
const gutil = require('gulp-util');
const argv = require('yargs').argv;

requireDir('./gulp', {recurse: true});

gulp.task('zendesk', [
        'clean',
        'update-html',
        'scripts'
    ], function () {
});


gulp.task('default', [
        'set-env',
        argv.site
    ], function(){
});