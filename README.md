# BCNL — React + Vite + Tailwind

Simple starter for a React app using Vite with Tailwind CSS and ESLint. This project includes HMR (fast refresh), Tailwind configuration, and common dev scripts.

## Quick Start

Prerequisites:
- Node.js 16+ (recommended)
- Git

1) Clone the repository

```bash
git clone <repository-url>
cd <repository-folder>
```

Replace `<repository-url>` with your repository's git URL and `<repository-folder>` with the created folder name.

2) Install dependencies

```bash
npm install
```

3) Run the dev server (hot reloading)

```bash
npm run dev
```

Open http://localhost:5173 (Vite default) in your browser.

4) Build for production

```bash
npm run build
```


## What’s included
- Vite (dev server & build): configured in `vite.config.js`
- React (JSX) application entry: `src/main.jsx` and `src/App.jsx`
- Tailwind CSS: configured via `tailwind.config.js` and `postcss.config.js`

## Code Quality

The project uses:

- ESLint — Code linting (Antfu's config)
- Prettier — Code formatting
- Stylelint — CSS/SCSS linting
