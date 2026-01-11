# OilField MVP - Frontend

Modern React application built with Vite, TypeScript, and Tailwind CSS.

## Tech Stack

### Core
- React 18.2
- TypeScript 5.9
- Vite 7.1 (build tool)

### UI & Styling
- Tailwind CSS 3.4
- shadcn/ui (component library)
- Radix UI (primitives)
- Lucide React (icons)

### Mapping
- Mapbox GL JS 3.0
- react-map-gl (React wrapper)

### Charts & Animation
- Recharts 2.10 (charting library)
- Framer Motion 10.0 (animations)
- react-countup 6.5 (number animations)

### State Management
- Zustand 4.4 (lightweight state management)

### Data Fetching
- TanStack Query 5.0 (React Query)
- Axios (HTTP client)

### Forms & Validation
- React Hook Form 7.48
- Zod 3.x (schema validation)

### Utilities
- date-fns 2.30 (date handling)
- numeral 2.0.6 (number formatting)

### Testing
- Vitest 2.x
- React Testing Library 14.x
- jsdom 25.x

## Setup

```bash
# Install dependencies
npm install

# Start development server (runs on port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Development

```bash
# Run tests
npm test

# Run tests with UI
npm test:ui

# Run tests with coverage
npm test:coverage

# Run linter
npm run lint

# Type checking
npx tsc --noEmit
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
VITE_API_URL=http://localhost:3000/api
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

## Project Structure

```
src/
├── components/
│   └── ui/              # shadcn/ui components
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
│   └── utils.ts        # cn() function for class merging
├── store/              # Zustand stores
├── styles/             # Global styles
├── test/               # Test setup and utilities
│   └── setup.ts        # Test configuration
├── App.tsx             # Main app component
├── App.test.tsx        # App component tests
├── main.tsx            # Application entry point
└── index.css           # Global CSS with Tailwind directives
```

## Features

- Hot Module Replacement (HMR) with Vite
- TypeScript with strict mode enabled
- Tailwind CSS with custom theme and dark mode support
- Path aliases configured (@/* for src/*)
- ESLint for code quality
- Vitest for unit testing
- React Testing Library for component testing

## Notes

- Port 5173 is configured as the default development server port
- All dependencies are installed and verified
- TypeScript strict mode is enabled
- ESLint passes with no errors
- All tests pass successfully
