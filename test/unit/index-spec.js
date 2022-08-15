'use strict';

import { Directory } from '../../src/directory.js';
import { Directory as ExportedDirectory } from '../../src/index.js';

describe('[index]', () => {
    it('should expose the expected properties', () => {
        expect(ExportedDirectory).toEqual(Directory);
    });
});
