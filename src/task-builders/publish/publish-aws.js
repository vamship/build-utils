'use strict';

const _gulp = require('gulp');
const _zip = require('gulp-zip');
const _execa = require('execa');

/**
 * Sub builder that packages an aws-microservice project for deployment. This
 * follows the build steps described for
 * [lambda deployments](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-create-deployment-pkg.html#nodejs-package-dependencies)
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
    const { name, version, rootDir } = project;
    const infraDir = rootDir.getChild('infra');
    const workingDir = rootDir.getChild('working');

    const packageName = `${name.replace(/\//g, '-')}-${version}.zip`;

    const cdkBin = 'cdk';

    const tasks = project.getCdkStacks().map((key) => {
        const envFiles = [
            infraDir.getFileGlob(`.env.${process.env.INFRA_ENV}`),
            infraDir.getFileGlob('.env'),
        ];

        const args = [
            'deploy',
            project.getCdkStackName(key),
            '--app',
            `"node ${workingDir.getFileGlob('infra/index')}"`,
        ];

        if(!process.env.INFRA_NO_PROMPT) {
            args.push('--require-approval never');
        }

        const task = () => {
            project.initEnv(envFiles);
            project.validateRequiredEnv();

            return _execa(cdkBin, args, {
                stdio: 'inherit',
            });
        };

        task.displayName = `publish-${key}`;
        task.description = `Publishes the ${key} stack to AWS using CDK`;

        return task;
    });

    return tasks;
};
