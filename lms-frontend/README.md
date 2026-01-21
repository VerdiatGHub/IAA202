# EduLearn - Online Learning System

A modern, full-featured Learning Management System built with React, TypeScript, and Vite.

## Features

- 🎓 **Student Portal** - Dashboard, course catalog, course viewing with curriculum
- 👨‍🏫 **Instructor Portal** - Course management, student analytics, grading
- 👑 **Admin Portal** - User management, platform statistics
- 🌙 **Dark Mode** - Full dark/light theme support
- 📱 **Responsive** - Works on desktop, tablet, and mobile
- 🎨 **Modern UI** - Glassmorphism, animations, and polished design

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Vanilla CSS with custom design system
- **Routing**: React Router v7
- **Icons**: Lucide React
- **Backend** (optional): Supabase
- **Deployment**: Netlify

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd lms-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit http://localhost:5173

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> **Note**: The app works in "demo mode" without Supabase credentials, using mock data.

## Project Structure

```
src/
├── components/
│   ├── common/      # Reusable UI components
│   └── layout/      # Layout components (Sidebar, Header)
├── contexts/        # React contexts (Auth)
├── lib/             # Utilities (Supabase client)
├── pages/
│   ├── auth/        # Login, Register
│   ├── student/     # Student pages
│   ├── instructor/  # Instructor pages
│   └── admin/       # Admin pages
├── types/           # TypeScript interfaces
├── App.tsx          # Main app with routing
└── index.css        # Global styles & design system
```

## Available Routes

| Route | Description |
|-------|-------------|
| `/login` | Login page |
| `/register` | Registration page |
| `/student` | Student dashboard |
| `/student/catalog` | Course catalog |
| `/student/courses/:id` | Course view |
| `/instructor` | Instructor dashboard |
| `/admin` | Admin dashboard |

## Deployment

### Netlify

1. Push your code to GitHub
2. Connect repository to Netlify
3. Set environment variables in Netlify dashboard
4. Deploy!

The `netlify.toml` file is already configured with:
- Build command and publish directory
- SPA redirect rules
- Security headers

### Manual Build

```bash
npm run build
```

Output will be in the `dist/` directory.

## Demo Mode

Without Supabase credentials, the app runs in demo mode:
- Simulates a logged-in user
- Displays mock course and user data
- All navigation and UI features work normally

## License

MIT
