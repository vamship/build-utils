import TaskFactory from '../task-factory.js';

import { CleanTaskBuilder } from '../task-builders/clean-task-builder.js';
import { FormatTaskBuilder } from '../task-builders/format-task-builder.js';
import { LintTaskBuilder } from '../task-builders/lint-task-builder.js';
import { LintFixTaskBuilder } from '../task-builders/lint-fix-task-builder.js';
import { BuildTaskBuilder } from '../task-builders/build-task-builder.js';
import { PackageTaskBuilder } from '../task-builders/package-task-builder.js';
import { PublishTaskBuilder } from '../task-builders/publish-task-builder.js';
import { DocsTaskBuilder } from '../task-builders/docs-task-builder.js';

/**
 * Represents a factory that generates a set of build tasks for a given project
 * type. This is an abstract class that must be extended to provide a list of
 * task builders for a given project type.
 */
export class ContainerTaskFactory extends TaskFactory {
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
        if (type !== 'container') {
            return [];
        }

        return [
            new CleanTaskBuilder(),
            new FormatTaskBuilder(),
            new LintTaskBuilder(),
            new LintFixTaskBuilder(),

            new DocsTaskBuilder(this._project),
            new PackageTaskBuilder(this._project),
            new PublishTaskBuilder(this._project),
        ];
    }
}
