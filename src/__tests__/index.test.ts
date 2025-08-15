import { describe, it, expect } from 'vitest';
import { FilePath, FolderPath, AnyPath, getProjectRoot } from '../index';

describe('linted-paths', () => {
  describe('getProjectRoot', () => {
    it('should return the project root path', () => {
      const root = getProjectRoot();
      expect(typeof root).toBe('string');
      expect(root.length).toBeGreaterThan(0);
    });
  });

  describe('FilePath', () => {
    it('should validate valid file paths', () => {
      expect(() => FilePath('./src/index.ts')).not.toThrow();
      expect(() => FilePath('/absolute/path/file.txt')).not.toThrow();
    });

    it('should throw for invalid paths', () => {
      expect(() => FilePath('')).toThrow();
      expect(() => FilePath(null as any)).toThrow();
      expect(() => FilePath('path/with/invalid<chars')).toThrow();
    });

    it('should accept custom error messages', () => {
      expect(() => FilePath('', 'Custom error')).toThrow('Custom error');
    });
  });

  describe('FolderPath', () => {
    it('should validate valid folder paths', () => {
      expect(() => FolderPath('./src')).not.toThrow();
      expect(() => FolderPath('/absolute/path')).not.toThrow();
    });

    it('should throw for invalid paths', () => {
      expect(() => FolderPath('')).toThrow();
      expect(() => FolderPath(null as any)).toThrow();
    });
  });

  describe('AnyPath', () => {
    it('should validate valid paths', () => {
      expect(() => AnyPath('./src')).not.toThrow();
      expect(() => AnyPath('./src/index.ts')).not.toThrow();
    });

    it('should throw for invalid paths', () => {
      expect(() => AnyPath('')).toThrow();
      expect(() => AnyPath(null as any)).toThrow();
    });
  });
});

