const gulp   = require('gulp');
const gzip   = require('gulp-gzip');
const gutil   = require('gulp-util');
const config = require('../configs/gzip')[gutil.env.site];

gulp.task('gzip', function() {
  return gulp.src(config.src)
    .pipe(gzip())
    .pipe(gulp.dest(config.dest));
});