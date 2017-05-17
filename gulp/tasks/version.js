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

function updateModifiedFilesVersion(versions, currentVersionMapping) {
    return new Promise((resolve, reject) => {
        const updatedFiles = [];
        let versionnedFile = '';

        gulp.src(config.src)
            .pipe(newer({
                dest: config.dest,
                map: function(relativePath) {
                    versionnedFile = '';

                    if (versions.current.length) {
                        versionnedFile = currentVersionMapping[path.join(config.dest, relativePath)];
                        versionnedFile = path.relative(config.dest, versionnedFile);

                        return `${versionnedFile}`;
                    } else {
                        console.log('special case');
                        return `--some-non-existant-file-to-always-force-newer-condition--`;
                    }
                }
            }))
            .pipe(tap((file) => {
                    updatedFiles.push(path.relative(process.cwd(), file.path));
                if(versionnedFile.length) {
                }
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
            .on('finish', ()=>{
                resolve(updatedFiles);
            });

    });
}

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

function updateVersionFile(versions) {
    return new Promise((resolve, reject) => {
        fs.writeFileSync(config.filePath, versions.next);
        resolve();
    });
}

gulp.task('version', [], (callback) => {
    let versions = gutil.env.versions;
    let currentVersionMapping;

    currentVersionMapping = mapCurrentVersionFiles(versions);

    updateModifiedFilesVersion(versions, currentVersionMapping)
     .then((updatedFiles) => {
        return deleteDeprecatedFiles(updatedFiles, currentVersionMapping);
    })
    .then((mappingOfFilesToRenameToNextVersion) => {
        return upgradeUnmodifiedFilesVersion(versions, mappingOfFilesToRenameToNextVersion);
    })
    .then(() => {
        return updateVersionFile(versions);
    })
    .then(() => {
        console.log(`Updated to version ${versions.next}`);
        callback();
    });

});