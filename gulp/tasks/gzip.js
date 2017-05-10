const gulp   = require('gulp');
const gzip   = require('gulp-gzip');
const gutil   = require('gulp-util');
const meta = require('../configs/meta');
const assetsPath = meta[`${gutil.env.site}Assets`];

gulp.task('gzip', function() {
  return gulp.src([
      `${assetsPath}/${meta.distDir}/**/*.{html,xml,json,css,js}`
  ])
    .pipe(gzip())
    .pipe(gulp.dest(`${assetsPath}/${meta.distDir}`));
});