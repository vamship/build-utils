'use strict';

import TaskBuilder from '../task-builder.js';
import { Project } from '../project.js';
import { execa as _execa } from 'execa';

/**
 * Builder function that can be used to generate a gulp task to publish an
 * already packaged project to an NPM registry.
 */
export class PublishNpmTaskBuilder extends TaskBuilder {
    /**
     * Creates a new task builder.
     */
    constructor() {
        super('publish-npm', `Publish a project to an NPM registry`);
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

        const packageName = `${project.kebabCasedName}-${project.version}.tgz`;
        const distDir = project.rootDir.getChild('dist');

        const npmBin = 'npm';
        const task = () =>
            _execa(npmBin, ['publish', packageName], {
                stdio: 'inherit',
                cwd: distDir.absolutePath,
            });

        return task;
    }
}
