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

gulp.task('scripts', [], function (callback) {
    const debug = gutil.env.debug;
    const entries = globby.sync(config.entryPoints.map(entry => path.join(config.srcDir, entry)));
    const outputs = entries.map(entry => {
        const output = suffixInProd(entry.replace(config.srcDir, config.destDir));
        mkdirp.sync(path.dirname(output));

        return output;
    });
    let remainingOutputs = outputs.length + 1; // +1 for common.js bundle

    let b = browserify({
        entries: entries,
        debug: debug,
        transform: [
            ['babelify', {
                'presets': ['es2015', 'react']
            }],
            'browserify-shim',
        ],
        plugin: [
            ['factor-bundle',
                {
                    outputs: outputs
                }
            ],
        ]
    });

    if (!debug) {
        b.on('factor.pipeline', function (file, pipeline) {
            // Watches for bundles output completion in order to call end of the task
            pipeline._readableState.pipes.on('finish',function(){
                checkTaskEnd();
            });
        });
    } else {
        b = watchify(b);
        b.on('update', bundle); // on any dep update, runs the bundler
        b.on('log', gutil.log); // output build logs to terminal
    }

    function checkTaskEnd() {
        if(!debug) {
            remainingOutputs -= 1;
            if (remainingOutputs === 0) {
                callback();
            }
        } else {
            // If dev mode, we signal the end of the task once
            // in order to keep executing following tasks
            // but watchify is still monitoring bundle modifications
            if (typeof callback === 'function') {
                callback();
                callback = null;
            }
        }
    }

    function suffixInProd(string) {
        if (!debug) {
            string = string.replace(/\.js$/, config.prodSuffix + '.js');
        }

        return string;
    }

    function bundle() {
        let c = b
            .bundle()
            .pipe(source(suffixInProd(config.commonFilename))); // common bundle filename
        if (debug) {
            c = c.pipe(buffer()).pipe(sourcemaps.init({loadMaps: debug}))
                .pipe(sourcemaps.write('./'));
        }
        c.pipe(gulp.dest(`${config.destDir}`))
            .on('end', checkTaskEnd);
    }

    bundle();
});

gulp.task('scripts:optimize', [], function (callback) {
    gulp.src(`${config.destDir}/**/*.js`)
        .pipe(uglify())
        .pipe(gulp.dest(config.destDir))
        .on('end', callback);
});