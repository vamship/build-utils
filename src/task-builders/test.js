'use strict';

const _gulp = require('gulp');
const _execa = require('execa');

/**
 * Builder function that can be used to generate a gulp task to execute
 * instrumented unit/api tests.
 *
 * @param {Object} project Reference to an object that contains project metadata
 *        that can be used to customize build outputs.
 * @param {Object} options An options object that can be used to customize the
 *        task.
 *
 * @returns {Function} A gulp task.
 */
module.exports = (project, options) => {
    const { testType, watch } = Object.assign(
        { testType: 'unit', watch: false },
        options
    );

    if (testType === 'api' && project.projectType === 'lib') {
        return;
    }

    const rootDir = project.jsRootDir;
    const mochaBin = project.rootDir.getFilePath('node_modules/.bin/mocha');
    const nycBin = project.rootDir.getFilePath('node_modules/.bin/nyc');

    const paths = rootDir.getChild(`test/${testType}`).getAllFilesGlob('js');

    const args = [
        '--reporter',
        'text-summary',
        '--reporter',
        'html',
        '--temp-dir',
        rootDir.getFilePath('coverage')
    ];

    if (project.hasTypescript) {
        ['--extension', '.ts'].map((arg) => args.push(arg));
    }

    [mochaBin, '--color', '-R', 'spec', '--recursive', paths].map((arg) =>
        args.push(arg)
    );

    const task = () => _execa(nycBin, args, { stdio: 'inherit' });
    task.displayName = `test-${testType}`;
    task.description = `Execute ${testType} tests`;

    if (watch) {
        const watchPaths = ['src', 'test']
            .map((dir) => rootDir.getChild(dir))
            .map((dir) => dir.getAllFilesGlob('js'));

        const watchTask = () => _gulp.watch(watchPaths, task);
        watchTask.displayName = `watch-test-${testType}`;
        watchTask.description = `Automatically execute ${testType} tests on change`;

        return watchTask;
    }

    return task;
};
