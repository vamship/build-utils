'use strict';

const _gulp = require('gulp');
const _typescript = require('gulp-typescript');
const _execa = require('execa');

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
module.exports = (project, options) => {
    const { watch } = Object.assign({ watch: false }, options);
    const rootDir = project.rootDir;
    const workingDir = rootDir.getChild('working');

    const viteBin = project.rootDir.getFilePath('node_modules/.bin/vite');

    const dirs = ['src', 'test'];

    const distFiles = [
        rootDir.getFileGlob('_scripts/*'),
        rootDir.getFileGlob('nginx.conf'),
        rootDir.getFileGlob('package-lock.json'),
        rootDir.getFileGlob('Dockerfile*'),
        rootDir.getFileGlob('LICENSE'),
        rootDir.getFileGlob('README.md'),
        rootDir.getFileGlob('.env'),
        rootDir.getFileGlob(project.configFileName),
    ];
    const copyTask = () =>
        _gulp
            .src(distFiles, { allowEmpty: true })
            .pipe(_gulp.dest(workingDir.absolutePath));

    const args = ['build'];
    const buildTask = () => _execa(viteBin, args, { stdio: 'inherit' });
    buildTask.displayName = 'build-ts';
    buildTask.description = 'Build typescript source files to javascript files';

    const task = _gulp.series([buildTask, copyTask]);

    if (watch) {
        const paths = dirs
            .map((dir) => rootDir.getChild(dir))
            .map((dir) => ['ts', 'tsx'].map((ext) => dir.getAllFilesGlob(ext)))
            .reduce((result, arr) => result.concat(arr), []);

        args.push('--watch');
        const buildTask = () => _execa(viteBin, args, { stdio: 'inherit' });
        const task = _gulp.series([buildTask, copyTask]);
        const watchTask = () => _gulp.watch(paths, task);
        watchTask.displayName = 'watch-build-ts';
        watchTask.description =
            'Automatically build typescript files on change';
        return watchTask;
    }

    return task;
};
