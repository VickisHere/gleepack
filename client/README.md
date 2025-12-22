# GleePack Client

A React-based frontend for the GleePack event kit ordering system.

## Features

- Browse and order event kits (birthday, anniversary, festival)
- User authentication and registration
- Shopping cart and checkout
- Admin panel for managing products and orders
- Responsive design with Tailwind CSS

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components
- React Router
- Socket.io client

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:8080](http://localhost:8080) in your browser.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/            # React contexts (Auth, Cart, Language)
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
├── pages/               # Page components
└── main.tsx             # App entry point
```
