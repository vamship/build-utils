'use strict';

import _gulp from 'gulp';

import TaskBuilder from '../task-builder.js';
import { Project } from '../project.js';

/**
 * Builder that can be used to generate a gulp task to copy project files from
 * source to build directories.
 */
export class CopyFilesTaskBuilder extends TaskBuilder {
    /**
     * Creates a new task builder.
     */
    constructor() {
        super(
            'copy-files',
            'Copies project files from source to build directories',
        );
    }

    /**
     * Generates a gulp task to copy common files from source to build
     * directories.
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

        const { rootDir } = project;
        const dirs = ['src', 'test', 'scripts', '_scripts'];
        const extensions = ['json'].concat(project.getStaticFilePatterns());
        const containerBuildFiles = project
            .getContainerTargets()
            .map(
                (target) =>
                    project.getContainerDefinition(target).buildFile ||
                    'Dockerfile',
            );

        if (project.type === 'aws-microservice') {
            dirs.push('infra');
        }

        const extras = [
            project.configFileName,
            'package-lock.json',
            'package.json',
            'LICENSE',
            'README.md',
            'nginx.conf',
            '.env',
            '.npmignore',
            '.npmrc',
        ].concat(containerBuildFiles);

        const paths = dirs
            .map((dir) => rootDir.getChild(dir))
            .filter((dir) => dir.exists())
            .map((dir) => extensions.map((ext) => dir.getAllFilesGlob(ext)))
            .reduce((result, arr) => result.concat(arr), [])
            .concat(extras.map((item) => rootDir.getFileGlob(item)));

        const task = () =>
            _gulp
                .src(paths, {
                    allowEmpty: true,
                    base: rootDir.globPath,
                })
                .pipe(_gulp.dest(rootDir.getChild('working').absolutePath));

        return task;
    }
}
