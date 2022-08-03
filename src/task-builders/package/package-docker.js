'use strict';

import _gulp from 'gulp';
import _log from 'fancy-log';
import _mkdirp from 'mkdirp';
import { execa as _execa } from 'execa';

/**
 * Sub builder that builds a docker image based on a predefined dockerfile.
 *
 * @private
 * @param {Object} project Reference to an object that contains project metadata
 *        that can be used to customize build outputs.
 * @param {Object} options An options object that can be used to customize the
 *        task.
 *
 * @returns {Function} A gulp task.
 */
export default (project, options) => {
    const {
        unscopedName,
        version,
        description,
        configFileName,
        jsRootDir,
        rootDir,
    } = project;

    const dockerBin = 'docker';

    const tasks = project.getDockerTargets().map((target) => {
        const { name, buildFile, buildArgs, isDeprecated, isDefault } = target;

        const suffix = isDefault ? '' : `-${name}`;
        const targetName = isDefault ? '' : name;

        let repo = target.repo;
        if (typeof process.env.BUILD_DOCKER_REPO !== 'undefined') {
            repo = process.env.BUILD_DOCKER_REPO;
            _log.warn(`Docker repo override specified: [${repo}]`);
        }

        if (isDeprecated) {
            _log.warn(
                '[WARNING] Docker package task configuration is deprecated. Please upgrade to the newer format'
            );
            _log.warn(
                '[WARNING] See: https://github.com/vamship/build-utils#upgrading-to-v03x for more information'
            );
        }

        const buildTaskArgs = [
            'build',
            '--rm',
            '--file',
            buildFile,
            '--tag',
            `${repo}:latest`,
            '--build-arg',
            `APP_NAME=${unscopedName}`,
            '--build-arg',
            `APP_VERSION=${version}`,
            '--build-arg',
            `APP_DESCRIPTION='${description}'`,
            '--build-arg',
            `CONFIG_FILE_NAME=${configFileName}`,
            '--build-arg',
            `BUILD_TIMESTAMP=${Date.now()}`,
        ];

        project.validateRequiredEnv();
        buildArgs.forEach(({ name, value }) => {
            buildTaskArgs.push('--build-arg');
            buildTaskArgs.push(`${name}=${value}`);
        });

        buildTaskArgs.push('.');

        const buildTask = () =>
            _execa(dockerBin, buildTaskArgs, {
                stdio: 'inherit',
                cwd: jsRootDir.absolutePath,
            });
        buildTask.displayName = `package-build${suffix}`;
        buildTask.description = `Builds a docker image (${targetName}) based on the Dockerfile contained in the project`;

        const tasks = [buildTask];

        if (process.env.BUILD_EXPORT_DOCKER_IMAGE === 'true') {
            _log.warn(`Docker save image enabled.`);

            const distDir = rootDir.getChild('dist');
            const savePath = distDir.getFilePath(`image${suffix}.tar`);

            const ensureDirTask = () => {
                _log.info(
                    `Ensuring that output path exists: ${distDir.absolutePath}`
                );
                return _mkdirp(distDir.absolutePath);
            };
            ensureDirTask.displayName = `package-save${suffix}`;
            ensureDirTask.description = `Ensures that destination directory (${savePath}) exists.`;
            tasks.push(ensureDirTask);

            const saveTask = () => {
                _log.info(
                    `Docker save enabled. File will be created at: ${savePath}`
                );
                return _execa(dockerBin, ['save', '--output', savePath, repo], {
                    stdio: 'inherit',
                    cwd: jsRootDir.absolutePath,
                });
            };
            saveTask.displayName = `package-save${suffix}`;
            ensureDirTask.description = `Saves a tar file that represents the docker image`;
            tasks.push(saveTask);
        }

        const task = _gulp.series(tasks);

        task.displayName = `package${suffix}`;
        task.description = `Builds a docker image (${targetName}) based on the Dockerfile contained in the project`;

        return task;
    });

    return tasks;
};
