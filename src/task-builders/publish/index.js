'use strict';

import _gulp from 'gulp';

import createTypesTask from './publish-types.js';
import createNpmTask from './publish-npm.js';
import createAwsTask from './publish-aws.js';
import createDockerTask from './publish-docker.js';

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
export default (project, options) => {
    const { types } = options;
    let createTask = null;

    if (types) {
        if (!project.hasExportedTypes) {
            return;
        }
        createTask = createTypesTask;
    } else if (project.projectType === 'aws-microservice') {
        createTask = createAwsTask;
    } else if (project.hasDocker) {
        createTask = createDockerTask;
    } else if (project.projectType === 'lib' || project.projectType === 'cli') {
        createTask = createNpmTask;
    }

    const task = createTask(project, options);

    if (!(task instanceof Array)) {
        if (types) {
            task.displayName = 'publish-types';
            task.description =
                'Publish the types exported by this project to a repository';
        } else {
            task.displayName = 'publish';
            task.description = 'Publish the package to a repository';
        }
    }

    return task;
};
