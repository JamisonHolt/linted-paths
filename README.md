# linted-paths

**⚠️ EXPERIMENTAL PROJECT - WORK IN PROGRESS ⚠️**

This is an experimental TypeScript linter for static analysis of file system operations with complementary runtime validation functions. I vibed this up as a starting point to test in a different project and will probably make a ton of changes in the future as I discover bugs.
AI is pretty terrible at "thinking" of edge cases, so I expect most edge cases to be unhandled

**Important Notes:**
- This package is currently **untested** and **AI-written**
- It is in active development and may have bugs or incomplete features
- Not recommended for production use until proper testing and validation
- The API may change significantly between versions

## Overview

`linted-paths` provides two layers of protection for file system operations:

1. **Static Analysis (Linter)**: Uses named types to identify and analyze file system operations at compile time
2. **Runtime Validation**: Provides runtime functions to validate paths and throw descriptive errors

This dual approach aims to help developers write more reliable file system operations by:

- Using named types to identify and target specific file system operations
- Validating file paths before they're used (both statically and at runtime)
- Ensuring file existence checks are performed
- Catching common file system operation mistakes
- Providing type safety for file system operations

## Features

- **Named Type Targeting**: Uses named types to identify and analyze specific file system operations
- **Static Path Analysis**: Analyzes file paths at compile time to detect potential issues
- **Runtime Validation**: Provides runtime checks with custom error messages
- **Linting Rules**: Simple severity-based configuration (error, warn, off)
- **IDE Integration**: Works with TypeScript-aware editors for better developer experience

## Installation

```bash
npm install linted-paths
```

## Usage

### Static Analysis (Linter)

The library provides type aliases that serve as static flags for the linter:

```typescript
// Type aliases that the linter will validate
type FilePathStr = string;
type FolderPathStr = string;
type AnyPathStr = string;
```

#### Basic Linter Usage

```typescript
import { FilePathStr, FolderPathStr, AnyPathStr } from 'linted-paths';

// The linter will validate these paths exist in your project
const configPath: FilePathStr = 'src/config.json';
const dataPath: FilePathStr = 'src/data/input.csv';
const srcFolder: FolderPathStr = 'src';
const componentsFolder: FolderPathStr = 'src/components';

// Use with Node.js fs operations
import fs from 'fs';

// Safe to use - paths have been statically validated
const content = fs.readFileSync(configPath, 'utf8');
const files = fs.readdirSync(srcFolder);
```

#### Linter Validation Examples

The linter will check that string literals assigned to these types correspond to real paths in your project:

```typescript
// ✅ Valid - these paths exist
const validFile: FilePathStr = 'src/index.ts';
const validFolder: FolderPathStr = 'src/utils';

// ❌ Invalid - these paths don't exist (linter will catch this)
const invalidFile: FilePathStr = 'src/nonexistent.ts';
const validFolder: FolderPathStr = 'src/missing-folder';
```

### Runtime Validation

For additional runtime safety and custom error handling, the library provides validation functions:

```typescript
import { FilePath, FolderPath, AnyPath, getProjectRoot } from 'linted-paths';

// Basic runtime validation (returns the path if valid, throws if invalid)
const configPath = FilePath('./src/config.json');
const dataPath = FilePath('./data/input.csv');

// Runtime validation with custom error messages
const criticalConfig = FilePath('./src/config.json', 'Critical config file is missing');
const userData = FilePath('./data/users.json', 'User data file not found');

// Folder validation with custom errors
const srcFolder = FolderPath('./src', 'Source directory not found');
const buildFolder = FolderPath('./dist', 'Build output directory missing');

// Any path validation
const somePath = AnyPath('./src/components', 'Component directory not found');

// Get the absolute path of the project root
const projectRoot = getProjectRoot();
```

#### Runtime Validation with Custom Errors

All runtime validation functions accept an optional custom error message:

```typescript
// Without custom error (uses default error message)
const path1 = FilePath('./src/index.ts');

// With custom error message
const path2 = FilePath('./src/index.ts', 'Main entry point file is missing');

// Folder validation with custom error
const folder = FolderPath('./src/components', 'Components directory not found');

// Any path with custom error
const anyPath = AnyPath('./src/utils/helpers.ts', 'Helper utilities file missing');
```

### Linter Configuration

Configure the linter with a single rule:

```json
{
  "linted-paths": {
    "rules": {
      "validate-paths": "error"
    }
  }
}
```

#### Rule: `validate-paths`

This rule validates that string literals assigned to `FilePathStr`, `FolderPathStr`, and `AnyPathStr` types correspond to real paths in your project.

**What it checks:**

- File paths assigned to `FilePathStr` exist as files
- Folder paths assigned to `FolderPathStr` exist as directories
- Any paths assigned to `AnyPathStr` exist as either files or directories
- Paths are within the project root (prevents path traversal)
- Paths use valid characters and format

**Severity levels:**

- `"error"` - Treats invalid paths as compilation errors
- `"warn"` - Shows warnings for invalid paths but doesn't fail compilation
- `"off"` - Disables path validation entirely

## API Reference

### Type Aliases (Static Analysis)

- `FilePathStr` - Type alias for file paths that the linter will validate
- `FolderPathStr` - Type alias for folder paths that the linter will validate
- `AnyPathStr` - Type alias for any path (file or folder) that the linter will validate

### Runtime Functions

- `FilePath(path: string, errorMessage?: string): string` - Runtime validation for file paths
- `FolderPath(path: string, errorMessage?: string): string` - Runtime validation for folder paths
- `AnyPath(path: string, errorMessage?: string): string` - Runtime validation for any path
- `getProjectRoot(): string` - Gets the absolute path of the project root

### Error Handling

When runtime validation fails, the functions throw descriptive errors:

```typescript
try {
  const path = FilePath('./nonexistent.ts', 'Required file is missing');
} catch (error) {
  console.error(error.message); // "Required file is missing"
}

try {
  const folder = FolderPath('./missing-folder', 'Build directory not found');
} catch (error) {
  console.error(error.message); // "Build directory not found"
}
```

## Contributing

This project is currently in experimental phase. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT

## Roadmap

### Phase 1: Core Implementation

- [ ] Implement basic linter that validates string literals assigned to type aliases
- [ ] Create runtime validation functions (`FilePath`, `FolderPath`, `AnyPath`)
- [ ] Implement project root detection
- [ ] Add path existence validation
- [ ] Implement path traversal prevention
- [ ] Create TypeScript type definitions

### Phase 2: Linter Enhancement

- [ ] Add support for different severity levels (error, warn, off)
- [ ] Implement configuration system for the `validate-paths` rule
- [ ] Add support for relative and absolute path validation
- [ ] Improve error messages with specific validation failures
- [ ] Add support for path format validation (invalid characters, etc.)

### Phase 3: Testing & Documentation

- [ ] Create comprehensive test suite for linter rules
- [ ] Add tests for runtime validation functions
- [ ] Create integration tests with TypeScript compiler
- [ ] Improve documentation with more examples
- [ ] Add troubleshooting guide for common issues

### Phase 4: Performance & Stability

- [ ] Optimize linter performance for large projects
- [ ] Add caching for file system checks
- [ ] Implement incremental validation
- [ ] Add support for workspace/monorepo configurations
- [ ] Improve error handling and recovery
