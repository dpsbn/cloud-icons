# Contributing to Cloud Icons API

Thank you for your interest in contributing to the Cloud Icons API project! This guide will help you get started with the development process and explain how to contribute effectively.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Adding New Icons](#adding-new-icons)
- [Adding New Cloud Providers](#adding-new-cloud-providers)

## Development Setup

### Prerequisites

- Node.js (v18 or later)
- npm (v8 or later)
- Redis (optional, for enhanced caching)
- Git

### Setting Up the Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/cloudicons.git
   cd cloudicons
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up environment variables:
   ```bash
   cd api
   cp .env.example .env
   ```
   Edit the `.env` file to configure your environment.

5. Start the development servers:
   ```bash
   # In one terminal, start the API server
   npm run dev:api
   
   # In another terminal, start the web application
   npm run dev:web
   ```

6. The API will be available at http://localhost:3002 and the web application at http://localhost:3000

## Project Structure

The project is organized as a monorepo with the following structure:

```
cloudicons/
├── api/                  # Backend API
│   ├── controllers/      # API controllers
│   ├── middleware/       # Express middleware
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   └── tests/            # API tests
├── cloudicons-web/       # Frontend web application
│   ├── public/           # Static assets
│   └── src/              # Source code
│       ├── app/          # Next.js app directory
│       ├── components/   # React components
│       ├── hooks/        # Custom React hooks
│       └── utils/        # Utility functions
├── data/                 # Icon data
│   └── icons.json        # Icon metadata
├── docs/                 # Documentation
└── public/               # Public assets
    └── icons/            # SVG icon files
```

## Coding Standards

This project follows strict coding standards to maintain code quality and consistency:

### TypeScript

- Use TypeScript for all new code
- Define proper types for all functions, variables, and components
- Avoid using `any` type when possible
- Use interfaces for object shapes and types for unions/primitives

### Formatting and Linting

The project uses ESLint and Prettier for code formatting and linting:

- Run linting: `npm run lint`
- Fix linting issues: `npm run lint:fix`
- Format code: `npm run format`

Pre-commit hooks will automatically check and format your code before commits.

### Naming Conventions

- **Files**: Use camelCase for utility files, PascalCase for components
- **Functions**: Use camelCase
- **Components**: Use PascalCase
- **Interfaces/Types**: Use PascalCase with a descriptive name
- **Constants**: Use UPPER_SNAKE_CASE for true constants

### Code Organization

- Keep functions small and focused on a single responsibility
- Use JSDoc comments for all public functions
- Group related functions in appropriate service/utility files
- Separate business logic (services) from API endpoints (controllers)

## Testing

The project uses Jest for testing:

### Running Tests

- Run all tests: `npm test`
- Run tests with coverage: `npm run test:coverage`
- Run tests in watch mode: `npm run test:watch`

### Writing Tests

- Write unit tests for all services and utilities
- Write integration tests for API endpoints
- Aim for at least 80% code coverage
- Test both success and error cases
- Use descriptive test names that explain the expected behavior

## Pull Request Process

1. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes, following the coding standards

3. Add tests for your changes

4. Run the test suite to ensure all tests pass:
   ```bash
   npm test
   ```

5. Update documentation if necessary

6. Commit your changes with a descriptive commit message:
   ```bash
   git commit -m "Add feature: your feature description"
   ```

7. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

8. Create a Pull Request against the main repository's `main` branch

9. Respond to any feedback from code reviews

## Adding New Icons

To add new icons to the project:

1. Prepare the SVG files:
   - Optimize SVGs using a tool like SVGO
   - Ensure consistent styling and sizing
   - Place the SVG files in the appropriate provider directory under `/public/icons/`

2. Update the icon metadata in `/data/icons.json`:
   ```json
   {
     "id": "your-icon-id",
     "provider": "provider-name",
     "icon_name": "Display Name",
     "description": "Description of the icon",
     "tags": ["relevant", "tags"],
     "svg_path": "/icons/provider-name/your-icon-id.svg",
     "license": "License information"
   }
   ```

3. Test that the icon appears correctly in the web application

## Adding New Cloud Providers

To add a new cloud provider:

1. Create a new directory for the provider under `/public/icons/`:
   ```bash
   mkdir -p public/icons/new-provider
   ```

2. Add SVG icons for the provider to this directory

3. Add metadata for each icon to `/data/icons.json` as described above

4. Test that the provider appears in the provider selector and that icons display correctly

---

Thank you for contributing to the Cloud Icons API project! If you have any questions or need help, please open an issue on GitHub.