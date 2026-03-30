# Contributing to Omni

## Development Workflow

### Branch Conventions

- `main` - production-ready code, protected branch
- `feature/*` - new features (e.g., `feature/task-filters`)
- `fix/*` - bug fixes (e.g., `fix/auth-token-expiry`)
- `refactor/*` - code refactoring (e.g., `refactor/database-layer`)
- `docs/*` - documentation updates (e.g., `docs/api-endpoints`)

### Git Workflow

1. Create a feature branch from `main`:

   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit with clear messages:

   ```bash
   git add .
   git commit -m "Add task filtering by priority"
   ```

3. Push your branch and create a pull request:
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Guidelines

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- First line should be 50 characters or less
- Reference issue numbers when applicable (e.g., "Fix #123: Resolve auth bug")

Examples:

- `Add user authentication endpoints`
- `Fix task deletion cascade issue`
- `Refactor database connection pooling`
- `Update API documentation for projects`

## Pull Request Process

1. Fill out the PR template completely
2. Ensure all CI checks pass
3. Request review from at least one team member
4. Address review comments
5. Squash commits if needed before merging
6. Delete branch after merge

### PR Requirements

- [ ] Code builds successfully (`npm run build`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Server builds successfully (`npm run server:build`)
- [ ] Linting passes (`npm run lint`)
- [ ] Formatting passes (`npm run format`)
- [ ] All tests pass (when test suite is implemented)
- [ ] Code follows project conventions
- [ ] Documentation updated if needed

## Local Quality Gates

### Automated Pre-commit Hooks

Pre-commit hooks are configured to automatically run on every commit:

- **Lint**: Runs `eslint --fix` on staged TypeScript files
- **Format**: Runs `prettier --write` on staged files

The commit will be blocked if linting fails. Most issues are auto-fixed.

### Manual Quality Checks

Before pushing code, these commands are recommended:

```bash
# Type check
npm run typecheck

# Build client
npm run build

# Build server
npm run server:build

# Run tests
npm test
```

All commands must pass without errors.

## File Operation Guardrails

Before modifying files programmatically, observe these safety rules:

1. **ALWAYS use the Read tool first** to examine the current file contents before overwriting:

   ```bash
   # Example: Read file before modifying
   # First read the file content using the Read tool
   # Verify the file exists and understand its current contents
   # Then make your changes only if appropriate
   # Finally write the updated content
   ```

2. **Validate file existence** before operations:
   - Check that files exist before attempting to read or modify them
   - Handle missing files gracefully with appropriate error messages
   - Verify file paths are correct before operations

3. **Validate tool inputs** before calling tools:
   - Ensure all required parameters are provided to tools like Glob, Read, Edit, etc.
   - Verify parameter types match expected schema (e.g., string patterns for Glob)
   - Double-check file paths and patterns before execution

4. **Always backup important files** before major changes:

   ```bash
   cp important_file.md important_file.md.backup
   ```

5. **Verify file operations succeed before proceeding**:
   - Check exit codes after file operations
   - Confirm expected content was written correctly
   - Use version control to track changes
   - Test that modified files still function as expected

## Code Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Define proper types, avoid `any`
- Use interfaces for object shapes
- Use enums for fixed sets of values

### File Organization

```
src/
├── config/          # Configuration files
├── middleware/      # Express middleware
├── models/          # Database models
├── routes/          # API route handlers
├── services/        # Business logic
└── server.ts        # Application entry point
```

### Naming Conventions

- Files: `camelCase.ts` or `PascalCase.ts` for classes
- Variables/Functions: `camelCase`
- Classes/Interfaces: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Database tables: `snake_case`

### API Design

- Use RESTful conventions
- Proper HTTP status codes
- Consistent error response format
- Version APIs when breaking changes occur

### Security

- Never commit secrets or API keys
- Use environment variables for configuration
- Validate all user inputs
- Sanitize database queries
- Use helmet for security headers

## Environment Setup

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up database:

   ```bash
   # Make sure PostgreSQL is running
   # Set DATABASE_URL in your .env file
   # Run migrations to set up the database schema
   npm run migrate
   ```

4. Run development server:

   ```bash
   npm run server
   ```

5. Run client development server:
   ```bash
   npm run dev
   ```

## Testing (Coming Soon)

- Unit tests with Jest
- Integration tests for API endpoints
- E2E tests with Cypress
- Minimum 80% code coverage target

## Questions?

Contact the team or open an issue for clarification.
