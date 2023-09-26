'use strict';

import TaskBuilder from '../task-builder.js';
import { Project } from '../project.js';
import { execa as _execa } from 'execa';
import { config as _dotenvConfig } from 'dotenv';
import _dotenvExpand from 'dotenv-expand';

/**
 * Builder function that can be used to generate a gulp task to publish a CDK
 * project to AWS.
 */
export class PublishAwsTaskBuilder extends TaskBuilder {
    /**
     * Creates a new task builder.
     *
     * @param {String} target The name of the CDK stack target
     * @param {String} environment The name of the environment to use for
     * sourcing environment variables.
     * @param {Boolean} requireApproval A flag that indicates whether or not the
     * publish task requires interactive approval from the user.
     */
    constructor(target, environment, requireApproval) {
        if (typeof target !== 'string' || target.length === 0) {
            throw new Error('Invalid target (arg #1)');
        }
        if (typeof environment !== 'string' || environment.length === 0) {
            throw new Error('Invalid environment (arg #2)');
        }
        if (typeof requireApproval !== 'boolean') {
            throw new Error('Invalid requireApproval (arg #3)');
        }
        super('publish-aws', `Publish a CDK project to AWS`);

        this._target = target;
        this._environment = environment;
        this._requireApproval = requireApproval;
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

        const definition = project.getCdkStackDefinition(this._target);
        const infraDir = project.rootDir.getChild('infra');
        const jsDir =
            project.language === 'js'
                ? project.rootDir
                : project.rootDir.getChild('working');

        const task = () => {
            [`.env.${this._environment}`, '.env']
                .map((envFile) => infraDir.getFileGlob(envFile))
                .forEach((envFile) => {
                    _dotenvExpand(_dotenvConfig(envFile));
                });

            const undefinedVars = project.getUndefinedEnvironmentVariables();
            if (undefinedVars.length > 0) {
                throw new Error(
                    `Missing required environment variables: [${undefinedVars.join(
                        ','
                    )}]`
                );
            }

            const cdkBin = 'cdk';
            const args = [
                'deploy',
                definition.name,
                '--app',
                jsDir.getChild('infra').getFilePath('index'),
            ];

            if (this._requireApproval) {
                args.splice(1, 0, '--require-approval=never');
            }

            _execa(cdkBin, args, {
                stdio: 'inherit',
                cwd: jsDir.absolutePath,
            });
        };
        return task;
    }

    /**
     * @override
     */
    getWatchPaths(project) {
        if (!(project instanceof Project)) {
            throw new Error('Invalid project (arg #1)');
        }
        return [];
    }
}
