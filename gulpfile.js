'use strict';

const requireDir = require('require-dir');
const gulp = require('gulp');
const gutil = require('gulp-util');
const argv = require('yargs').argv;
const runSequence = require('run-sequence');

requireDir('./gulp/tasks', {recurse: true});

/**
 * Runs the major tasks for development.
 * 1. Removes minified file suffixes in html
 * 2. Compiles sass
 * 3. Bundles JS
 * 4. Optimizes images & uploads
 */
gulp.task('zendesk', [], (callback) => {
    runSequence(
        ['update-html'],
        'styles',
        'scripts',
        'images',
        callback
    );
});

/**
 * Performs the remaining tasks for making assets production-ready.
 * 1. Minifies CSS
 * 2. Uglifies the JS
 * 3. Versions updated files
 */
gulp.task('zendesk:prod', ['zendesk'], (callback) => {
    runSequence(
        'styles:optimize',
        'scripts:optimize',
        'version',
        callback
    );
});

/**
 * The default gulp task.
 * Sets envrionment first, then calls either 'zendesk' or 'zendesk:prod' tasks,
 * depending on arguments.
 */
gulp.task('default', ['set-env'], (callback) => {
    runSequence(
        (gutil.env.debug === true) ? argv.site : `${gutil.env.site}:prod`,
        callback
    );
});