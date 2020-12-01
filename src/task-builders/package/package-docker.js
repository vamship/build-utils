'use strict';

const _gulp = require('gulp');
const _execa = require('execa');
const _log = require('fancy-log');
const _mkdirp = require('mkdirp');

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
            buildFile,
            buildArgs,
            isDeprecated,
            isDefault,
        } = target;

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

        const buildArgs = [
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
            buildArgs.push('--build-arg');
            buildArgs.push(`${name}=${value}`);
        });

        buildArgs.push('.');

        const buildTask = () =>
            _execa(dockerBin, buildArgs, {
                stdio: 'inherit',
                cwd: jsRootDir.absolutePath,
            });
        buildTask.displayName = `package-build${suffix}`;
        buildTask.description = `Builds a docker image (${targetName}) based on the Dockerfile contained in the project`;

        const tasks = [buildTask];

        if (process.env.BUILD_EXPORT_DOCKER_IMAGE === 'true') {
            _log.info(`Docker export enabled.`);

            const distDir = rootDir.getChild('dist');
            const exportPath = repo
                .split('/')
                .reduce((result, item) => result.addChild(dir), distDir)
                .absolutePath;

            const ensureDirTask = () => {
                _log.info(`Ensuring that output path exists: ${exportPath}`);
                _mkdirp(exportPath);
            };
            ensureDirTask.displayName = `package-export${suffix}`;
            ensureDirTask.description = `Ensures that destination directory (${exportPath}) exists.`;
            tasks.push(ensureDirTask);

            const exportTask = () => {
                _log.info(
                    `Docker export enabled. File will be created at: ${exportPath}`
                );
                return _execa(dockerBin, [], {
                    stdio: 'inherit',
                    cwd: jsRootDir.absolutePath,
                });
            };
            exportTask.displayName = `package-export${suffix}`;
            ensureDirTask.description = `Exports a zip file that represents the docker image`;
            tasks.push(exportTask);
        }

        const task = _gulp.series(tasks);

        task.displayName = `package${suffix}`;
        task.description = `Builds a docker image (${targetName}) based on the Dockerfile contained in the project`;

        return task;
    });

    return tasks;
};
