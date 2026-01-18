---
description: Major code cleanup, bug fixing, optimization, and standardization workflow
---

# Code Cleanup, Bug Fix & Optimization Workflow

This workflow provides a systematic approach to cleaning up, fixing bugs, optimizing, and standardizing code in the Sage codebase.

---

## Phase 1: Pre-Cleanup Assessment

### 1.1 Run Quality Gates

// turbo

```bash
npm run lint
```

// turbo

```bash
npm run build
```

// turbo

```bash
npm test
```

### 1.2 Generate Baseline Report

Document the current state:

- Count of lint warnings/errors
- Count of TypeScript errors
- Test pass/fail count
- Note any console warnings during build

### 1.3 Identify Problem Areas

Scan the codebase for:

**Bug Patterns:**

- Unhandled promise rejections (missing `.catch()` or try/catch)
- Null/undefined access without guards
- Race conditions in async code
- Memory leaks (unregistered event listeners, unclosed connections)
- Duplicate declarations or imports

**Code Smells:**

- Functions > 50 lines
- Files > 300 lines
- Deeply nested conditionals (> 3 levels)
- Magic numbers/strings
- Commented-out code blocks
- TODO/FIXME comments

**Standardization Issues:**

- Inconsistent naming conventions
- Mixed async patterns (callbacks vs promises vs async/await)
- Inconsistent error handling
- Missing or inconsistent type annotations

---

## Phase 2: Bug Fixes (Priority Order)

### 2.1 Critical Bugs

Fix bugs that could cause:

- Application crashes
- Data corruption
- Security vulnerabilities

### 2.2 High-Priority Bugs

Fix bugs that cause:

- Incorrect behavior
- Poor user experience
- Race conditions

### 2.3 Low-Priority Bugs

Fix:

- Edge case handling
- Minor UI/UX issues
- Non-critical warnings

**For each bug fix:**

1. Document the bug
2. Write a test case that reproduces it (if applicable)
3. Implement the fix
4. Verify the test passes
5. Run full test suite to ensure no regressions

---

## Phase 3: Code Optimization

### 3.1 Performance Optimization

- Identify slow operations (database queries, API calls)
- Implement caching where appropriate
- Optimize loops and data transformations
- Reduce redundant computations

### 3.2 Memory Optimization

- Clean up event listeners properly
- Close database connections
- Clear timeouts/intervals
- Remove circular references

### 3.3 Bundle/Build Optimization

- Remove unused dependencies
- Tree-shake dead code
- Optimize imports (avoid `import *`)

---

## Phase 4: Standardization

### 4.1 Code Style

Ensure consistency across codebase:

**Naming Conventions:**

- Files: `kebab-case.ts` or `camelCase.ts` (pick one, be consistent)
- Classes: `PascalCase`
- Functions/methods: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Interfaces/Types: `PascalCase` with optional `I` prefix for interfaces

**Formatting:**
// turbo

```bash
npx prettier --write "src/**/*.ts"
```

### 4.2 Error Handling Standardization

Establish patterns:

- Use custom error classes for domain errors
- Consistent error logging format
- Proper error propagation
- User-friendly error messages

### 4.3 Async Pattern Standardization

- Prefer `async/await` over raw Promises
- Use `try/catch` for async error handling
- Avoid mixing patterns in same file

### 4.4 Import Organization

Order imports consistently:

1. Node.js built-ins
2. External packages (npm)
3. Internal modules (absolute paths)
4. Relative imports
5. Type imports

### 4.5 TypeScript Strictness

- Enable strict mode if not already
- Remove `any` types where possible
- Add proper type annotations
- Use generics appropriately

---

## Phase 5: Documentation & Cleanup

### 5.1 Remove Dead Code

- Delete unused functions/classes
- Remove commented-out code
- Delete unused imports
- Remove unused variables

### 5.2 Update Documentation

- Update JSDoc comments
- Ensure README accuracy
- Document non-obvious logic
- Update API documentation

### 5.3 Organize Files

- Move misplaced files to correct directories
- Consolidate related functionality
- Split oversized files
- Remove empty/stub files

---

## Phase 6: Verification

### 6.1 Run All Quality Gates

// turbo

```bash
npm run lint
```

// turbo

```bash
npm run build
```

// turbo

```bash
npm test
```

### 6.2 Run Certification (if available)

// turbo

```bash
npm run cert
```

### 6.3 Manual Verification

- Test critical user flows
- Verify no regressions
- Check console for warnings

### 6.4 Create Summary Report

Document:

- All bugs fixed (with brief description)
- Optimizations implemented
- Standardization changes made
- Before/after metrics (lint errors, test count, etc.)

---

## Quick Reference Checklist

```
[ ] Phase 1: Assessment
    [ ] Run initial quality gates
    [ ] Document baseline metrics
    [ ] Identify problem areas
    
[ ] Phase 2: Bug Fixes
    [ ] Fix critical bugs
    [ ] Fix high-priority bugs
    [ ] Fix low-priority bugs
    [ ] Write tests for fixed bugs
    
[ ] Phase 3: Optimization
    [ ] Performance optimizations
    [ ] Memory leak fixes
    [ ] Dependency cleanup
    
[ ] Phase 4: Standardization
    [ ] Apply consistent naming
    [ ] Standardize error handling
    [ ] Standardize async patterns
    [ ] Organize imports
    [ ] TypeScript strictness
    
[ ] Phase 5: Cleanup
    [ ] Remove dead code
    [ ] Update documentation
    [ ] Organize file structure
    
[ ] Phase 6: Verification
    [ ] All quality gates pass
    [ ] Manual testing complete
    [ ] Summary report created
```

---

## Notes

- **Commit Frequently**: Make small, focused commits after each logical unit of work
- **Document Changes**: Keep a running log of significant changes for the changelog
- **Test Early, Test Often**: Run tests after each change to catch regressions early
- **Prioritize Safety**: When in doubt, prefer safer changes over aggressive optimizations
