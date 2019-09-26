'use strict';

const _gulp = require('gulp');

/**
 * Builder function that can be used to generate a gulp task to publish a
 * package. The task takes on different implementations based on project types.
 * For example, javascript libraries will be published to an npm registry, using
 * `npm publish`, while docker enabled projects will result in a docker image
 * being published to a docker registry.
 *
 * @param {Object} project Reference to an object that contains project metadata
 *        that can be used to customize build outputs.
 * @param {Object} options An options object that can be used to customize the
 *        task.
 *
 * @returns {Function} A gulp task.
 */
module.exports = (project, options) => {
    let createTask = null;

    if (project.projectType === 'aws-microservice') {
        createTask = require('./publish-aws');
    } else if (project.hasDocker) {
        createTask = require('./publish-docker');
    } else if (project.projectType === 'lib') {
        createTask = require('./publish-npm');
    }

    const task = createTask(project, options);
    if (!(task instanceof Array)) {
        task.displayName = 'publish';
        task.description = 'Publish the package to a repository';
    }

    return task;
};
