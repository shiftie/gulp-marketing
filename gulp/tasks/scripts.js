'use strict';

const gulp = require('gulp');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const gutil = require('gulp-util');
const sourcemaps = require('gulp-sourcemaps');
const watchify = require('watchify');
const uglify = require('gulp-uglify');
const globby = require('globby');
const mkdirp = require('mkdirp');
const path = require('path');
const config = require('../configs/js')[gutil.env.site];

gulp.task('scripts', ['clean'], function () {
    const debug = gutil.env.debug;
    const entries = globby.sync(config.entryPoints.map(entry => path.join(config.srcDir, entry)));
    const outputs = entries.map(entry => {
        let output = entry.replace(config.srcDir, config.destDir);
        output = debug ? output : output.replace(/\.js$/, `${config.prodSuffix}.js`);
        mkdirp.sync(path.dirname(output));

        return output;
    });

    let b = browserify({
        entries: entries,
        debug: debug,
        transform: [
            ['babelify', {
                'presets': ['es2015']
            }],
            'browserify-shim'
        ],
        plugin: [
            ['factor-bundle',
                {
                    outputs: outputs
                }
            ],
        ]
    });

    if (debug) {
        b = watchify(b);
        b.on('update', bundle); // on any dep update, runs the bundler
        b.on('log', gutil.log); // output build logs to terminal
    }

    function bundle() {
        const c = b.transform({ sourcemap: debug }, 'uglifyify') // minify bundles
            .bundle()
            .pipe(source(`${debug ? config.commonFilename : config.commonFilename.replace(/\.js$/, config.prodSuffix + '.js')}`)) // common bundle filename
            .pipe(buffer());
        if (debug) {
            c.pipe(sourcemaps.init({loadMaps: debug}));
        }
        c.pipe(uglify()) // minify common bundle
            .on('error', gutil.log);
        if (debug) {
           c.pipe(sourcemaps.write('./'));
        }
        c.pipe(gulp.dest(`${config.destDir}`))

        return c;
    }

    bundle();
});