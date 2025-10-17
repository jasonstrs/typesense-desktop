# Typesense Desktop

A cross-platform desktop application for managing Typesense instances, built with Tauri v2, React, and TypeScript.

## Features

### ✅ Currently Implemented (Phase 1-2)

- **Connection Management**
  - Add/edit/delete Typesense connections
  - Support for multiple environments (local, staging, production)
  - Secure API key storage using OS keychain with fallback
  - Test connections before saving
  - Switch between active connections

- **Collections Management**
  - View all collections with metadata
  - Create new collections with schema builder
  - View detailed collection information
  - Delete collections
  - Real-time document counts

### 🚧 Planned Features

- **Document Management** (Phase 3)
  - Browse documents in collections
  - Add, edit, and delete documents
  - Bulk operations
  - JSON editor for documents

- **Search Interface** (Phase 4)
  - Visual query builder
  - Full-text search across collections
  - Search parameter customization
  - Results visualization

- **Advanced Features** (Phase 5)
  - Command palette for quick actions
  - Keyboard shortcuts
  - Dark mode support
  - Export/import configurations

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Desktop Framework**: Tauri v2 (Rust)
- **UI Components**: shadcn/ui + Tailwind CSS v4
- **State Management**: Zustand + TanStack Query
- **Form Handling**: React Hook Form + Zod
- **API Client**: Typesense JS Client
- **Secure Storage**: Tauri Plugin Store + Keyring

## Prerequisites

- Node.js v22.20.0 (use `.nvmrc` for automatic version management)
- Rust 1.70+ (for Tauri)
- macOS 10.15+, Windows 10+, or Linux

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

### First Run

1. Launch the application
2. Add your first Typesense connection:
   - Enter a connection name (e.g., "Local Dev")
   - Provide the Typesense URL (e.g., `http://localhost:8108`)
   - Enter your API key
   - Test the connection
   - Save

3. Navigate to Collections to start managing your Typesense data

## Project Structure

```
typesense-desktop/
├── src/                          # React frontend source
│   ├── components/              # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── Collections/        # Collection-related components
│   │   ├── Connections/        # Connection-related components
│   │   └── Layout/             # Layout components
│   ├── views/                   # Page-level components
│   ├── hooks/                   # Custom React hooks
│   ├── services/                # Business logic & API clients
│   ├── stores/                  # Zustand state stores
│   ├── types/                   # TypeScript type definitions
│   └── lib/                     # Utilities & helpers
├── src-tauri/                   # Rust backend
│   ├── src/                    # Rust source code
│   ├── Cargo.toml             # Rust dependencies
│   └── tauri.conf.json        # Tauri configuration
└── TYPESENSE_DESKTOP_PLAN.md   # Detailed development plan
```

## Security

- **API Key Storage**: API keys are stored securely using the OS keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service) with an encrypted fallback store
- **Local Data**: Connection metadata is stored in encrypted local storage
- **No Cloud**: All data stays on your machine - no cloud sync or telemetry

## Development Roadmap

See [TYPESENSE_DESKTOP_PLAN.md](./TYPESENSE_DESKTOP_PLAN.md) for the complete development plan and timeline.

**Current Status**: Phase 2 Complete ✅

## Known Issues

- macOS keychain has reliability issues in development mode - fallback storage is used as primary
- Delete operations currently have no confirmation dialog (intentional for testing)

## Contributing

This is a personal project, but suggestions and feedback are welcome! Please open an issue to discuss any changes.

## License

MIT

## Acknowledgments

- [Typesense](https://typesense.org/) - The amazing search engine this app manages
- [Tauri](https://tauri.app/) - For the excellent desktop framework
- [shadcn/ui](https://ui.shadcn.com/) - For the beautiful UI components
