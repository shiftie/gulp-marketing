'use strict';

const gulp = require('gulp');
const gutil = require('gulp-util');
const sass = require('gulp-sass');
const compass = require('compass-importer');
const path = require('path');
const cache = require('gulp-cached');
const cssnano = require('gulp-cssnano');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const tap = require('gulp-tap');
const now = require('performance-now');
const rename = require('gulp-rename');
const del = require('del');
const vinylPaths = require('vinyl-paths');
const config = require('../configs/css');
const siteConfig = config[gutil.env.site];

function compile(file) {
    const cacheName = 'compiling-scss';
    const processors = [
        autoprefixer(config.options.autoprefixer),
    ];

    // If we're updating a file that is not a partial (starting with _)
    // we invalidate it's cache so it's recompiled even if it's not modified
    if (file && !/^\_/.test(path.basename(file))) {
        delete cache.caches[cacheName][file];
    }

    // Recompile if global recompilation or non partial file update
    if (!file || (file && !/^\_/.test(path.basename(file)))) {
        const start = now();
        return gulp.src(siteConfig.src)
            .pipe(cache(cacheName, {optimizeMemory: true}))
            .pipe(sass({ importer: compass }).on('error', sass.logError))
            .pipe(postcss(processors))
            .pipe(tap((file) => {
                gutil.log(gutil.colors.dim(`SCSS compiling ${file.path}`));
            }))
            .pipe(gulp.dest(siteConfig.dest))
            .on('end', () => {
                gutil.log(gutil.colors.green(`SCSS compilation done in ${((now() - start) / 1000).toFixed(3)} s`));
            });
    } else {
        return;
    }
};

gulp.task('styles', function () {
    const debug = gutil.env.debug;

    // Watch if debug (non production mode)
    if (debug) {
        gulp.watch(siteConfig.src).on('change', (file) => {
            compile(file.path);
        });
    }

    return compile();
});

gulp.task('styles:optimize', [], function () {
    // Minifies & renames the output CSS file
    return gulp.src(`${siteConfig.dest}/**/*.css`)
        .pipe(vinylPaths(del))
        .pipe(cssnano())
        .pipe(rename((path) => {
            path.basename += siteConfig.prodSuffix
        }))
        .pipe(gulp.dest(`${siteConfig.dest}`));
});