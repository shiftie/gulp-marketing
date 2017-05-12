'use strict';

const requireDir = require('require-dir');
const gulp = require('gulp');
const gutil = require('gulp-util');
const argv = require('yargs').argv;
const runSequence = require('run-sequence');

requireDir('./gulp', {recurse: true});

gulp.task('zendesk', [], (callback) => {
    runSequence(
        [/*'clean',*/ 'update-html'],
        'styles',
        'scripts',
        'images',
        callback
    );
});

gulp.task('zendesk:prod', ['zendesk'], (callback) => {
    runSequence(
        'styles:optimize',
        'scripts:optimize',
        'gzip',
        callback
    );
});

gulp.task('default', ['set-env'], (callback) => {
    runSequence(
        (gutil.env.debug === true) ? argv.site : `${gutil.env.site}:prod`,
        callback
    );
});