import TaskFactory from '../task-factory.js';

import { CleanTaskBuilder } from '../task-builders/clean-task-builder.js';
import { FormatTaskBuilder } from '../task-builders/format-task-builder.js';
import { LintTaskBuilder } from '../task-builders/lint-task-builder.js';
import { LintFixTaskBuilder } from '../task-builders/lint-fix-task-builder.js';
import { BuildTaskBuilder } from '../task-builders/build-task-builder.js';
import { PackageTaskBuilder } from '../task-builders/package-task-builder.js';
import { PublishTaskBuilder } from '../task-builders/publish-task-builder.js';
import { DocsTaskBuilder } from '../task-builders/docs-task-builder.js';
import { PackageContainerTaskBuilder } from '../task-builders/package-container-task-builder.js';
import { PublishContainerTaskBuilder } from '../task-builders/publish-container-task-builder.js';

/**
 * Represents a factory that generates a set of build tasks for an api type project
 */
export class ApiTaskFactory extends TaskFactory {
    /**
     * Creates a new instance of TaskFactory, initialized for a given project.
     * @param {Project} project The project to generate build tasks for.
     */
    constructor(project) {
        super(project);
    }

    /**
     * Protected abstract method that can be overridden to provide the
     * necessary tasks for a given project type.
     *
     * @returns {Array} An array of task builders.
     */
    _createTaskBuilders() {
        const { type } = this._project;
        if (type !== 'api') {
            return [];
        }

        const additionalTasks = [];
        const containerTargets = this._project.getContainerTargets();

        // > 1 since default container
        if (containerTargets.length > 1) {
            containerTargets
                .filter((x) => x !== 'default')
                .forEach((target) => {
                    const specificTargetTasks = [
                        new PackageContainerTaskBuilder(target),
                        new PublishContainerTaskBuilder(target),
                    ];
                    additionalTasks.push(...specificTargetTasks);
                });
        }

        return [
            new CleanTaskBuilder(),
            new FormatTaskBuilder(),
            new LintTaskBuilder(),
            new LintFixTaskBuilder(),

            new DocsTaskBuilder(this._project),
            new BuildTaskBuilder(this._project),
            new PackageTaskBuilder(this._project),
            new PublishTaskBuilder(this._project),
        ].concat(additionalTasks);
    }
}
