'use strict';

import _gulp from 'gulp';
import { execa as _execa } from 'execa';

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
export default (project, options) => {
    const { testType, watch } = Object.assign(
        { testType: 'unit', watch: false },
        options
    );

    const rootDir = project.jsRootDir;
    const jestBin = project.rootDir.getFilePath('node_modules/.bin/jest');
    let args = ['--config', 'jest.config.js', '--coverage'];

    if (watch) {
        args.push('--watchAll');
        const watchTask = () => _execa(jestBin, args, { stdio: 'inherit' });
        watchTask.displayName = `watch-test-${testType}`;
        watchTask.description = `Automatically execute ${testType} tests on change`;
        return watchTask;
    }

    const task = () => _execa(jestBin, args, { stdio: 'inherit' });
    task.displayName = `test-${testType}`;
    task.description = `Execute ${testType} tests`;
    return task;
};
