import * as ts from 'typescript';
import path from 'path';
import fs from 'fs';
import { findProjectRoot } from './utils/project-root.js';

export interface LinterOptions {
  severity?: 'error' | 'warn' | 'off';
}

export class PathLinter {
  private program: ts.Program;
  private checker: ts.TypeChecker;
  private projectRoot: string;
  private options: LinterOptions;

  constructor(program: ts.Program, options: LinterOptions = {}) {
    this.program = program;
    this.checker = program.getTypeChecker();
    this.projectRoot = findProjectRoot();
    this.options = { severity: 'error', ...options };
  }

  /**
   * Runs the linter on all source files
   */
  run(): ts.Diagnostic[] {
    const diagnostics: ts.Diagnostic[] = [];
    
    for (const sourceFile of this.program.getSourceFiles()) {
      if (!sourceFile.isDeclarationFile) {
        diagnostics.push(...this.checkFile(sourceFile));
      }
    }
    
    return diagnostics;
  }

  /**
   * Checks a single source file for path validation issues
   */
  public checkFile(sourceFile: ts.SourceFile): ts.Diagnostic[] {
    const diagnostics: ts.Diagnostic[] = [];
    
    const visit = (node: ts.Node) => {
      if (ts.isVariableDeclaration(node) && node.initializer) {
        const diagnostic = this.checkVariableDeclaration(node);
        if (diagnostic) {
          diagnostics.push(diagnostic);
        }
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
    return diagnostics;
  }

  /**
   * Checks if a variable declaration has path validation issues
   */
  private checkVariableDeclaration(node: ts.VariableDeclaration): ts.Diagnostic | null {
    if (!ts.isStringLiteral(node.initializer!)) {
      return null;
    }

    // Check if the variable has a type annotation
    if (!node.type) {
      return null;
    }

    // Check if the type annotation is one of our path types
    if (!this.isPathType(node.type)) {
      return null;
    }

    const pathValue = node.initializer!.text;
    
    if (!this.isValidPath(pathValue)) {
      return {
        category: this.getSeverityCategory(),
        code: 1001,
        messageText: `Invalid path: "${pathValue}" does not exist or is not accessible`,
        file: node.getSourceFile(),
        start: node.initializer!.getStart(),
        length: node.initializer!.getWidth(),
      };
    }

    return null;
  }

  /**
   * Checks if a type is one of our path type aliases using AST
   */
  private isPathType(typeNode: ts.TypeNode): boolean {
    if (!ts.isTypeReferenceNode(typeNode)) {
      return false;
    }

    // Use AST to get the type name instead of getText()
    const typeName = this.getTypeNameFromAST(typeNode.typeName);
    return typeName === 'FilePathStr' || typeName === 'FolderPathStr' || typeName === 'AnyPathStr';
  }

  /**
   * Extracts type name from AST nodes
   */
  private getTypeNameFromAST(typeName: ts.EntityName): string {
    if (ts.isIdentifier(typeName)) {
      return typeName.text;
    } else if (ts.isQualifiedName(typeName)) {
      // For qualified names like 'linted-paths.FilePathStr', get the last part
      return this.getTypeNameFromAST(typeName.right);
    }
    
    return '';
  }

  /**
   * Validates if a path is valid and exists using proper path resolution
   */
  private isValidPath(pathValue: string): boolean {
    if (!pathValue || typeof pathValue !== 'string') {
      return false;
    }

    // Check for invalid characters using regex (this is appropriate for string validation)
    const invalidChars = /[<>:"|?*\x00-\x1f]/;
    if (invalidChars.test(pathValue)) {
      return false;
    }

    // Resolve the path properly using Node.js path utilities
    let fullPath: string;
    if (path.isAbsolute(pathValue)) {
      fullPath = pathValue;
    } else {
      fullPath = path.resolve(this.projectRoot, pathValue);
    }

    // Use path.relative to check if the resolved path is within project root
    const relativePath = path.relative(this.projectRoot, fullPath);
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      return false;
    }

    // Check if path exists using file system
    try {
      return fs.existsSync(fullPath);
    } catch {
      return false;
    }
  }

  /**
   * Gets the TypeScript diagnostic category based on severity
   */
  private getSeverityCategory(): ts.DiagnosticCategory {
    switch (this.options.severity) {
      case 'warn':
        return ts.DiagnosticCategory.Warning;
      case 'off':
        return ts.DiagnosticCategory.Suggestion;
      case 'error':
      default:
        return ts.DiagnosticCategory.Error;
    }
  }
}

/**
 * Creates a TypeScript compiler plugin for path validation
 */
export function createPathLinterPlugin(options: LinterOptions = {}): ts.server.PluginModule {
  return {
    create(info) {
      const linter = new PathLinter(info.languageService.getProgram()!, options);
      
      // Create a proxy that extends the original language service
      return new Proxy(info.languageService, {
        get(target, prop) {
          if (prop === 'getSemanticDiagnostics') {
            return (fileName: string) => {
              // Get original diagnostics
              const originalDiagnostics = target.getSemanticDiagnostics(fileName);
              
              // Get our custom diagnostics
              const sourceFile = info.languageService.getProgram()!.getSourceFile(fileName);
              if (!sourceFile) return originalDiagnostics;
              
              const customDiagnostics = linter.checkFile(sourceFile);
              
              // Combine diagnostics
              return [...originalDiagnostics, ...customDiagnostics];
            };
          }
          
          // Return original property using proper typing
          return Reflect.get(target, prop);
        }
      });
    }
  };
}
