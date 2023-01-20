'use strict';

import { Project } from '../../src/project.js';

const ALL_BUT_OBJECT = [undefined, null, 123, 'abc', true, () => undefined];

describe('[Project]', () => {
    function _createPackageConfig() {
        return {
            name: '@test/dummy-package',
            description: 'Dummy package for testing',
            license: 'test-license',
            keywords: ['test', 'package', 'foo'],
            version: '1.0.0-0',
            buildMetadata: {
                projectType: 'lib',
                language: 'ts',
                requiredEnv: ['ENV_1', 'ENV_2'],
                aws: {
                    stacks: {
                        mystack: 'foo',
                    },
                },
                staticFilePatterns: ['foo'],
                docker: {},
            },
        };
    }

    // function _createBuildPropsResults(metadata) {
    //     const { projectType, language, exportedTypes, staticFilePatterns } = metadata;
    //     return {
    //         projectType,
    //         language,
    //         exportedTypes
    //     };
    // }

    // const buildTypes = [ {
    //     projectType: 'lib',
    //     language: 'ts'
    //             exportedTypes: 'types'
    // }, {
    //     projectType: 'lib',
    //     language: 'ts'
    //             exportedTypes: 'types'

    // } ]

    describe('ctor()', () => {
        it('should throw an error if invoked without a valid package config', () => {
            const error = 'Invalid packageConfig (arg #1)';
            const inputs = [null, undefined, 123, true, 'test', [], () => {}];

            inputs.forEach((tree) => {
                const wrapper = () => new Project(tree);
                expect(wrapper).toThrow(error);
            });
        });

        it('should initialize basic object properties using parameters from package.json', () => {
            const packageConfig = _createPackageConfig();
            const { buildMetadata } = packageConfig;
            const instance = new Project(packageConfig);

            expect(instance.name).toEqual(packageConfig.name);
            expect(instance.description).toEqual(packageConfig.description);
            expect(instance.version).toEqual(packageConfig.version);
            expect(instance.license).toEqual(packageConfig.license);
            expect(instance.keywords).toEqual(packageConfig.keywords);
            expect(instance.unscopedName).toEqual('dummy-package');
            expect(instance.kebabCasedName).toEqual('test-dummy-package');

            expect(instance.projectType).toEqual(buildMetadata.projectType);
            expect(instance.language).toEqual(buildMetadata.language);
            expect(instance.requiredEnv).toEqual(buildMetadata.getRequiredEnv);
            expect(instance.staticFilePatterns).toEqual(
                buildMetadata.staticFilePatterns
            );

            expect(instance.awsRegion).toEqual(undefined);
            expect(instance.awsProfile).toEqual(undefined);
            expect(instance.getCdkStacks()).toEqual([]);
            expect(instance.docker).toBe(undefined);
        });

        it('should override build properties if build metadata is specified', () => {
            const packageConfig = _createPackageConfig();
            const buildMetadata = {
                projectType: 'api',
                language: 'js',
                requiredEnv: ['ENV_3', 'ENV_4'],
                aws: {},
                staticFilePatterns: ['bar'],
                docker: undefined,
            };
            const instance = new Project(packageConfig, buildMetadata);

            expect(instance.projectType).toEqual(buildMetadata.projectType);
            expect(instance.language).toEqual(buildMetadata.language);
            expect(instance.getRequiredEnv()).toEqual(
                buildMetadata.requiredEnv
            );
            expect(instance.staticFilePatterns).toEqual(
                buildMetadata.staticFilePatterns
            );

            expect(instance.awsRegion).toEqual(undefined);
            expect(instance.awsProfile).toEqual(undefined);
            expect(instance.getCdkStacks()).toEqual([]);
            expect(instance.docker).toBe(undefined);
        });
    });

    describe('[build properties]', () => {
        describe('[projectType]', () => {
            [
                null,
                undefined,
                123,
                true,
                {},
                [],
                () => {},
                'foo',
                'bar',
            ].forEach((projectType) => {
                it(`should throw an error if the specified project type is not supported (value=${projectType})`, () => {
                    const error = `Invalid projectType (buildMetadata.projectType).\n\tMust be one of: [lib,cli,api,aws-microservice,container,ui]`;
                    const packageConfig = _createPackageConfig();
                    packageConfig.buildMetadata.projectType = projectType;

                    const wrapper = () => new Project(packageConfig);
                    expect(wrapper).toThrow(error);
                });
            });

            ['lib', 'cli', 'aws-microservice', 'container', 'ui'].forEach(
                (projectType) => {
                    it(`should set the project type to the value specified in the configuration (value=${projectType})`, () => {
                        const packageConfig = _createPackageConfig();
                        packageConfig.buildMetadata.projectType = projectType;

                        const instance = new Project(packageConfig);
                        expect(instance.projectType).toEqual(projectType);
                        expect(instance.hasServer).toBe(false);
                    });
                }
            );

            ['api'].forEach((projectType) => {
                it(`should set the project type to the value specified in the configuration (value=${projectType})`, () => {
                    const packageConfig = _createPackageConfig();
                    packageConfig.buildMetadata.projectType = projectType;

                    const instance = new Project(packageConfig);
                    expect(instance.projectType).toEqual(projectType);
                    expect(instance.hasServer).toBe(true);
                });
            });
        });

        describe('[language]', () => {
            [
                null,
                undefined,
                123,
                true,
                {},
                [],
                () => {},
                'foo',
                'bar',
            ].forEach((language) => {
                it(`should throw an error if the specified language is not supported (value=${language})`, () => {
                    const error = `Invalid language (buildMetadata.language).\n\tMust be one of: [js,ts]`;
                    const packageConfig = _createPackageConfig();
                    packageConfig.buildMetadata.language = language;
                    const wrapper = () => new Project(packageConfig);
                    expect(wrapper).toThrow(error);
                });
            });

            ['js'].forEach((language) => {
                it(`should set the language to the value specified in the configuration (value=${language})`, () => {
                    const packageConfig = _createPackageConfig();
                    packageConfig.buildMetadata.language = language;

                    const instance = new Project(packageConfig);
                    expect(instance.language).toEqual(language);
                    expect(instance.hasTypescript).toBe(false);
                });
            });

            ['ts'].forEach((language) => {
                it(`should set the language to the value specified in the configuration (value=${language})`, () => {
                    const packageConfig = _createPackageConfig();
                    packageConfig.buildMetadata.language = language;

                    const instance = new Project(packageConfig);
                    expect(instance.language).toEqual(language);
                    expect(instance.hasTypescript).toBe(true);
                });
            });
        });

        describe('[requiredEnv]', () => {
            [null, undefined, 'bar', 123, true, {}, () => {}].forEach(
                (requiredEnv) => {
                    it(`should ignore the requiredEnv property if a valid array is not specified (value=${requiredEnv})`, () => {
                        const packageConfig = _createPackageConfig();
                        packageConfig.buildMetadata.requiredEnv = requiredEnv;

                        const instance = new Project(packageConfig);
                        expect(instance.getRequiredEnv()).toEqual([]);
                    });
                }
            );

            [
                ['FOO', 'BAR'],
                ['BAZ', 'CHAZ'],
            ].forEach((requiredEnv) => {
                it(`should set the requiredEnv property to the value specified in the configuration (value=${requiredEnv})`, () => {
                    const packageConfig = _createPackageConfig();
                    packageConfig.buildMetadata.requiredEnv = requiredEnv;

                    const instance = new Project(packageConfig);
                    expect(instance.getRequiredEnv()).toEqual(requiredEnv);
                });
            });
        });

        describe('[staticFilePatterns]', () => {
            [null, undefined, 'bar', 123, true, {}, () => {}].forEach(
                (staticFilePatterns) => {
                    it(`should ignore the staticFilePatterns property if a valid array is not specified (value=${staticFilePatterns})`, () => {
                        const packageConfig = _createPackageConfig();
                        packageConfig.buildMetadata.staticFilePatterns =
                            staticFilePatterns;

                        const instance = new Project(packageConfig);
                        expect(instance.staticFilePatterns).toEqual([]);
                    });
                }
            );

            [
                ['FOO', 'BAR'],
                ['BAZ', 'CHAZ'],
            ].forEach((staticFilePatterns) => {
                it(`should set the staticFilePatterns property to the value specified in the configuration (value=${staticFilePatterns})`, () => {
                    const packageConfig = _createPackageConfig();
                    packageConfig.buildMetadata.staticFilePatterns =
                        staticFilePatterns;

                    const instance = new Project(packageConfig);
                    expect(instance.staticFilePatterns).toEqual(
                        staticFilePatterns
                    );
                });
            });
        });

        describe('[aws properties]', () => {
            ['lib', 'cli', 'container', 'ui'].forEach((projectType) => {
                it(`should set AWS properties to default for unsupported project types (value=${projectType})`, () => {
                    const packageConfig = _createPackageConfig();
                    packageConfig.buildMetadata.projectType = projectType;

                    const instance = new Project(packageConfig);
                    expect(instance.getCdkStacks()).toEqual([]);
                });
            });

            ['aws-microservice'].forEach((projectType) => {
                ALL_BUT_OBJECT.forEach((aws) => {
                    it(`should throw an error for project type (${projectType}) if aws config (${aws}) is invalid`, () => {
                        const packageConfig = _createPackageConfig();
                        packageConfig.buildMetadata.projectType = projectType;
                        packageConfig.buildMetadata.aws = undefined;

                        const error = `The project does not define AWS configuration, but the project type requires it (type=${projectType})`;

                        const wrapper = () => new Project(packageConfig);
                        expect(wrapper).toThrow(error);
                    });
                });

                ALL_BUT_OBJECT.forEach((stacks) => {
                    it(`should throw an error for project type (${projectType}) if aws stacks (${stacks}) are invalid`, () => {
                        const packageConfig = _createPackageConfig();
                        packageConfig.buildMetadata.projectType = projectType;
                        packageConfig.buildMetadata.aws = { stacks };

                        const error = `The project does not define AWS stacks, but the project type requires it (type=${projectType})`;

                        const wrapper = () => new Project(packageConfig);
                        expect(wrapper).toThrow(error);
                    });
                });

                it(`should throw an error for project type (${projectType}) if no aws stacks are defined`, () => {
                    const packageConfig = _createPackageConfig();
                    packageConfig.buildMetadata.projectType = projectType;
                    packageConfig.buildMetadata.aws = { stacks: {} };

                    const error = `The project does not define AWS stacks, but the project type requires it (type=${projectType})`;

                    const wrapper = () => new Project(packageConfig);
                    expect(wrapper).toThrow(error);
                });
            });
        });

        describe('[docker properties]', () => {
            ['lib', 'aws-microservice'].forEach((projectType) => {
                it(`should not initialize docker properties for project types (${projectType}) that do not support them`, () => {
                    const packageConfig = _createPackageConfig();
                    packageConfig.buildMetadata.projectType = projectType;

                    const instance = new Project(packageConfig);
                    expect(instance.hasDocker).toEqual(false);
                    expect(instance.getDockerTargets()).toEqual([]);
                });
            });

            ['cli', 'api', 'ui'].forEach((projectType) => {
                ALL_BUT_OBJECT.forEach((dockerConfig) => {
                    it(`should not initialize docker for project type (${projectType}) if docker config (${dockerConfig}) is invalid`, () => {
                        const packageConfig = _createPackageConfig();
                        packageConfig.buildMetadata.projectType = projectType;
                        packageConfig.buildMetadata.docker = dockerConfig;

                        const instance = new Project(packageConfig);
                        expect(instance.hasDocker).toEqual(false);
                        expect(instance.getDockerTargets()).toEqual([]);
                    });
                });
            });

            ['container'].forEach((projectType) => {
                ALL_BUT_OBJECT.forEach((dockerConfig) => {
                    it(`should throw an error if docker config (${dockerConfig}) is invalid for project types that require it`, () => {
                        const packageConfig = _createPackageConfig();
                        packageConfig.buildMetadata.projectType = projectType;
                        packageConfig.buildMetadata.docker = dockerConfig;

                        const error = `The project does not define docker configuration, but the project type requires it (type=${projectType})`;

                        const wrapper = () => new Project(packageConfig);
                        expect(wrapper).toThrow(error);
                    });
                });
            });
        });
    });
});