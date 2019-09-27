'use strict';

const _gulp = require('gulp');
const _eslint = require('gulp-eslint');

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
    const extensions = ['js'];
    const dirs = ['src', 'test'];

    if (project.hasTypescript) {
        extensions.push('ts');
    }

    if (project.projectType === 'aws-microservice') {
        dirs.push('infra');
    }

    const paths = dirs
        .map((dir) => rootDir.getChild(dir))
        .map((dir) => extensions.map((ext) => dir.getAllFilesGlob(ext)))
        .reduce((result, arr) => result.concat(arr), []);

    const task = () =>
        _gulp
            .src(paths, { allowEmpty: true })
            .pipe(_eslint())
            .pipe(_eslint.format())
            .pipe(_eslint.failAfterError());

    task.displayName = 'lint';
    task.description = 'Lints source files';

    if (watch) {
        return task;
    } else {
        const watchTask = () => _gulp.watch(paths, task);
        watchTask.displayName = 'watch-lint';
        watchTask.description = 'Automatically lint files on change';

        return watchTask;
    }
};
