'use strict';

const gulp = require('gulp');
const gutil = require('gulp-util');
const sass = require('gulp-sass');
const compass = require('compass-importer');
const path = require('path');
const cssnano = require('gulp-cssnano');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const tap = require('gulp-tap');
const now = require('performance-now');
const rename = require('gulp-rename');
const newer = require('gulp-newer');
const config = require('../configs/css');
const siteConfig = config[gutil.env.site];

/**
 * Compiles a scss file, using compass and running any postprocessors as well.
 */
function compile(file) {
    const processors = [
        autoprefixer(config.options.autoprefixer),
    ];
    const start = now();

    return gulp.src(siteConfig.src)
        .pipe(newer({
            dest: siteConfig.dest,
            ext: '.css'
        }))
        .pipe(sass({ importer: compass }).on('error', sass.logError))
        .pipe(postcss(processors))
        .pipe(tap((file) => {
            gutil.log(gutil.colors.dim(`SCSS compiling ${file.path}`));
        }))
        .pipe(gulp.dest(siteConfig.dest))
        .on('end', () => {
            gutil.log(gutil.colors.green(`SCSS compilation done in ${((now() - start) / 1000).toFixed(3)} s`));
        });
};

/**
 * Sets up the watcher for changes in scss files when in debug mode,
 * and compiles changed files.
 */
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

/**
 * Minifies & renames the CSS generated from the 'styles' task.
 */
gulp.task('styles:optimize', [], function () {
    // Minifies & renames the output CSS file
    return gulp.src([
            `${siteConfig.dest}/**/*.css`,
            `!${siteConfig.dest}/**/*${siteConfig.prodSuffix}.css`,
            `!${siteConfig.dest}/**/*${siteConfig.prodSuffix}${gutil.env.versions.current}.css`,
            ]
        )
        .pipe(newer({
            dest: siteConfig.dest,
            ext: `${siteConfig.prodSuffix}.css`
        }))
        .pipe(cssnano())
        .pipe(rename((path) => {
            path.basename += siteConfig.prodSuffix
        }))
        .pipe(gulp.dest(`${siteConfig.dest}`));
});
