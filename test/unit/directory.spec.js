import { Directory } from '../../src/directory.js';

describe('[Static Members]', () => {
    it('should expose the expected static members', () => {
        expect(typeof Directory.createTree).toBe('function');
        expect(typeof Directory.traverseTree).toBe('function');
    });
});
