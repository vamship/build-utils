'use strict';

import TaskBuilder from '../task-builder.js';
import { Project } from '../project.js';
import { execa as _execa } from 'execa';

/**
 * Builder function that can be used to generate a gulp task to execute
 * instrumented web UI tests.
 */
export class TestUiTaskBuilder extends TaskBuilder {
    /**
     * Creates a new task builder.
     */
    constructor() {
        super('test-ui', `Execute web UI tests`);
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
        const jestBin = project.rootDir.getFilePath('node_modules/.bin/jest');
        const task = () =>
            _execa(jestBin, ['--config', 'jest.config.js', '--coverage'], {
                stdio: 'inherit',
            }).then(undefined, (err) => {
                /*
                 * Do nothing. This handler prevents the gulp task from
                 * crashing with an unhandled error.
                 */
            });
        return task;
    }

    /**
     * @override
     */
    getWatchPaths(project) {
        if (!(project instanceof Project)) {
            throw new Error('Invalid project (arg #1)');
        }
        const dirs = ['src', 'test', 'infra'];
        const exts = ['md', 'html', 'json', 'js', 'jsx', 'ts', 'tsx'];
        const rootDir =
            project.language === 'ts'
                ? project.rootDir.getChild('working')
                : project.rootDir;

        return dirs
            .map((dir) =>
                exts.map((ext) => rootDir.getChild(dir).getAllFilesGlob(ext)),
            )
            .flat();
    }
}
