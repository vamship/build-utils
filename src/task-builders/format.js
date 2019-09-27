'use strict';

const _gulp = require('gulp');
const _prettier = require('gulp-prettier');

/**
 * Builder function that can be used to generate a gulp task to format source
 * files.
 *
 * @param {Object} project Reference to an object that contains project metadata
 *        that can be used to customize build outputs.
 * @param {Object} options An options object that can be used to customize the
 *        task.
 *
 * @returns {Function} A gulp task.
 */
module.exports = (project, options) => {
    const { watch } = Object.assign({ watch: false }, options);

    const rootDir = project.rootDir;

    const dirs = ['src', 'test', '.gulp'];
    const extras = ['Gulpfile.js', 'README.md'];

    if (project.projectType === 'aws-microservice') {
        dirs.push('infra');
    }

    const paths = dirs
        .map((dir) => rootDir.getChild(dir))
        .map((dir) => [undefined].map((ext) => dir.getAllFilesPattern(ext)))
        .reduce((result, arr) => result.concat(arr), [])
        .concat(extras.map((file) => rootDir.getFilePath(file)));

    const task = () =>
        _gulp
            .src(paths, { allowEmpty: true, base: rootDir.absolutePath })
            .pipe(_prettier())
            .pipe(_gulp.dest(rootDir.absolutePath));

    task.displayName = 'format';
    task.description = 'Formats all source files, README.md and build scripts';

    if (watch) {
        const watch = () =>
            _gulp.watch(paths, { usePolling: true, delay: 5000 }, task);

        watch.displayName = 'watch-format';
        watch.description = 'Automatically format files on change';

        return watch;
    }
    return task;
};
