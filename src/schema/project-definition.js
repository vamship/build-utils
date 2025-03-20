/**
 * Defines the JSON schema for a project definition.
 */
export default {
    type: 'object',
    properties: {
        /**
         * Project name
         */
        name: { type: 'string', minLength: 1 },

        /**
         * Project description
         */
        description: { type: 'string', minLength: 1 },

        /**
         * Project version
         */
        version: { type: 'string', minLength: 1 },

        /**
         * Metadata used to configure project builds.
         */
        buildMetadata: {
            type: 'object',
            properties: {
                /**
                 * The project type - determines the build tasks that are
                 * generated.
                 */
                type: {
                    enum: [
                        'lib',
                        'api',
                        'cli',
                        'ui',
                        'container',
                        'aws-microservice',
                    ],
                },

                /**
                 * The programming language used for the project.
                 */
                language: { enum: ['js', 'ts'] },

                /**
                 * AWS configuration - cloud formation stacks, etc.
                 */
                aws: {
                    type: 'object',
                    properties: {
                        stacks: {
                            type: 'object',
                            /**
                             * Individual stack names.
                             */
                            patternProperties: {
                                '^[a-zA-Z0-9-_]+$': {
                                    type: 'string',
                                    minLength: 1,
                                },
                            },
                            additionalProperties: false,
                        },
                    },
                    additionalProperties: false,
                    required: ['stacks'],
                },

                /**
                 * Container configuration - image builds, etc.
                 */
                container: {
                    type: 'object',
                    /**
                     * Container build configurations.
                     */
                    patternProperties: {
                        '^[a-zA-Z0-9-_]+$': {
                            type: 'object',
                            properties: {
                                /**
                                 * Name of the repository that houses the
                                 * container image.
                                 */
                                repo: { type: 'string', minLength: 1 },

                                /**
                                 * The file containing build instructions.
                                 */
                                buildFile: { type: 'string', minLength: 1 },

                                /**
                                 * Collection of arguments passed to the
                                 * container build.
                                 */
                                buildArgs: {
                                    type: 'object',
                                    /**
                                     * Individual build arguments
                                     */
                                    patternProperties: {
                                        '^[a-zA-Z0-9-_]+$': {
                                            type: 'string',
                                            minLength: 1,
                                        },
                                    },
                                    additionalProperties: false,
                                },

                                /**
                                 * Collection of secrets passed to the
                                 * container build.
                                 */
                                buildSecrets: {
                                    type: 'object',
                                    /**
                                     * Individual build arguments
                                     */
                                    patternProperties: {
                                        '^[a-zA-Z0-9-_]+$': {
                                            type: 'object',
                                            properties: {
                                                type: {
                                                    type: 'string',
                                                    minLength: 1,
                                                },
                                                src: {
                                                    type: 'string',
                                                    minLength: 1,
                                                },
                                            },
                                            required: ['type', 'src'],
                                            additionalProperties: false,
                                        },
                                    },
                                    additionalProperties: false,
                                },
                            },
                            required: ['repo'],
                            additionalProperties: false,
                        },
                    },
                    required: ['default'],
                    additionalProperties: false,
                },

                /**
                 * Any environment variables that have to be defined for the
                 * build to succeed.
                 */
                requiredEnv: { type: 'array' },

                /**
                 * Any static files that should be copied over during the build
                 * process without any compilation/modification.
                 */
                staticFilePatterns: { type: 'array' },

                /**
                 * Any static directories that should be copied over during the build
                 * process without any compilation/modification.
                 */
                staticDirs: { type: 'array' },
            },
            required: ['type', 'language'],
        },
    },
    required: ['name', 'description', 'version', 'buildMetadata'],
};
