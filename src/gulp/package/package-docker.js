'use strict';

const _gulp = require('gulp');
const _execa = require('execa');

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
        hasPrivateNpm,
        rootDir
    } = project;

    const packageTask = () => {
        const dockerBin = 'docker';

        const args = [
            'build',
            '--rm',
            '--tag',
            `${project.dockerRepo}:latest`,
            '--build-arg',
            `APP_NAME=${unscopedName}`,
            '--build-arg',
            `APP_VERSION=${version}`,
            '--build-arg',
            `APP_DESCRIPTION=${description}`,
            '--build-arg',
            `CONFIG_FILE_NAME=${configFileName}`,
            '--build-arg',
            `BUILD_TIMESTAMP=${Date.now()}`
        ];

        if (hasPrivateNpm) {
            project.validatePrivateNpmParams();
            project.getPrivateNpmParams().forEach((param) => {
                args.push('--build-arg');
                args.push(`${param}=${process.env[param]}`);
            });
        }

        args.push('.');

        return _execa(dockerBin, args, {
            stdio: 'inherit',
            cwd: rootDir.getChild('working').absolutePath
        });
    };

    packageTask.taskName = 'package-docker';
    packageTask.description =
        'Builds a docker image based on the Dockerfile contained in the project';

    return packageTask;
};
