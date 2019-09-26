'use strict';

/**
 * A collection of task builder functions that can be used to generate gulp
 * tasks based on project configuration.
 */
module.exports = [
    'clean',
    'format',
    'lint',
    'build',
    'test',
    'package',
    'publish'
].reduce((tasks, task) => {
    tasks[task] = require(`./${task}`);
    return tasks;
}, {});
