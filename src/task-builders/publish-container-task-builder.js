'use strict';

import TaskBuilder from '../task-builder.js';
import { Project } from '../project.js';
import { execa as _execa } from 'execa';
import _gulp from 'gulp';

/**
 * Builder function that can be used to generate a gulp task to publish a CDK
 * project to CONTAINER.
 */
export class PublishContainerTaskBuilder extends TaskBuilder {
    /**
     * Creates a new task builder.
     *
     * @param {String} [target='default'] The name of the CDK stack target
     * @param {String} [tag='latest'] An optional tag to apply to the container
     * image.
     */
    constructor(target = 'default', tag = 'latest') {
        if (
            typeof target !== 'undefined' &&
            (typeof target !== 'string' || target.length === 0)
        ) {
            throw new Error('Invalid target (arg #1)');
        }
        if (
            typeof tag !== 'undefined' &&
            (typeof tag !== 'string' || tag.length === 0)
        ) {
            throw new Error('Invalid tag (arg #2)');
        }
        super(
            // When specifying the container target, if it is not called default, this
            // will create a named task
            `publish-container${target === 'default' ? '' : '-' + target}`,
            `Publish container image for ${target || 'default'}:${
                tag || 'latest'
            }`
        );

        this._target = target;
        this._tag = tag;
    }

    /**
     * Generates a gulp task to execute automated tests
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

        const definition = project.getContainerDefinition(this._target);

        const tagTask = () =>
            _execa('docker', ['tag', `${definition.name}:${this._tag}`], {
                stdio: 'inherit',
            });
        const pushTask = () =>
            _execa('docker', ['push', `${definition.name}:${this._tag}`], {
                stdio: 'inherit',
            });

        const task = _gulp.series([tagTask, pushTask]);
        return task;
    }
}
