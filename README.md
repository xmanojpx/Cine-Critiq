# Cine Critiq 🎬

A modern movie review and discovery platform built with React, TypeScript, and Express.

## Features 🌟

- **Movie Discovery**: Browse trending, popular, and top-rated movies
- **Search Functionality**: Search for movies by title, genre, or keywords
- **Detailed Movie Information**: View comprehensive details about movies including cast, ratings, and reviews
- **Genre Filtering**: Filter movies by specific genres
- **Responsive Design**: Fully responsive UI that works on desktop and mobile devices
- **Modern UI**: Built with Tailwind CSS and Shadcn UI components

## Tech Stack 💻

- **Frontend**:
  - React
  - TypeScript
  - Tailwind CSS
  - Shadcn UI
  - React Query
  - Wouter (Router)

- **Backend**:
  - Express.js
  - TypeScript
  - Drizzle ORM
  - Neon Database

- **APIs**:
  - TMDB API for movie data

## Getting Started 🚀

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/xmanojpx/Cine-Critiq.git
   cd Cine-Critiq
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your TMDB API key:
   ```env
   TMDB_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`

## Project Structure 📁

```
├── client/             # Frontend React application
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/     # Page components
│   │   ├── hooks/     # Custom React hooks
│   │   └── services/  # API services
├── server/            # Backend Express application
│   ├── routes/       # API routes
│   └── services/     # Business logic
└── shared/           # Shared types and utilities
```

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License 📝

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- [TMDB](https://www.themoviedb.org/) for providing the movie data API
- [Shadcn UI](https://ui.shadcn.com/) for the beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework 