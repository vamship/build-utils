'use strict';

import TaskBuilder from '../task-builder.js';
import { Project } from '../project.js';
import { execa as _execa } from 'execa';

/**
 * Builder function that can be used to generate a gulp task to package a
 * container project for publishing to a container registry.
 */
export class PackageContainerTaskBuilder extends TaskBuilder {
    /**
     * Creates a new task builder.
     *
     * @param {String} target The name of the container build target
     * @param {String} [repo=undefined] The name of the container repo
     */
    constructor(target, repo) {
        if (typeof target !== 'string' || target.length === 0) {
            throw new Error('Invalid target (arg #1)');
        }
        if (
            typeof repo !== 'undefined' &&
            (typeof repo !== 'string' || repo.length === 0)
        ) {
            throw new Error('Invalid repo (arg #2)');
        }

        super(
            'package-container',
            `Package a project for publishing to a container registry`
        );
        this._target = target;
        this._repo = repo;
    }

    /**
     * Generates a gulp task to package a container image
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

        const jsDir =
            project.language === 'js'
                ? project.rootDir
                : project.rootDir.getChild('working');
        const definition = project.getContainerDefinition(this._target);

        const repo =
            typeof this._repo === 'undefined' ? definition.repo : this._repo;
        const buildFile = definition.buildFile;

        const dockerBin = 'docker';
        const args = [
            'build',
            '--rm',
            '--file',
            buildFile,
            '--tag',
            `${repo}:latest`,
            '--build-arg',
            `APP_NAME=${project.unscopedName}`,
            '--build-arg',
            `APP_VERSION=${project.version}`,
            '--build-arg',
            `APP_DESCRIPTION='${project.description}'`,
            '--build-arg',
            `CONFIG_FILE_NAME=${project.configFileName}`,
            '--build-arg',
            `BUILD_TIMESTAMP=${Date.now()}`,
        ];
        const task = () =>
            _execa(dockerBin, args, {
                stdio: 'inherit',
                cwd: jsDir.absolutePath,
            });
        return task;
    }
}