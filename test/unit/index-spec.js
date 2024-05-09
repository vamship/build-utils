import { expect } from 'chai';
import { Directory } from '../../src/directory.js';
import { Project } from '../../src/project.js';

import { Directory as ExportedDirectory } from '../../src/index.js';
import { Project as ExportedProject } from '../../src/index.js';

describe('[index]', function () {
    it('should expose the expected properties', function () {
        expect(ExportedDirectory).to.equal(Directory);
        expect(ExportedProject).to.equal(Project);
    });
});
