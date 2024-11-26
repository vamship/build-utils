'use strict';

import _gulp from 'gulp';
import TaskBuilder from '../task-builder.js';
import { Project } from '../project.js';
import { NotSupportedTaskBuilder } from './not-supported-task-builder.js';
import { PublishAwsTaskBuilder } from './publish-aws-task-builder.js';
import { PublishNpmTaskBuilder } from './publish-npm-task-builder.js';
import { PublishContainerTaskBuilder } from './publish-container-task-builder.js';

/**
 * General purpose publishing task that configures sub tasks for publishing based
 * on the project. When a project is an API or container and has multiple container
 * targets, this task will publish the target named "default". When the project is
 * a CLI and there is a "default" container defined, this task will publish that,
 * if there is no container defined, it will publish using npm.
 */
export class PublishTaskBuilder extends TaskBuilder {
    /**
     * Creates a new task builder.
     */
    constructor() {
        super('publish', `Publishes project to a repository`);
    }

    /**
     * Generates a gulp task to publish a project.
     *
     * @protected
     * @param {Object} project Reference to the project for which the task needs
     * to be defined.
     *
     * @returns {Function} A gulp task.
     */
    _createTask(project) {
        if (!(project instanceof Project)) {
            throw new Error('Invalid project (arg #1)');
        }

        const builders = this._getSubBuilders(project).map((builder) =>
            builder.buildTask(project),
        );

        const task = _gulp.series(builders);
        return task;
    }

    /**
     * Returns a list of sub builders based on the project type and language.
     * @private
     */
    _getSubBuilders(project) {
        const { type } = project;
        const containerTargetList = project.getContainerTargets();

        // Type lib
        if (type === 'lib') {
            return [new PublishNpmTaskBuilder()];
        }
        // Type aws-microservice
        else if (type === 'aws-microservice') {
            const stacks = project.getCdkTargets();
            const defaultStack = stacks.find((target) => target === 'default');

            if (defaultStack) {
                return [
                    new PublishAwsTaskBuilder(
                        defaultStack,
                        process.env.INFRA_ENV,
                        process.env.INFRA_NO_PROMPT === 'true',
                    ),
                ];
            } else {
                return [
                    new NotSupportedTaskBuilder(
                        'No default stack defined for project. Please use an explicitly named publish task.',
                    ),
                ];
            }
        }
        // Type container
        else if (type === 'container') {
            return [
                new PublishContainerTaskBuilder('default', project.version),
            ];
        }
        // Type cli
        else if (type === 'cli') {
            if (containerTargetList.length > 0) {
                return [
                    new PublishContainerTaskBuilder('default', project.version),
                ];
            } else {
                return [new PublishNpmTaskBuilder()];
            }
        }
        // Type api
        else if (type === 'api') {
            return [
                new PublishContainerTaskBuilder('default', project.version),
            ];
        }
        // Type ui (and potentially others that are not supported)
        else {
            return [new NotSupportedTaskBuilder()];
        }
    }

    /**
     * @override
     */
    getWatchPaths(project) {
        if (!(project instanceof Project)) {
            throw new Error('Invalid project (arg #1)');
        }
        const paths = this._getSubBuilders(project)
            .map((builder) => builder.getWatchPaths(project))
            .flat();
        return [...new Set(paths)];
    }
}
