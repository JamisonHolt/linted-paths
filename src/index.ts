import path from 'path';
import { findProjectRoot } from './utils/project-root.js';

/**
 * Gets the absolute path of the project root
 * @returns The absolute path of the project root
 * @throws {Error} When no project root can be found
 */
export function getProjectRoot(): string {
  return findProjectRoot();
}

/**
 * Validates that a path is a valid file path
 * @param pathStr - The path to validate
 * @param errorMessage - Optional custom error message
 * @returns The path if valid
 * @throws {Error} When the path is invalid
 */
export function FilePath(pathStr: string, errorMessage?: string): string {
  validatePath(pathStr, errorMessage || 'Invalid file path');
  return pathStr;
}

/**
 * Validates that a path is a valid folder path
 * @param pathStr - The path to validate
 * @param errorMessage - Optional custom error message
 * @returns The path if valid
 * @throws {Error} When the path is invalid
 */
export function FolderPath(pathStr: string, errorMessage?: string): string {
  validatePath(pathStr, errorMessage || 'Invalid folder path');
  return pathStr;
}

/**
 * Validates that a path is a valid file or folder path
 * @param pathStr - The path to validate
 * @param errorMessage - Optional custom error message
 * @returns The path if valid
 * @throws {Error} When the path is invalid
 */
export function AnyPath(pathStr: string, errorMessage?: string): string {
  validatePath(pathStr, errorMessage || 'Invalid path');
  return pathStr;
}

/**
 * Internal path validation function
 */
function validatePath(pathStr: string, errorMessage: string): void {
  if (typeof pathStr !== 'string') {
    throw new Error(errorMessage);
  }
  
  if (!pathStr.trim()) {
    throw new Error(errorMessage);
  }
  
  // Check for invalid characters
  const invalidChars = /[<>:"|?*\x00-\x1f]/;
  if (invalidChars.test(pathStr)) {
    throw new Error(`${errorMessage}: contains invalid characters`);
  }
  
  // For relative paths, ensure they don't escape project root
  if (pathStr.startsWith('./') || pathStr.startsWith('../')) {
    const resolvedPath = path.resolve(getProjectRoot(), pathStr);
    const projectRoot = getProjectRoot();
    
    if (!resolvedPath.startsWith(projectRoot)) {
      throw new Error(`${errorMessage}: path escapes project root`);
    }
  }
}

// Type aliases for static analysis
export type FilePathStr = string;
export type FolderPathStr = string;
export type AnyPathStr = string;
