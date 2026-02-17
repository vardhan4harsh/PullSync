# PullSync

A self-hosted, Git-native pull request review system with real-time collaboration.

## Project Status

**Current Phase:** Initial Setup (v0.1.0)

This project is in early development. The initial skeleton is being established.

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

##  Getting Started

> **Note:** Setup instructions will be added as the project develops.

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

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
```

## Documentation

- [Setup Guide](docs/SETUP.md)
- [API Documentation](docs/API.md)

## Contributing

This is our university project. Contributions and suggestions are welcome!

## License

MIT