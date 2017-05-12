const gulp   = require('gulp');
const gzip   = require('gulp-gzip');
const gutil   = require('gulp-util');
const newer = require('gulp-newer');
const config = require('../configs/gzip')[gutil.env.site];

gulp.task('gzip', function() {
  return gulp.src(config.src)
    .pipe(newer({
        dest: config.dest,
        map: function(relativePath) { return `${relativePath}.gz`; }
    }))
    .pipe(gzip({ skipGrowingFiles : true }))
    .pipe(gulp.dest(config.dest));
});