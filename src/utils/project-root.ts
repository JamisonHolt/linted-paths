import fs from 'fs';
import path from 'path';

/**
 * Finds the project root by looking for common markers
 */
export function findProjectRoot(startDir?: string): string {
  let currentDir = startDir || process.cwd();
  
  const markers = [
    '.git',
    'package.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'package-lock.json',
    'lerna.json',
    'nx.json',
    'workspace.json',
  ];
  
  while (currentDir !== path.dirname(currentDir)) {
    for (const marker of markers) {
      if (fs.existsSync(path.join(currentDir, marker))) {
        return currentDir;
      }
    }
    currentDir = path.dirname(currentDir);
  }
  
  throw new Error('Could not find project root. Make sure you are in a project directory with package.json or .git');
}

/**
 * Checks if a directory is likely a project root
 */
export function isProjectRoot(dir: string): boolean {
  try {
    findProjectRoot(dir);
    return true;
  } catch {
    return false;
  }
}
