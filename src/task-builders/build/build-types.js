'use strict';

import _gulp from 'gulp';

/**
 * Sub builder that creates a task that will copy type declaration files that
 * have been marked for export from source to build directories. This method
 * will return a watcher if the watch option is set to true.
 *
 * @private
 * @param {Object} project Reference to an object that contains project metadata
 *        that can be used to customize build outputs.
 * @param {Object} options An options object that can be used to customize the
 *        task.
 *
 * @returns {Function} A gulp task.
 */
export default (project, options) => {
    const { watch } = Object.assign({ watch: false }, options);
    const rootDir = project.rootDir;
    const workingDir = rootDir.getChild('working');

    const paths = [project.exportedTypes]
        .map((dir) => rootDir.getChild(dir))
        .map((dir) => [undefined].map((ext) => dir.getAllFilesGlob(ext)))
        .reduce((result, arr) => result.concat(arr), []);
    console.log('building types');

    const task = () =>
        _gulp
            .src(paths, { allowEmpty: true, base: rootDir.globPath })
            .pipe(_gulp.dest(workingDir.absolutePath));

    task.displayName = 'build-types';
    task.description =
        'Copy type declaration files from source to build directory';

    if (watch) {
        const watchTask = () => _gulp.watch(paths, task);
        watchTask.displayName = 'watch-build-types';
        watchTask.description =
            'Automatically copy type declaration files to build directory on change';

        return watchTask;
    }
    return task;
};
