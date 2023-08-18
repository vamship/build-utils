import _path from 'path';
import { expect } from 'chai';
import { Project } from '../../src/project.js';
import { Directory } from '../../src/directory.js';
import {
    getAllButString,
    getAllButObject,
    getAllButArray,
    makeOptional,
    createContainerObject,
} from '../utils/data-generator.js';
import { buildProjectDefinition } from '../utils/object-builder.js';

describe('[Project]', () => {
    describe('ctor()', () => {
        getAllButObject().forEach((definition) => {
            it(`should throw an error if invoked without valid project definition (value=${typeof definition})`, () => {
                const error = 'Invalid project definition (arg #1)';
                const wrapper = () => new Project(definition);

                expect(wrapper).to.throw(error);
            });
        });

        describe('[package.json properties]', () => {
            getAllButString('').forEach((name) => {
                it(`should throw an error if the project definition has an invalid name (value=${typeof name})`, () => {
                    const definition = buildProjectDefinition({ name });
                    const wrapper = () => new Project(definition);
                    const error = /Schema validation failed \[.*name.*\]/;

                    expect(wrapper).to.throw(error);
                });
            });

            getAllButString('').forEach((description) => {
                it(`should throw an error if the project definition has an invalid description (value=${typeof description})`, () => {
                    const definition = buildProjectDefinition({ description });
                    const wrapper = () => new Project(definition);
                    const error =
                        /Schema validation failed \[.*description.*\]/;

                    expect(wrapper).to.throw(error);
                });
            });

            getAllButString('', 'abc').forEach((version) => {
                it(`should throw an error if invoked without a valid version (value=${typeof version})`, () => {
                    const definition = buildProjectDefinition({ version });
                    const wrapper = () => new Project(definition);
                    const error = /Schema validation failed \[.*version.*\]/;

                    expect(wrapper).to.throw(error);
                });
            });
        });

        describe('[buildMetadata properties]', () => {
            getAllButObject().forEach((buildMetadata) => {
                it(`should throw an error if invoked without a valid buildMetadata (value=${typeof buildMetadata})`, () => {
                    const definition = buildProjectDefinition({
                        buildMetadata,
                    });
                    const wrapper = () => new Project(definition);
                    const error =
                        /Schema validation failed \[.*buildMetadata.*\]/;

                    expect(wrapper).to.throw(error);
                });
            });

            getAllButString('bad-type').forEach((type) => {
                it(`should throw an error if invoked without a valid buildMetadata.type (value=${typeof type})`, () => {
                    const definition = buildProjectDefinition({
                        'buildMetadata.type': type,
                    });
                    const wrapper = () => new Project(definition);
                    const error = /Schema validation failed \[.*type.*\]/;

                    expect(wrapper).to.throw(error);
                });
            });

            getAllButString('bad-language').forEach((language) => {
                it(`should throw an error if invoked without a valid buildMetadata.language (value=${typeof language})`, () => {
                    const definition = buildProjectDefinition({
                        'buildMetadata.language': language,
                    });
                    const wrapper = () => new Project(definition);
                    const error = /Schema validation failed \[.*language.*\]/;

                    expect(wrapper).to.throw(error);
                });
            });

            makeOptional(getAllButArray()).forEach((requiredEnv) => {
                it(`should throw an error if invoked without a valid buildMetadata.requiredEnv (value=${typeof requiredEnv})`, () => {
                    const definition = buildProjectDefinition({
                        'buildMetadata.requiredEnv': requiredEnv,
                    });
                    const wrapper = () => new Project(definition);
                    const error =
                        /Schema validation failed \[.*requiredEnv.*\]/;

                    expect(wrapper).to.throw(error);
                });
            });

            makeOptional(getAllButArray()).forEach((staticFilePatterns) => {
                it(`should throw an error if invoked without a valid buildMetadata.staticFilePatterns (value=${typeof staticFilePatterns})`, () => {
                    const definition = buildProjectDefinition({
                        'buildMetadata.staticFilePatterns': staticFilePatterns,
                    });
                    const wrapper = () => new Project(definition);
                    const error =
                        /Schema validation failed \[.*staticFilePatterns.*\]/;

                    expect(wrapper).to.throw(error);
                });
            });

            describe('[aws properties]', () => {
                makeOptional(getAllButObject()).forEach((aws) => {
                    it(`should throw an error if invoked without a valid buildMetadata.aws (value=${typeof aws})`, () => {
                        const definition = buildProjectDefinition({
                            'buildMetadata.aws': aws,
                        });
                        const wrapper = () => new Project(definition);
                        const error = /Schema validation failed \[.*aws.*\]/;

                        expect(wrapper).to.throw(error);
                    });
                });

                getAllButObject().forEach((stacks) => {
                    it(`should throw an error if invoked without a valid buildMetadata.aws.stacks (value=${typeof stacks})`, () => {
                        const definition = buildProjectDefinition({
                            'buildMetadata.aws.stacks': stacks,
                        });
                        const wrapper = () => new Project(definition);
                        const error = /Schema validation failed \[.*stacks.*\]/;

                        expect(wrapper).to.throw(error);
                    });
                });

                it(`should throw an error if invoked without at least one stack`, () => {
                    const definition = buildProjectDefinition({
                        'buildMetadata.aws': { stacks: {} },
                    });
                    const wrapper = () => new Project(definition);
                    const error = /No AWS stacks defined/;

                    expect(wrapper).to.throw(error);
                });

                ['$?!', ''].forEach((stackName) => {
                    it(`should throw an error if the stack name is invalid`, () => {
                        const definition = buildProjectDefinition({
                            'buildMetadata.aws': {
                                stacks: {
                                    [`${stackName}`]: 'foo',
                                },
                            },
                        });
                        const wrapper = () => new Project(definition);
                        const error =
                            /Schema validation failed \[.*additional properties.*\]/;

                        expect(wrapper).to.throw(error);
                    });
                });

                getAllButString('').forEach((stackName) => {
                    it(`should throw an error if invoked without a valid buildMetadata.aws.stacks[stackName] (value=${typeof stackName})`, () => {
                        const definition = buildProjectDefinition({
                            'buildMetadata.aws.stacks.myStack': stackName,
                        });
                        const wrapper = () => new Project(definition);
                        const error =
                            /Schema validation failed \[.*myStack.*\]/;

                        expect(wrapper).to.throw(error);
                    });
                });

                it('should throw an error if unsupported additional parameters are specified', () => {
                    const definition = buildProjectDefinition();
                    definition.buildMetadata.aws.foo = 'bar';
                    const wrapper = () => new Project(definition);
                    const error =
                        /Schema validation failed \[.*additional properties.*\]/;

                    expect(wrapper).to.throw(error);
                });
            });

            describe('[container properties]', () => {
                makeOptional(getAllButObject()).forEach((container) => {
                    it(`should throw an error if invoked without a valid buildMetadata.container (value=${typeof container})`, () => {
                        const definition = buildProjectDefinition({
                            'buildMetadata.container': container,
                        });
                        const wrapper = () => new Project(definition);
                        const error =
                            /Schema validation failed \[.*container.*\]/;

                        expect(wrapper).to.throw(error);
                    });
                });

                it(`should throw an error if invoked without at least one build configuration`, () => {
                    const definition = buildProjectDefinition({
                        'buildMetadata.container': {},
                    });
                    const wrapper = () => new Project(definition);
                    const error = /No container builds defined/;

                    expect(wrapper).to.throw(error);
                });

                ['$?!', ''].forEach((buildName) => {
                    it(`should throw an error if the build name is invalid`, () => {
                        const definition = buildProjectDefinition({
                            'buildMetadata.container': {
                                [`${buildName}`]: 'foo',
                            },
                        });
                        const wrapper = () => new Project(definition);
                        const error =
                            /Schema validation failed \[.*additional properties.*\]/;

                        expect(wrapper).to.throw(error);
                    });
                });

                it(`should throw an error if no default build is defined`, () => {
                    const definition = buildProjectDefinition({
                        'buildMetadata.container': {
                            myBuild: {
                                repo: 'my-repo',
                                buildFile: 'BuildFile-1',
                                buildArgs: {
                                    arg1: 'value1',
                                },
                            },
                        },
                    });
                    const wrapper = () => new Project(definition);
                    const error = /No default container defined/;

                    expect(wrapper).to.throw(error);
                });

                getAllButObject().forEach((buildName) => {
                    it(`should throw an error if invoked without a valid buildMetadata.container[buildName] (value=${typeof buildName})`, () => {
                        const definition = buildProjectDefinition({
                            'buildMetadata.container.default': buildName,
                        });
                        const wrapper = () => new Project(definition);
                        const error =
                            /Schema validation failed \[.*default.*\]/;

                        expect(wrapper).to.throw(error);
                    });
                });

                getAllButString('').forEach((repo) => {
                    it(`should throw an error if invoked without a valid buildMetadata.container.default.repo (value=${typeof repo})`, () => {
                        const definition = buildProjectDefinition({
                            'buildMetadata.container.default.repo': repo,
                        });
                        const wrapper = () => new Project(definition);
                        const error = /Schema validation failed \[.*repo.*\]/;

                        expect(wrapper).to.throw(error);
                    });
                });

                makeOptional(getAllButString('')).forEach((buildFile) => {
                    it(`should throw an error if invoked without a valid buildMetadata.container.default.buildFile (value=${typeof buildFile})`, () => {
                        const definition = buildProjectDefinition({
                            'buildMetadata.container.default.buildFile':
                                buildFile,
                        });
                        const wrapper = () => new Project(definition);
                        const error =
                            /Schema validation failed \[.*buildFile.*\]/;

                        expect(wrapper).to.throw(error);
                    });
                });

                makeOptional(getAllButObject()).forEach((buildArgs) => {
                    it(`should throw an error if invoked without a valid buildMetadata.container.default.buildArgs (value=${typeof buildArgs})`, () => {
                        const definition = buildProjectDefinition({
                            'buildMetadata.container.default.buildArgs':
                                buildArgs,
                        });
                        const wrapper = () => new Project(definition);
                        const error =
                            /Schema validation failed \[.*buildArgs.*\]/;

                        expect(wrapper).to.throw(error);
                    });
                });

                it('should throw an error if unsupported additional parameters are specified', () => {
                    const definition = buildProjectDefinition();
                    definition.buildMetadata.container.default.foo = 'bar';
                    const wrapper = () => new Project(definition);
                    const error =
                        /Schema validation failed \[.*additional properties.*\]/;

                    expect(wrapper).to.throw(error);
                });

                ['$?!', ''].forEach((buildArg) => {
                    it(`should throw an error if the build arg name is invalid`, () => {
                        const definition = buildProjectDefinition({
                            'buildMetadata.container.default.buildArgs': {
                                [`${buildArg}`]: 'foo',
                            },
                        });
                        const wrapper = () => new Project(definition);
                        const error =
                            /Schema validation failed \[.*additional properties.*\]/;

                        expect(wrapper).to.throw(error);
                    });
                });

                getAllButString().forEach((buildArgValue) => {
                    it(`should throw an error if invoked without a valid buildMetadata.container.default.buildArgs[buildArgValue] (value=${typeof buildArgValue})`, () => {
                        const definition = buildProjectDefinition({
                            'buildMetadata.container.default.buildArgs': {
                                foo: buildArgValue,
                            },
                        });
                        const wrapper = () => new Project(definition);
                        const error =
                            /Schema validation failed \[.*buildArgs.*\]/;

                        expect(wrapper).to.throw(error);
                    });
                });
            });
        });
    });

    describe('[properties]', () => {
        [
            ['name', 'test-project'],
            ['description', 'Test project description'],
            ['version', '1.2.3'],
            ['buildMetadata.language', 'ts'],
            ['buildMetadata.type', 'cli'],
        ].forEach(([property, inputValue, expectedValue]) => {
            it(`should set the property [${property}]  based on data in the project definition`, () => {
                expectedValue = expectedValue || inputValue;
                const definition = buildProjectDefinition({
                    [property]: inputValue,
                });
                const project = new Project(definition);
                const projectProp = property.split('.').pop();

                expect(project[projectProp]).to.equal(expectedValue);
            });
        });

        describe('[unscopedName]', () => {
            [
                ['bar-project', 'bar-project'],
                ['@foo/bar-project', 'bar-project'],
            ].forEach(([name, unscopedName]) => {
                it(`should return the name of the project without scope (name=${name})`, () => {
                    const definition = buildProjectDefinition({
                        name: name,
                    });
                    const project = new Project(definition);

                    expect(project.unscopedName).to.equal(unscopedName);
                });
            });
        });

        describe('[kebabCasedName]', () => {
            [
                ['bar-project', 'bar-project'],
                ['@foo/bar-project', 'foo-bar-project'],
            ].forEach(([name, kebabCasedName]) => {
                it(`should return the name of the project in kebab case (name=${name})`, () => {
                    const definition = buildProjectDefinition({
                        name: name,
                    });
                    const project = new Project(definition);

                    expect(project.kebabCasedName).to.equal(kebabCasedName);
                });
            });
        });

        describe('[configFileName]', () => {
            [
                ['bar-project', '.barProjectrc'],
                ['@foo/bar-project', '.barProjectrc'],
            ].forEach(([name, configFileName]) => {
                it(`should return the name of the project without scope (name=${name})`, () => {
                    const definition = buildProjectDefinition({
                        name: name,
                    });
                    const project = new Project(definition);

                    expect(project.configFileName).to.equal(configFileName);
                });
            });
        });

        describe('[rootDir]', () => {
            it('should return a directory that represents the project root', () => {
                const definition = buildProjectDefinition({});
                const project = new Project(definition);
                const rootDir = project.rootDir;

                expect(rootDir).to.be.an.instanceOf(Directory);

                // This is assuming that we are running the test in the root
                // directory of the build utils project.
                expect(rootDir.name).to.equal('build-utils');
                expect(rootDir.path).to.equal(`.${_path.sep}`);
            });

            it('should include the expected directory structure under the project root', () => {
                const expectedDirs = [
                    './',
                    'src/',
                    'test/',
                    'test/unit/',
                    'test/api/',
                    'infra/',
                    'working/',
                    'working/src/',
                    'working/test/',
                    'working/test/unit/',
                    'working/test/api/',
                    'working/infra/',
                    'working/node_modules/',
                    'dist/',
                    'docs/',
                    'node_modules/',
                    'coverage/',
                    '.gulp/',
                    '.tscache/',
                    'logs/',
                    'cdk.out/',
                ].reduce((result, name) => {
                    result[name] = { visited: false };
                    return result;
                }, {});
                const callback = (dir, level) => {
                    const path = dir.path.replace(
                        new RegExp(_path.sep, 'g'),
                        '/'
                    );
                    const expectedDir = expectedDirs[path];
                    expect(expectedDir.visited).to.be.false;
                    expectedDir.visited = true;
                };
                const definition = buildProjectDefinition({});
                const project = new Project(definition);
                const rootDir = project.rootDir;

                Directory.traverseTree(rootDir, callback);

                Object.keys(expectedDirs).forEach(
                    (dir) => expect(expectedDirs[dir].visited).to.be.true
                );
            });
        });
    });

    describe('getStaticFilePatterns()', () => {
        it('should return an empty array if the definition does not contain static file patterns', () => {
            const definition = buildProjectDefinition({
                'buildMetadata.staticFilePatterns': undefined,
            });
            const project = new Project(definition);

            expect(project.getStaticFilePatterns()).to.deep.equal([]);
        });

        it('should return the values specified in the project definition', () => {
            const values = ['foo', 'bar'];
            const definition = buildProjectDefinition({
                'buildMetadata.staticFilePatterns': values,
            });
            const project = new Project(definition);

            expect(project.getStaticFilePatterns()).to.deep.equal(values);
        });

        it('should return a copy of the values, not a reference', () => {
            const values = ['foo', 'bar'];
            const definition = buildProjectDefinition({
                'buildMetadata.staticFilePatterns': values,
            });
            const project = new Project(definition);

            const oldValues = project.getStaticFilePatterns();
            oldValues.pop();

            const newValues = project.getStaticFilePatterns();
            expect(newValues).to.not.equal(oldValues);
        });
    });

    describe('getRequiredEnv()', () => {
        it('should return an empty array if the definition does not contain required environment variables', () => {
            const definition = buildProjectDefinition({
                'buildMetadata.requiredEnv': undefined,
            });
            const project = new Project(definition);

            expect(project.getRequiredEnv()).to.deep.equal([]);
        });

        it('should return the values specified in the project definition', () => {
            const values = ['foo', 'bar'];
            const definition = buildProjectDefinition({
                'buildMetadata.requiredEnv': values,
            });
            const project = new Project(definition);

            expect(project.getRequiredEnv()).to.deep.equal(values);
        });

        it('should return a copy of the values, not a reference', () => {
            const values = ['foo', 'bar'];
            const definition = buildProjectDefinition({
                'buildMetadata.requiredEnv': values,
            });
            const project = new Project(definition);

            const oldValues = project.getRequiredEnv();
            oldValues.pop();

            const newValues = project.getRequiredEnv();
            expect(newValues).to.not.equal(oldValues);
        });
    });

    describe('getCdkTargets()', () => {
        it('should return an empty array if the definition does not contain an aws definition', () => {
            const definition = buildProjectDefinition({
                'buildMetadata.aws': undefined,
            });
            const project = new Project(definition);

            expect(project.getCdkTargets()).to.deep.equal([]);
        });

        it('should return the stack keys specified in the project definition', () => {
            const targets = ['foo', 'bar'];
            const definition = buildProjectDefinition({
                'buildMetadata.aws.stacks': targets.reduce((result, key) => {
                    result[key] = `${key}-stack`;
                    return result;
                }, {}),
            });
            const project = new Project(definition);

            expect(project.getCdkTargets()).to.deep.equal(targets);
        });

        it('should return a copy of the values, not a reference', () => {
            const targets = ['foo', 'bar'];
            const definition = buildProjectDefinition({
                'buildMetadata.aws.stacks': targets.reduce((result, key) => {
                    result[key] = `${key}-stack`;
                    return result;
                }, {}),
            });
            const project = new Project(definition);

            const oldValues = project.getCdkTargets();
            oldValues.pop();

            const newValues = project.getCdkTargets();
            expect(newValues).to.not.equal(oldValues);
        });
    });

    describe('getCdkStackDefinition()', () => {
        getAllButString('').forEach((target) => {
            it(`should throw an error if invoked without a valid target (value=${typeof target})`, () => {
                const definition = buildProjectDefinition();
                const project = new Project(definition);
                const wrapper = () => project.getCdkStackDefinition(target);
                const error = 'Invalid CDK target (arg #1)';

                expect(wrapper).to.throw(error);
            });
        });

        it('should throw an error if the CDK target has not been defined', () => {
            const targets = ['foo', 'bar'];
            const definition = buildProjectDefinition({
                'buildMetadata.aws.stacks': targets.reduce((result, key) => {
                    result[key] = `${key}-stack`;
                    return result;
                }, {}),
            });
            const project = new Project(definition);

            const target = 'bad-target';
            const wrapper = () => project.getCdkStackDefinition(target);
            const error = `CDK target has not been defined (${target})`;

            expect(wrapper).to.throw(error);
        });

        it('should return stack details if the CDK target has been defined', () => {
            const targets = ['foo', 'bar'];
            const stacks = targets.reduce((result, key) => {
                result[key] = `${key}-stack`;
                return result;
            }, {});
            const definition = buildProjectDefinition({
                'buildMetadata.aws.stacks': stacks,
            });

            const project = new Project(definition);

            targets.forEach((target) => {
                const stack = project.getCdkStackDefinition(target);
                expect(stack).to.deep.equal({ name: stacks[target] });
            });
        });

        it('should return a copy of the definition and not a reference', () => {
            const targets = ['foo', 'bar'];
            const stacks = targets.reduce((result, key) => {
                result[key] = `${key}-stack`;
                return result;
            }, {});
            const definition = buildProjectDefinition({
                'buildMetadata.aws.stacks': stacks,
            });

            const project = new Project(definition);

            targets.forEach((target) => {
                const oldValue = project.getCdkStackDefinition(target);
                expect(oldValue).to.deep.equal({ name: stacks[target] });

                oldValue.foo = 'bar';

                const newValue = project.getCdkStackDefinition(target);
                expect(newValue).to.not.equal(oldValue);
            });
        });
    });

    describe('getContainerTargets()', () => {
        it('should return an empty array if the definition does not contain an aws definition', () => {
            const definition = buildProjectDefinition({
                'buildMetadata.container': undefined,
            });
            const project = new Project(definition);

            expect(project.getContainerTargets()).to.deep.equal([]);
        });

        it('should return the stack keys specified in the project definition', () => {
            const targets = ['foo', 'bar'];
            const containers = createContainerObject(targets);
            const definition = buildProjectDefinition({
                'buildMetadata.container': containers,
            });
            const project = new Project(definition);

            expect(project.getContainerTargets()).to.deep.equal([
                ...targets,
                'default',
            ]);
        });

        it('should return a copy of the values, not a reference', () => {
            const targets = ['foo', 'bar'];
            const containers = createContainerObject(targets);
            const definition = buildProjectDefinition({
                'buildMetadata.container': containers,
            });
            const project = new Project(definition);

            const oldValues = project.getContainerTargets();
            oldValues.pop();

            const newValues = project.getContainerTargets();
            expect(newValues).to.not.equal(oldValues);
        });
    });

    describe('getContainerDefinition()', () => {
        getAllButString('').forEach((target) => {
            it(`should throw an error if invoked without a valid target (value=${typeof target})`, () => {
                const definition = buildProjectDefinition();
                const project = new Project(definition);
                const wrapper = () => project.getContainerDefinition(target);
                const error = 'Invalid container target (arg #1)';

                expect(wrapper).to.throw(error);
            });
        });

        it('should throw an error if the container target has not been defined', () => {
            const targets = ['foo', 'bar'];
            const containers = createContainerObject(targets);

            const definition = buildProjectDefinition({
                'buildMetadata.container': containers,
            });
            const project = new Project(definition);

            const target = 'bad-target';
            const wrapper = () => project.getContainerDefinition(target);
            const error = `Container target has not been defined (${target})`;

            expect(wrapper).to.throw(error);
        });

        it('should return container details if the container target has been defined', () => {
            const targets = ['foo', 'bar'];
            const containers = createContainerObject(targets);

            const definition = buildProjectDefinition({
                'buildMetadata.container': containers,
            });

            const project = new Project(definition);

            targets.forEach((target) => {
                const container = project.getContainerDefinition(target);
                expect(container).to.deep.equal(
                    Object.assign({ name: target }, containers[target])
                );
            });
        });

        it('should return a copy of the definition and not a reference', () => {
            const targets = ['foo', 'bar'];
            const containers = createContainerObject(targets);

            const definition = buildProjectDefinition({
                'buildMetadata.container': containers,
            });

            const project = new Project(definition);

            targets.forEach((target) => {
                const oldValue = project.getContainerDefinition(target);
                expect(oldValue).to.deep.equal(
                    Object.assign({ name: target }, containers[target])
                );

                oldValue.foo = 'bar';

                const newValue = project.getContainerDefinition(target);
                expect(newValue).to.not.equal(oldValue);
            });
        });
    });

    describe('getUndefinedEnvironmentVariables()', () => {
        it('should return an empty array if no environment variables are required', () => {
            const definition = buildProjectDefinition({
                'buildMetadata.requiredEnv': [],
            });
            const project = new Project(definition);
            const missingVars = project.getUndefinedEnvironmentVariables();

            expect(missingVars).to.deep.equal([]);
        });

        it('should return the full list of required environment variables if none are defined', () => {
            const requiredVars = ['FIRST_VAR', 'SECOND_VAR'];
            const definition = buildProjectDefinition({
                'buildMetadata.requiredEnv': requiredVars,
            });
            const project = new Project(definition);
            const missingVars = project.getUndefinedEnvironmentVariables();

            expect(missingVars).to.deep.equal(requiredVars);
        });

        it('should return the just the variables missing from the environent', () => {
            const requiredVars = ['FIRST_VAR', 'SECOND_VAR'];
            process.env.FIRST_VAR = 'foo';
            const definition = buildProjectDefinition({
                'buildMetadata.requiredEnv': requiredVars,
            });
            const project = new Project(definition);
            const missingVars = project.getUndefinedEnvironmentVariables();

            expect(missingVars).to.deep.equal(['SECOND_VAR']);
        });
    });
});
