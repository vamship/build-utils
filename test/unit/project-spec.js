'use strict';

import { Project } from '../../src/project.js';

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
                exportedTypes: 'types',
                requiredEnv: ['ENV_1', 'ENV_2'],
                aws: {
                    stacks: {},
                },
                staticFilePatterns: ['foo'],
                docker: undefined,
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
            expect(instance.exportedTypes).toEqual(buildMetadata.exportedTypes);
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
                exportedTypes: 'types1',
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
            expect(instance.exportedTypes).toEqual(buildMetadata.exportedTypes);
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

        describe('[exportedTypes]', () => {
            [null, undefined, 123, true, {}, [], () => {}, ''].forEach(
                (exportedTypes) => {
                    it(`should set the hasExportedTypes to false if a valid exportedTypes field is not specified (value=${exportedTypes})`, () => {
                        const packageConfig = _createPackageConfig();
                        packageConfig.buildMetadata.exportedTypes =
                            exportedTypes;

                        const instance = new Project(packageConfig);
                        expect(instance.exportedTypes).toEqual('');
                        expect(instance.hasExportedTypes).toBe(false);
                    });
                }
            );

            ['types-1', 'types-2', 'types-3'].forEach((exportedTypes) => {
                it(`should set the hasExportedTypes property to true if a valid exportedTypes field is specified (value=${exportedTypes})`, () => {
                    const packageConfig = _createPackageConfig();
                    packageConfig.buildMetadata.exportedTypes = exportedTypes;

                    const instance = new Project(packageConfig);
                    expect(instance.exportedTypes).toEqual(exportedTypes);
                    expect(instance.hasExportedTypes).toBe(true);
                });
            });
        });
    });
});
