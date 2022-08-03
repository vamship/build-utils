'use strict';

import _gulp from 'gulp';
import _typescript from 'gulp-typescript';

/**
 * Sub builder that creates a task that will transpile typescript files into
 * javascript files. This method will return a watcher if the watch option
 * is set to true.
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

    const dirs = ['src', 'test'];
    if (project.projectType === 'aws-microservice') {
        dirs.push('infra');
    }

    const tsProject = _typescript.createProject('tsconfig.json');

    const paths = dirs
        .map((dir) => rootDir.getChild(dir))
        .map((dir) => ['ts'].map((ext) => dir.getAllFilesGlob(ext)))
        .reduce((result, arr) => result.concat(arr), []);

    const distFiles = [
        rootDir.getFileGlob('package-lock.json'),
        rootDir.getFileGlob('Dockerfile*'),
        rootDir.getFileGlob('LICENSE'),
        rootDir.getFileGlob('README.md'),
        rootDir.getFileGlob('.env'),
        rootDir.getFileGlob(project.configFileName),
    ];

    const buildTask = () =>
        _gulp
            .src(paths, { base: rootDir.globPath })
            .pipe(tsProject())
            .pipe(_gulp.dest(workingDir.absolutePath));

    const copyTask = () =>
        _gulp
            .src(distFiles, { allowEmpty: true })
            .pipe(_gulp.dest(workingDir.absolutePath));

    const task = _gulp.parallel([copyTask, buildTask]);

    task.displayName = 'build-ts';
    task.description = 'Build typescript source files to javascript files';

    if (watch) {
        const watchTask = () => _gulp.watch(paths, task);
        watchTask.displayName = 'watch-build-ts';
        watchTask.description =
            'Automatically build typescript files on change';

        return watchTask;
    }
    return task;
};
