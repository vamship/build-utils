import _path from 'path';
import _gulp from 'gulp';
import _gulpTypedoc from 'gulp-typedoc';

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
        const docsDir = rootDir.getChild('docs');

        const dirs = ['src'];
        const extensions = ['ts'];
        const options = {
            name: `${project.name} Documentation`,
            disableOutputCheck: true,
            readme: rootDir.getFilePath('README.md'),
            out: docsDir.getFilePath(`${name}${_path.sep}${version}`),
        };

        const paths = dirs
            .map((dir) => project.rootDir.getChild(dir))
            .map((dir) => extensions.map((ext) => dir.getAllFilesGlob(ext)))
            .reduce((result, arr) => result.concat(arr), []);

        const task = () =>
            _gulp
                .src(paths, {
                    allowEmpty: true,
                    base: project.rootDir.globPath,
                })
                .pipe(_gulpTypedoc(options));
        return task;
    }
}
