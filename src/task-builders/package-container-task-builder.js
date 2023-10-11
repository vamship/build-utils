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
            // When specifying the container target, if it is not called default, this
            // will create a named task
            `package-container${target === 'default' ? '' : '-' + target}`,
            `Package a project for publishing to a container registry`,
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

        const undefinedVars = project.getUndefinedEnvironmentVariables();
        if (undefinedVars.length > 0) {
            throw new Error(
                `Missing required environment variables: [${undefinedVars.join(
                    ', ',
                )}]`,
            );
        }

        const jsDir =
            project.language === 'js'
                ? project.rootDir
                : project.rootDir.getChild('working');
        const definition = project.getContainerDefinition(this._target);

        const repo =
            typeof this._repo === 'undefined' ? definition.repo : this._repo;
        const { buildFile, buildArgs } = definition;

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

        Object.keys(buildArgs).forEach((key) => {
            args.push('--build-arg');
            args.push(`${key}=${buildArgs[key]}`);
        });

        args.push('.');

        const task = () =>
            _execa(dockerBin, args, {
                stdio: 'inherit',
                cwd: jsDir.absolutePath,
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
