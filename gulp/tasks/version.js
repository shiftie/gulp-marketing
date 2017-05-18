'use strict';

const gulp = require('gulp');
const gutil = require('gulp-util');
const fs = require('fs');
const shortId = require('shortid');
const tap = require('gulp-tap');
const path = require('path');
const globby = require('globby');
const rename = require('gulp-rename');
const newer = require('gulp-newer');
const clean = require('gulp-clean');
const del = require('del');
const vinylPaths = require('vinyl-paths');
const config = require('../configs/version')[gutil.env.site];
const jsConfig = require('../configs/js')[gutil.env.site];
const cssConfig = require('../configs/css')[gutil.env.site];

/**
 * Maps each file to version to its current version file
 * Like: {
 *  style.min.css: style.min.sdfksf454.css
 *  script.min.js: script.min.sdfksf454.js
 *  ....
 * }
 */
function mapCurrentVersionFiles(versions) {
    let mapping = {};
    let files = globby.sync(config.src);

    files.forEach((file) => {
        let versionnedFile = path.parse(file);
        if (versionnedFile.ext === '.gz') {
            if (/\.css\.gz$/.test(versionnedFile.base)) {
                versionnedFile.base = versionnedFile.base.replace(/\.css\.gz$/, `${versions.current}.css.gz`);
            } else if (/\.js\.gz$/.test(versionnedFile.base)) {
                versionnedFile.base = versionnedFile.base.replace(/\.js\.gz$/, `${versions.current}.js.gz`);
            }
        } else {
            versionnedFile.base = versionnedFile.base.replace(versionnedFile.ext, `${versions.current}${versionnedFile.ext}`);
        }
        versionnedFile = path.format(versionnedFile);

        mapping[file] = versionnedFile;
    });

    return mapping;
}

/**
 * Files that have been modified have a new version file generated
 * We're returning the list of files that have been processed
 */
function updateModifiedFilesVersion(versions, currentVersionMapping) {
    return new Promise((resolve, reject) => {
        const updatedFiles = [];
        let versionnedFile = '';

        gulp.src(config.src)
            .pipe(newer({
                dest: config.dest,
                map: function(relativePath) {
                    versionnedFile = '';

                    versionnedFile = currentVersionMapping[path.join(config.dest, relativePath)];
                    versionnedFile = path.relative(config.dest, versionnedFile);

                    return `${versionnedFile}`;
                }
            }))
            .pipe(tap((file) => {
                updatedFiles.push(path.relative(process.cwd(), file.path));
            }))
            .pipe(rename((path) => {
                if (path.extname === '.gz') {
                    if (/\.css$/.test(path.basename)) {
                        path.basename = path.basename.replace(/\.css$/, `${versions.next}.css`);
                    } else if (/\.js$/.test(path.basename)) {
                        path.basename = path.basename.replace(/\.js$/, `${versions.next}.js`);
                    }
                } else {
                    path.basename += versions.next;
                }
            }))
            .pipe(gulp.dest(`${config.dest}`))
            .on('finish', () => {
                resolve(updatedFiles);
            });
    });
}

/**
 * We're removing deprecated version files of files that have been
 * processed earlier (via updateModifiedFilesVersion)
 */
function deleteDeprecatedFiles(updatedFiles, currentVersionMapping) {
    return new Promise((resolve, reject) => {
        const deprecatedFileList = [];

        updatedFiles.forEach((item) => {
            if (currentVersionMapping[item]) {
                deprecatedFileList.push(currentVersionMapping[item]);
                delete currentVersionMapping[item];
            }
        });

        gulp.src(deprecatedFileList, {read: false})
            .pipe(clean())
            .on('finish', () => {
                resolve(currentVersionMapping);
            });
    });
}

/**
 * For remaining (unmodified) files,
 * we use the mapping to rename version files to the new version
 */
function upgradeUnmodifiedFilesVersion(versions, mappingOfFilesToRenameToNextVersion) {
    return new Promise((resolve, reject) => {
        const fileList = [];

        Object.keys(mappingOfFilesToRenameToNextVersion).forEach((item) => {
            fileList.push(mappingOfFilesToRenameToNextVersion[item]);
        });

        gulp.src(fileList, { base: config.dest })
            .pipe(vinylPaths(del))
            .pipe(rename((path) => {
                path.basename = path.basename.replace(versions.current, versions.next);
            }))
            .pipe(gulp.dest(config.dest))
            .on('finish', () => {
                resolve();
            });
    });
}

// Stores new version as the current version
function updateVersionFile(versions) {
    return new Promise((resolve, reject) => {
        fs.writeFileSync(config.filePath, versions.next);
        resolve();
    });
}

/**
 * If the configured version holding file doesn't exist
 * it's created with a generated value
 * Then we store in gutil.env.versions the current & next version
 * This task is a dependency for other tasks
 */
gulp.task('get-versions', (callback) => {
    if (gutil.env.versions) {
        callback();
    } else {
        if (!fs.existsSync(config.filePath)) {
            fs.writeFileSync(config.filePath, shortId.generate());
        }

        const currentVersion = fs.readFileSync(config.filePath,'utf8');
        const nextVersion = `.${shortId.generate()}`;

        gutil.env.versions = {
            current: currentVersion,
            next: nextVersion,
        };

        callback();
    }
});

/**
 * Versioning task:
 * checks configured files to version
 * detects which ones have been updated
 * updated files are versioned & deprecated versions are removed
 * unmodified files have their versioned file updated to new version
 * new version is stored in a site specific file
 */
gulp.task('version', [], (callback) => {
    // This value is set by get-versions task
    let versions = gutil.env.versions;
    let currentVersionMapping;

    // For each configured file, associates current version file
    currentVersionMapping = mapCurrentVersionFiles(versions);

    // Generates a new version for updated minified files
    updateModifiedFilesVersion(versions, currentVersionMapping)
     .then((updatedFiles) => {
         // Removes deprecated versions
        return deleteDeprecatedFiles(updatedFiles, currentVersionMapping);
    })
    .then((mappingOfFilesToRenameToNextVersion) => {
        // For minified files that are not modified,
        // simply updates versioned file name to match new version
        return upgradeUnmodifiedFilesVersion(versions, mappingOfFilesToRenameToNextVersion);
    })
    .then(() => {
        // Stores new version as the current version into a file
        return updateVersionFile(versions);
    })
    .then(() => {
        console.log(`Updated to version ${versions.next}`);
        callback();
    });
});