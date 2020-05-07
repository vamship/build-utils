'use strict';

const _gulp = require('gulp');
const _execa = require('execa');
const _log = require('fancy-log');

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
module.exports = (project, options) => {
    const {
        unscopedName,
        version,
        description,
        configFileName,
        jsRootDir,
    } = project;

    const dockerBin = 'docker';

    const tasks = project.getDockerTargets().map((target) => {
        const {
            name,
            repo,
            buildFile,
            buildArgs,
            isDeprecated,
            isDefault,
        } = target;

        const suffix = isDefault ? '' : `-${name}`;
        const targetName = isDefault ? '' : name;

        if (isDeprecated) {
            _log.warn(
                '[WARNING] Docker package task configuration is deprecated. Please upgrade to the newer format'
            );
            _log.warn(
                '[WARNING] See: https://github.com/vamship/build-utils#upgrading-to-v03x for more information'
            );
        }

        const args = [
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
        target.buildArgs.forEach(({ name, value }) => {
            args.push('--build-arg');
            args.push(`${name}=${value}`);
        });

        args.push('.');
        const task = () =>
            _execa(dockerBin, args, {
                stdio: 'inherit',
                cwd: jsRootDir.absolutePath,
            });

        task.displayName = `package${suffix}`;
        task.description = `Builds a docker image (${targetName}) based on the Dockerfile contained in the project`;

        return task;
    });

    return tasks;
};
