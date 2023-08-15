'use strict';

import _gulp from 'gulp';
import TaskBuilder from '../task-builder.js';
import { Project } from '../project.js';
import { NotSupportedTaskBuilder } from './not-supported-task-builder.js';
import { PackageAwsTaskBuilder } from './package-aws-task-builder.js';
import { PackageNpmTaskBuilder } from './package-npm-task-builder.js';
import { PackageContainerTaskBuilder } from './package-container-task-builder.js';

/**
 * General purpose packaging task that configures sub tasks for packaging based
 * on the project. When a project is a container and has multiple container
 * targets, this task will either package the target named "default" or the
 * first target defined for the project.
 */
export class PackageTaskBuilder extends TaskBuilder {
    /**
     * Creates a new task builder.
     */
    constructor() {
        super(
            'package',
            `Packages project build files for publishing to a repository`
        );
    }

    /**
     * Generates a gulp task to package a project for packaging a project.
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
            builder.buildTask(project)
        );

        const task = _gulp.series(builders);
        return task;
    }

    /**
     * Returns a list of sub builders based on the project type and language.
     * @private
     */
    _getSubBuilders(project) {
        const { type, language } = project;
        const containerTargetList = project.getContainerTargets();

        // Type lib
        if (type === 'lib') {
            return [new PackageNpmTaskBuilder()];
        }
        // Type aws-microservice
        else if (type === 'aws-microservice') {
            return [new PackageAwsTaskBuilder()];
        }
        // Type ui
        else if (type === 'ui') {
            return [new NotSupportedTaskBuilder()];
        }
        // Type container
        else if (type === 'container') {
            const taskBuilderList = [];
            containerTargetList.forEach((target) => {
                taskBuilderList.push(
                    new PackageContainerTaskBuilder(
                        target,
                        project.getContainerDefinition(target).repo // Should test that this is defined
                    )
                );
            });
            return taskBuilderList;
        }
        // Type cli
        else if (type === 'cli') {
            if (containerTargetList.length > 0) {
                const taskBuilderList = [];
                containerTargetList.forEach((target) => {
                    taskBuilderList.push(
                        new PackageContainerTaskBuilder(
                            target,
                            project.getContainerDefinition(target).repo // Should test that this is defined
                        )
                    );
                });
                return taskBuilderList;
            } else {
                return [new PackageNpmTaskBuilder()];
            }
        }
        // Type api
        else if (type === 'api') {
            const taskBuilderList = [];
            containerTargetList.forEach((target) => {
                taskBuilderList.push(
                    new PackageContainerTaskBuilder(
                        target,
                        project.getContainerDefinition(target).repo // Should test that this is defined
                    )
                );
            });
            return taskBuilderList;
        }
        // Type undefined or not supported
        return [new NotSupportedTaskBuilder()];

        // if (type === 'container') {
        //     return [new NotSupportedTaskBuilder()];
        // } else if (language === 'ts') {
        //     return [new PackageNpmTaskBuilder()];
        // } else if (language === 'ts') {
        //     return [new PackageContainerTaskBuilder()];
        // } else {
        //     return [new PackageNpmTaskBuilder()];
        // }
    }
}
