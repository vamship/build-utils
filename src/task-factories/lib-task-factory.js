import { Project } from '../project.js';
import TaskFactory from '../task-factory.js';

import { CleanTaskBuilder } from '../task-builders/clean-task-builder.js';
import { FormatTaskBuilder } from '../task-builders/format-task-builder.js';
import { LintTaskBuilder } from '../task-builders/lint-task-builder.js';
import { LintFixTaskBuilder } from '../task-builders/lint-fix-task-builder.js';
import { PackageNpmTaskBuilder } from '../task-builders/package-npm-task-builder.js';
import { PublishNpmTaskBuilder } from '../task-builders/publish-npm-task-builder.js';
import { BuildTaskBuilder } from '../task-builders/build-task-builder.js';

import { DocsJsTaskBuilder } from '../task-builders/docs-js-task-builder.js';
import { DocsTsTaskBuilder } from '../task-builders/docs-ts-task-builder.js';

/**
 * Represents a factory that generates a set of build tasks for a given project
 * type. This is an abstract class that must be extended to provide a list of
 * task builders for a given project type.
 */
export class LibTaskFactory extends TaskFactory {
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
        const { language, type } = this._project;
        if (type !== 'lib') {
            return [];
        }
        const additionalTasks =
            language === 'js'
                ? [new DocsJsTaskBuilder()]
                : [new DocsTsTaskBuilder()];

        return [
            new CleanTaskBuilder(),
            new FormatTaskBuilder(),
            new LintTaskBuilder(),
            new LintFixTaskBuilder(),

            new BuildTaskBuilder(this._project),
            new PackageNpmTaskBuilder(),
            new PublishNpmTaskBuilder(),
        ].concat(additionalTasks);
    }
}
