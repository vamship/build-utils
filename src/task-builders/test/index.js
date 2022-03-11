'use strict';

const _gulp = require('gulp');

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
    const tasks = [];
    if (project.projectType !== 'ui') {
        const nonUiTests = require('./test');
        tasks.push(nonUiTests(project, options));
    } else {
        const uiTests = require('./test-ui');
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
