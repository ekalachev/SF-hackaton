# Git Hooks for OilField Project

This directory contains git hooks that enforce git flow workflow and code quality standards.

## Installed Hooks

### pre-commit
Runs before each commit to:
- ✅ Enforce git flow branch naming (feature/, release/, hotfix/, bugfix/, support/)
- ✅ Prevent direct commits to main/master branches
- ✅ Run TypeScript type checking (tsc --noEmit)
- ✅ Run ESLint on TypeScript/JavaScript code
- ✅ Run unit tests
- ✅ Run Python linters (black, flake8, mypy) if applicable

### commit-msg
Validates commit messages:
- ✅ Ensures commit message is not empty
- ✅ Enforces minimum message length (10 characters)
- ✅ Allows git flow merge commits

### pre-push
Runs before pushing to remote:
- ✅ Prevents direct push to main/master (except git flow finish)
- ✅ Runs full integration test suite
- ✅ Validates all tests pass before push

### prepare-commit-msg
Enhances commit messages:
- ✅ Automatically adds ticket/issue numbers from branch names
- ✅ Format: `[TICKET-123] Your commit message`

## Setup

To enable these hooks in your local repository:

```bash
git config core.hooksPath .githooks
```

This command has already been run if you cloned this repository.

## Git Flow Workflow

### Starting a Feature
```bash
git flow feature start <feature-name>
# or
git flow feature start TICKET-123-feature-description
```

### Finishing a Feature
```bash
git flow feature finish <feature-name>
```

### Starting a Release
```bash
git flow release start <version>
# e.g., git flow release start 0.4.0
```

### Finishing a Release
```bash
git flow release finish <version>
```

### Starting a Hotfix
```bash
git flow hotfix start <version>
# e.g., git flow hotfix start 0.3.1
```

### Finishing a Hotfix
```bash
git flow hotfix finish <version>
```

## Allowed Branch Names

- `feature/*` - New features
- `release/*` - Release preparation
- `hotfix/*` - Production hotfixes
- `bugfix/*` - Bug fixes
- `support/*` - Support branches
- `develop` - Development branch (limited commits)

## Bypassing Hooks (Emergency Only)

If you absolutely need to bypass hooks (not recommended):

```bash
git commit --no-verify
git push --no-verify
```

⚠️ **Warning**: Only use `--no-verify` in emergencies. Hooks exist to maintain code quality.

## Troubleshooting

### Hooks not running
```bash
# Verify hooks path is configured
git config core.hooksPath

# Should output: .githooks
```

### Make hooks executable
```bash
chmod +x .githooks/*
```

### Linter not found
Ensure you've installed dependencies:
```bash
cd backend && npm install
cd ../frontend && npm install
```

## Testing Hooks

Test hooks without committing:

```bash
# Test pre-commit
.githooks/pre-commit

# Test commit-msg
echo "Test commit message" > /tmp/test-msg
.githooks/commit-msg /tmp/test-msg
```
