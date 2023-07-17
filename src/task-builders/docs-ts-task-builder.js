import _path from 'path';
import { execa as _execa } from 'execa';

import TaskBuilder from '../task-builder.js';
import { Project } from '../project.js';

/**
 * Builder that can be used to generate a gulp task to generate documentation
 * from code comments in typescript files.
 */
export class DocsTsTaskBuilder extends TaskBuilder {
    /**
     * Creates a new task builder.
     */
    constructor() {
        super(
            'docs-ts',
            'Generates documentation from code comments in typescript files'
        );
    }

    /**
     * Generates a gulp task to generate documentation from code comments in
     * source code.
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

        const { rootDir, name, version } = project;
        const docsDir = rootDir.getChild('docs').getFilePath(project.version);
        const srcDir = rootDir.getChild('src');

        const task = () =>
            _execa(
                'typedoc',
                ['--out', docsDir, srcDir.absolutePath],
                {
                    stdio: 'inherit',
                }
            );
        return task;
    }
}
