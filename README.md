# PullSync

A self-hosted, Git-native pull request review system.

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- MongoDB
- Git

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd pullsync

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your settings

# Start development server
npm run dev
```

## Features (Planned)

-  Ultra-fast consensus caching (<100ms response)
-  Unix-style permissions (owner/group/others)
-  Real-time Git synchronization
-  Analytics dashboard for review metrics
-  CLI-powered batch admin tools
-  Instant reviewer notifications (WebSockets/SSE)

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Caching:** Redis / In-memory
- **Real-time:** WebSockets/SSE
- **Version Control:** Git integration
- **Testing:** Jest, Cypress

## Project Structure
```
pullsync/
├── src/
│   ├── controllers/      # Request handlers
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middlewares/     # Express middlewares
│   ├── services/        # Business logic
│   ├── config/          # Configuration files
│   ├── utils/           # Utility functions
│   ├── app.js           # Express app setup
│   └── server.js        # Server entry point
├── public/              # Static assets
├── views/               # HTML templates
├── tests/               # Test files
├── scripts/             # Admin CLI tools
├── docs/                # Documentation
└── package.json
```

## Documentation

- [Setup Guide](docs/SETUP.md)
- [API Documentation](docs/API.md)

## Team

- **Harsh Vardhan Singh** - Project Setup, Landing Page
- **Harsh Gupta** - Authentication UI
- **Devesh Tyagi** - Dashboard UI
- **Gaurav Parashar** - User Backend
- **Garima Yadav** - Repository Backend

## Current Progress

- [x] Project structure
- [x] Landing page
- [ ] Authentication pages
- [ ] Dashboard
- [ ] Backend APIs
- [ ] Database integration

## License

MIT