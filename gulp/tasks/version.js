'use strict';

const gulp = require('gulp');
const rev = require('gulp-rev');
const gutil = require('gulp-util');
const fs = require('fs');
const config = require('../configs/version');
const siteConfig = config[gutil.env.site];

gulp.task('version', (cb) => {
    // Removes all reviosionned files
    function cleanRevvedFiles() {
        if (fs.existsSync(basePath + '/' + config.manifest)) {
            const manifest = JSON.parse(fs.readFileSync(basePath + '/' + config.manifest, 'utf8'));
            const fingerprints = [];

            for (let i in manifest) {
                fs.existsSync(basePath + `/${manifest[i]}`) &&
                fs.unlinkSync(basePath + `/${manifest[i]}`);
            }
        }
    }

    const basePath = config.basePath;
    const outputPath = siteConfig.dest;

    cleanRevvedFiles();

    gulp.src(siteConfig.src, {base: basePath})
        .pipe(rev())
		.pipe(gulp.dest(basePath))
        .pipe(rev.manifest({
            base: basePath
        }))
		.pipe(gulp.dest(basePath))
        .on('end', () => {
            cb();
        })
});