"use strict";

const gulp = require('gulp');
const gutil = require('gulp-util');
const fs = require('fs');

gulp.task('update-html', () => {
    const file = 'index.html';
    const debug = gutil.env.debug;
    let html = fs.readFileSync(file, 'utf8');

    html = debug ?
        html.replace(/\.min\.(js|css)"/g, ".$1\""):
        html.replace(/(\.min)?\.(js|css)"/g, ".min.$2\"");
    fs.writeFileSync(file, html, 'utf8');
});