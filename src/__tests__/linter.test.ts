import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as ts from 'typescript';
import { PathLinter, createPathLinterPlugin } from '../linter';
import fs from 'fs';
import path from 'path';
import process from 'process';

describe('PathLinter', () => {
  let tempDir: string;
  let testFilePath: string;
  let testFolderPath: string;

  beforeEach(() => {
    // Create temporary test files
    tempDir = fs.mkdtempSync(path.join(process.cwd(), 'test-'));
    testFilePath = path.join(tempDir, 'test-file.txt');
    testFolderPath = path.join(tempDir, 'test-folder');

    fs.writeFileSync(testFilePath, 'test content');
    fs.mkdirSync(testFolderPath);
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('PathLinter class', () => {
    it('should create a linter instance', () => {
      const program = createTestProgram();
      const linter = new PathLinter(program);
      expect(linter).toBeInstanceOf(PathLinter);
    });

    it('should validate existing file paths', () => {
      const sourceCode = `
        type FilePathStr = string;
        const validPath: FilePathStr = '${path.relative(process.cwd(), testFilePath)}';
      `;

      const program = createTestProgram(sourceCode);
      const linter = new PathLinter(program);
      const diagnostics = linter.run();

      expect(diagnostics).toHaveLength(0);
    });

    it('should detect non-existent file paths', () => {
      const sourceCode = `
        type FilePathStr = string;
        const invalidPath: FilePathStr = 'src/nonexistent-file.ts';
      `;

      const program = createTestProgram(sourceCode);
      const linter = new PathLinter(program);
      const diagnostics = linter.run();

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].messageText).toContain('does not exist');
    });

    it('should validate existing folder paths', () => {
      const sourceCode = `
        type FolderPathStr = string;
        const validFolder: FolderPathStr = '${path.relative(process.cwd(), testFolderPath)}';
      `;

      const program = createTestProgram(sourceCode);
      const linter = new PathLinter(program);
      const diagnostics = linter.run();

      expect(diagnostics).toHaveLength(0);
    });

    it('should detect non-existent folder paths', () => {
      const sourceCode = `
        type FolderPathStr = string;
        const invalidFolder: FolderPathStr = 'src/nonexistent-folder';
      `;

      const program = createTestProgram(sourceCode);
      const linter = new PathLinter(program);
      const diagnostics = linter.run();

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].messageText).toContain('does not exist');
    });

    it('should validate any paths', () => {
      const sourceCode = `
        type AnyPathStr = string;
        const validPath: AnyPathStr = '${path.relative(process.cwd(), testFilePath)}';
        const validFolder: AnyPathStr = '${path.relative(process.cwd(), testFolderPath)}';
      `;

      const program = createTestProgram(sourceCode);
      const linter = new PathLinter(program);
      const diagnostics = linter.run();

      expect(diagnostics).toHaveLength(0);
    });

    it('should detect paths with invalid characters', () => {
      const sourceCode = `
        type FilePathStr = string;
        const invalidPath: FilePathStr = 'src/file<with>invalid:chars.txt';
      `;

      const program = createTestProgram(sourceCode);
      const linter = new PathLinter(program);
      const diagnostics = linter.run();

      expect(diagnostics).toHaveLength(1);
    });

    it('should respect severity levels', () => {
      const sourceCode = `
        type FilePathStr = string;
        const invalidPath: FilePathStr = 'src/nonexistent-file.ts';
      `;

      const program = createTestProgram(sourceCode);

      // Test warn severity
      const warnLinter = new PathLinter(program, { severity: 'warn' });
      const warnDiagnostics = warnLinter.run();
      expect(warnDiagnostics).toHaveLength(1);
      expect(warnDiagnostics[0].category).toBe(ts.DiagnosticCategory.Warning);

      // Test off severity
      const offLinter = new PathLinter(program, { severity: 'off' });
      const offDiagnostics = offLinter.run();
      expect(offDiagnostics).toHaveLength(1);
      expect(offDiagnostics[0].category).toBe(ts.DiagnosticCategory.Suggestion);
    });

    it('should ignore non-path type assignments', () => {
      const sourceCode = `
        const normalString: string = 'src/some-file.ts';
        const numberValue: number = 42;
      `;

      const program = createTestProgram(sourceCode);
      const linter = new PathLinter(program);
      const diagnostics = linter.run();

      expect(diagnostics).toHaveLength(0);
    });
  });

  describe('createPathLinterPlugin', () => {
    it('should create a TypeScript plugin', () => {
      const plugin = createPathLinterPlugin();
      expect(plugin).toBeDefined();
      expect(typeof plugin.create).toBe('function');
    });

    it('should return plugin with semantic diagnostics', () => {
      const plugin = createPathLinterPlugin();
      const mockInfo = {
        languageService: {
          getProgram: () => createTestProgram(),
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      const pluginInstance = plugin.create(mockInfo);
      expect(pluginInstance.getSemanticDiagnostics).toBeDefined();
    });
  });
});

/**
 * Helper function to create a test TypeScript program
 */
function createTestProgram(sourceCode?: string): ts.Program {
  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
  };

  const sourceFile = sourceCode
    ? ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.ES2020)
    : ts.createSourceFile('test.ts', '', ts.ScriptTarget.ES2020);

  const program = ts.createProgram(['test.ts'], compilerOptions, {
    getSourceFile: (fileName) => (fileName === 'test.ts' ? sourceFile : undefined),
    writeFile: () => {},
    getCurrentDirectory: () => process.cwd(),
    getDirectories: () => [],
    fileExists: (fileName) => fileName === 'test.ts',
    readFile: (fileName) => (fileName === 'test.ts' ? sourceCode || '' : undefined),
    getDefaultLibFileName: () => 'lib.d.ts',
    getCanonicalFileName: (fileName) => fileName,
    useCaseSensitiveFileNames: () => false,
    getNewLine: () => '\n',
  });

  return program;
}
