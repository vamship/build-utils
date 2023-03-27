'use strict';

import _gulp from 'gulp';
import nonUiTests from './test.js';
import uiTests from './test-ui.js';

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
    const tasks = [];
    if (project.projectType !== 'ui') {
        tasks.push(nonUiTests(project, options));
    } else {
        tasks.push(uiTests(project, options));
    }
    const task = _gulp.parallel(tasks);
    if (!watch) {
        task.displayName = `test-${testType}`;
        task.description = `Execute ${testType} tests`;
    } else {
        task.displayName = `watch-test-${testType}`;
        task.description = `Automatically execute ${testType} tests on change`;
    }

    return task;
};
