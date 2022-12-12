import semver from 'semver';
import _gulp from 'gulp';
import Ajv from 'ajv';

import _projectDataSchema from './schema/project-definition.js';

const _validateProjectData = new Ajv().compile(_projectDataSchema);

/**
 * Represents a build project that encapsulates one or more relavent build
 * tasks.
 */
export default class Project {
    /**
     * Creates a new project based on the specified build metadata.
     *
     * @param {Object} projectDefinition An object that contains the project
     * definition.
     */
    constructor(projectDefinition) {
        if (
            !projectDefinition ||
            projectDefinition instanceof Array ||
            typeof projectDefinition !== 'object'
        ) {
            throw new Error('Invalid project definition (arg #1)');
        }

        if (!_validateProjectData(projectDefinition)) {
            const { instancePath, message } = _validateProjectData.errors[0];
            throw new Error(
                `Schema validation failed [${instancePath
                    .replace(/\//g, '.')
                    .trim()} ${message}]`
            );
        }

        const {
            name,
            version,
            buildMetadata: {
                type,
                language,
                requiredEnv,
                staticFilePatterns,
                aws,
                container,
            },
        } = projectDefinition;

        if (!semver.valid(version)) {
            throw new Error(
                `Schema validation failed [.version is not a valid semantic version]`
            );
        }

        if (aws && aws.stacks && Object.keys(aws.stacks).length <= 0) {
            throw new Error(`No AWS stacks defined`);
        }

        if (container && Object.keys(container).length <= 0) {
            throw new Error(`No container builds defined`);
        }

        this._name = name;
        this._version = version;
        this._type = type;
        this._language = language;
        this._staticFilePatterns = staticFilePatterns || [];
        this._requiredEnv = requiredEnv;
        this._cdkStacks = aws.stacks;
        this._containerTargets = container;
        // this._taskBuilder = {};
    }

    /**
     * Gets the name of the project.
     *
     * @returns {String} The project name.
     */
    get name() {
        return this._name;
    }

    /**
     * Gets the version of the project.
     *
     * @returns {String} The project version.
     */
    get version() {
        return this._version;
    }

    /**
     * Gets the type of the project.
     *
     * @returns {String} The project type.
     */
    get type() {
        return this._type;
    }

    /**
     * Gets the language of the project.
     *
     * @returns {String} The project language.
     */
    get language() {
        return this._language;
    }

    /**
     * Returns a list of static file patterns configured for the project.
     *
     * @returns {Array} An array of glob strings used to identify static files
     * copied over during a build.
     */
    getStaticFilePatterns() {
        return this._staticFilePatterns.concat([]);
    }

    // /**
    //  * Returns a list of environment variables that must be defined for the
    //  * build.
    //  *
    //  * @returns {Array} An array of environment variable names.
    //  */
    // get requiredEnv() {
    //     return this._requiredEnv;
    // }

    // /**
    //  * Returns a list of CDK stack keys defined for the project. These stack
    //  * keys will be used to generate deploy tasks for each. Each key maps to a
    //  * specific CDK stack that can be deployed.
    //  *
    //  * @return {Array} A list of stack keys
    //  */
    // get cdkStacks() {
    //     return this._aws;
    // }

    /**
     * Initializes tasks and associates them with the specified Gulp instance.
     *
     * @param {Object} gulp A reference to a gulp instance.
     */
    createTasks(gulp) {
        if (!gulp || gulp instanceof Array || typeof gulp !== 'object') {
            throw new Error('Invalid gulp instance (arg #1)');
        }
    }
}
