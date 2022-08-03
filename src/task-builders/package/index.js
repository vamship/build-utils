'use strict';

import _gulp from 'gulp';
import createTypesTask from './package-types.js';
import createAwsTask from './package-aws.js';
import createDockerTask from './package-docker.js';
import createNpmTask from './package-npm.js';

/**
 * Builder function that can be used to generate a gulp task to package a
 * project for distribution. The task takes on different implementations based
 * on project types. For example, javascript libraries will yield an archive
 * resulting from an `npm pack`, while docker enabled projects will result in
 * the creation of a docker image.
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
        createTask = require('./package-types');
    } else if (project.projectType === 'aws-microservice') {
        createTask = require('./package-aws');
    } else if (project.hasDocker) {
        createTask = require('./package-docker');
    } else if (project.projectType === 'lib' || project.projectType === 'cli') {
        createTask = require('./package-npm');
    }

    const task = createTask(project, options);

    if (!(task instanceof Array)) {
        if (types) {
            task.displayName = 'package-types';
            task.description =
                'Create a distribution package for the types exported by the project';
        } else {
            task.displayName = 'package';
            task.description = 'Create a distribution package for the project';
        }
    }

    return task;
};
