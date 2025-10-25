# Typesense Desktop

<div align="center">

**A modern, cross-platform desktop application for managing Typesense search instances**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub release](https://img.shields.io/github/release/jasonstrs/typesense-desktop.svg)](https://github.com/jasonstrs/typesense-desktop/releases)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-blue)]()

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Building from Source](#building-from-source) • [Contributing](#contributing)

</div>

---

## What is Typesense Desktop?

Typesense Desktop is a native desktop application that provides a beautiful, intuitive interface for managing your [Typesense](https://typesense.org/) search instances. Whether you're running a local development server or managing production clusters, Typesense Desktop makes it easy to:

- 🔌 Connect to multiple Typesense instances
- 📊 Manage collections and schemas
- 📄 Browse, create, edit, and delete documents
- 🔍 Perform full-text searches with visual filters
- 🔒 Store API keys securely in your OS credential manager

No more fumbling with curl commands or API clients - manage everything through a clean, modern interface.

---

## Features

### 🔐 Connection Management
- Add, edit, and delete multiple Typesense connections
- Support for local, staging, and production environments
- **Secure API key storage** using OS native credential managers:
  - macOS: Keychain
  - Windows: Credential Manager
  - Linux: Secret Service (libsecret)
- Test connections before saving
- Quick switch between active connections

### 📚 Collection Management
- View all collections with real-time document counts
- Create new collections with visual schema builder
- View detailed collection schemas and metadata
- Delete collections with safety confirmations
- Modern card-based grid layout

### 📄 Document Management
- Browse documents in any collection with pagination
- Add new documents with JSON editor
- Edit existing documents
- **Bulk operations**: Multi-select and delete documents
- Card-based view with automatic image rendering
- Stacked field layout for better readability

### 🔍 Advanced Search
- **Dual search modes**:
  - **Instant Search Mode** (default): Visual filter builder with auto-detected fields
  - **JSON Mode**: Direct Typesense query parameter editing for power users
- **Smart filtering**:
  - Numeric fields: Min/max range inputs
  - String fields: Partial matching with wildcard support
  - Auto-detected sortable fields only
- Search term highlighting in results
- Image URL auto-detection and rendering (max 200×200px)
- Sort by any sortable field with asc/desc options
- Responsive flex-based results grid

### 🎨 Modern UI/UX
- Clean, intuitive interface
- Dark mode support (follows OS preference)
- Responsive layouts that adapt to screen size
- Card-based views across all modules
- Consistent styling and spacing

---

## Installation

### macOS

1. **Download** the latest `Typesense-Desktop_1.0.0.dmg` from [Releases](https://github.com/jasonstrs/typesense-desktop/releases)

2. **Open the DMG** and drag **Typesense Desktop.app** to your **Applications** folder

3. **Remove quarantine flag** (required for unsigned apps):
   ```bash
   xattr -cr "/Applications/Typesense Desktop.app"
   ```

4. **Launch** from your Applications folder

> **Why the terminal command?** macOS Gatekeeper marks apps from unidentified developers as "damaged". The `xattr` command removes this flag safely. See `INSTALL_MACOS.txt` in the DMG for more details.

---

### Windows

1. **Download** the latest `Typesense-Desktop_1.0.0.msi` from [Releases](https://github.com/jasonstrs/typesense-desktop/releases)

2. **Double-click** the MSI file to launch the installer

3. **Follow** the installation wizard

4. **Launch** from the Start Menu

> **Windows SmartScreen**: You may see a warning on first launch. Click "More info" → "Run anyway"

---

### Linux (Debian/Ubuntu)

1. **Download** the latest `typesense-desktop_1.0.0_amd64.deb` from [Releases](https://github.com/jasonstrs/typesense-desktop/releases)

2. **Install** the package:
   ```bash
   sudo dpkg -i typesense-desktop_1.0.0_amd64.deb
   ```

3. **Launch** from your applications menu or run:
   ```bash
   typesense-desktop
   ```

> **Dependencies**: Requires `libsecret` for secure credential storage (usually pre-installed on GNOME/KDE desktops)

---

## Usage

### First Launch

1. **Add your first connection**:
   - Click **"Add Connection"** in the Connections view
   - Enter a name (e.g., "Local Dev")
   - Provide your Typesense URL (e.g., `http://localhost:8108`)
   - Enter your Admin API key
   - Click **"Test Connection"** to verify
   - Click **"Save"**

2. **Navigate to Collections** to view and manage your collections

3. **Click on a collection** to browse documents or use the Search view for advanced queries

### Quick Tips

- **Multiple Connections**: Add as many connections as you need (local, staging, production)
- **Instant Search**: Start typing in the search bar - results update automatically with debouncing
- **JSON Mode**: Switch to JSON mode in filters for direct control over Typesense query parameters
- **Image Fields**: URLs ending in `.jpg`, `.png`, etc. are automatically rendered as images
- **Bulk Operations**: Use checkboxes in Document view for multi-select operations

---

## Building from Source

### Prerequisites

- **Node.js** v22.20.0 (use `.nvmrc` for automatic version management)
- **Rust** 1.70+ (for Tauri)
- **Platform-specific requirements**:
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Visual Studio Build Tools
  - **Linux**: `build-essential`, `libwebkit2gtk-4.0-dev`, `libssl-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`, `libsecret-1-dev`

### Development

```bash
# Clone the repository
git clone https://github.com/jasonstrs/typesense-desktop.git
cd typesense-desktop

# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Run type checking
npm run type-check
```

### Production Build

```bash
# Build for your current platform
npm run tauri build

# Or use the build script with platform detection
npm run build:prod

# Build artifacts will be in:
# - macOS: src-tauri/target/release/bundle/dmg/
# - Windows: src-tauri/target/release/bundle/msi/
# - Linux: src-tauri/target/release/bundle/deb/
```

---

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Desktop Framework**: Tauri v2 (Rust)
- **UI Library**: shadcn/ui + Tailwind CSS v4
- **State Management**: Zustand + TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **API Client**: Typesense JavaScript Client
- **Secure Storage**: Tauri Plugin Keyring + Store

---

## Security & Privacy

- ✅ **API keys stored securely** in OS-native credential managers (never in plain text)
- ✅ **No cloud sync or telemetry** - all data stays local on your machine
- ✅ **Open source** - audit the code yourself
- ✅ **No network requests** except to your Typesense instances

---

## Contributing

Contributions are welcome! Whether it's bug reports, feature requests, or pull requests:

1. Check existing [Issues](https://github.com/jasonstrs/typesense-desktop/issues) first
2. Fork the repository
3. Create a feature branch (`git checkout -b feature/amazing-feature`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to your branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Typesense](https://typesense.org/) - The blazing-fast search engine this app manages
- [Tauri](https://tauri.app/) - For the excellent desktop framework
- [shadcn/ui](https://ui.shadcn.com/) - For the beautiful UI components

---

## Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/jasonstrs/typesense-desktop/issues)
- 💬 **Questions**: [GitHub Discussions](https://github.com/jasonstrs/typesense-desktop/discussions)
- ⭐ **Star the repo** if you find it useful!

---

<div align="center">

**Made with ❤️ for the Typesense community**

</div>
