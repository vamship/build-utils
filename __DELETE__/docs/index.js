'use strict';

import _gulp from 'gulp';
import createJsDocsTask from './docs-js.js';
import createTsDocsTask from './docs-ts.js';

/**
 * Builder function that can be used to generate a gulp task that generates
 * documentation from code docs. The task takes on different implementations
 * based on the programming language - javascript or typescript.
 *
 * @param {Object} project Reference to an object that contains project metadata
 *        that can be used to customize build outputs.
 * @param {Object} options An options object that can be used to customize the
 *        task.
 *
 * @returns {Function} A gulp task.
 */
export default (project, options) => {
    let createTask = null;

    if (project.hasTypescript) {
        createTask = createTsDocsTask;
    } else {
        createTask = createJsDocsTask;
    }

    const task = createTask(project, options);

    task.displayName = 'docs';
    task.description = 'Generates project documentation from code docs';

    return task;
};
