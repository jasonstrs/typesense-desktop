# Building Typesense Desktop

This guide explains how to build Typesense Desktop for production distribution.

## Quick Start

```bash
npm run build:prod
```

This single command will:
1. Clean previous builds
2. Install dependencies
3. Run type checking
4. Build the application
5. Show you where the installers are located

## Build Output

After building, you'll find the installers in:
```
src-tauri/target/release/bundle/
```

### macOS
- **DMG**: `dmg/typesense-desktop_*.dmg` - Distributable installer
- **App Bundle**: `macos/typesense-desktop.app` - Application bundle

### Windows
- **MSI**: `msi/typesense-desktop_*.msi` - Windows installer
- **EXE**: `nsis/typesense-desktop_*-setup.exe` - NSIS installer (if configured)

### Linux
- **DEB**: `deb/typesense-desktop_*.deb` - Debian/Ubuntu package
- **AppImage**: `appimage/typesense-desktop_*.AppImage` - Universal Linux executable
- **RPM**: `rpm/typesense-desktop_*.rpm` - Red Hat/Fedora package (if configured)

## Manual Build Steps

If you prefer to run the build manually:

```bash
# 1. Install dependencies
npm install

# 2. Run type check
npm run type-check

# 3. Build the application
npm run tauri build
```

## Testing the Build

### macOS
```bash
# Open the app directly
open src-tauri/target/release/bundle/macos/typesense-desktop.app

# Or test the DMG
open src-tauri/target/release/bundle/dmg/*.dmg
```

### Windows
```bash
# Run the installer
./src-tauri/target/release/bundle/msi/*.msi
```

### Linux
```bash
# Run the AppImage
./src-tauri/target/release/bundle/appimage/*.AppImage

# Or install the DEB
sudo dpkg -i src-tauri/target/release/bundle/deb/*.deb
```

## Before Building for Distribution

### 1. Update Version

Edit `src-tauri/tauri.conf.json`:
```json
{
  "version": "1.0.0"
}
```

### 2. Update App Metadata

Edit `src-tauri/tauri.conf.json`:
```json
{
  "productName": "Typesense Desktop",
  "identifier": "com.yourcompany.typesense"
}
```

### 3. Code Signing (macOS)

For distribution outside the Mac App Store, you'll need:
- Apple Developer account ($99/year)
- Developer ID Application certificate

Set up code signing in `src-tauri/tauri.conf.json`:
```json
{
  "bundle": {
    "macOS": {
      "signingIdentity": "Developer ID Application: Your Name (TEAM_ID)"
    }
  }
}
```

### 4. Windows Code Signing

For Windows, you'll need a code signing certificate from a trusted CA.

## Building for Different Platforms

### Current Platform Only
```bash
npm run build:prod
```

### Specific Target
```bash
# macOS DMG only
npm run tauri build -- --target dmg

# Windows MSI only
npm run tauri build -- --target msi

# Linux DEB only
npm run tauri build -- --target deb
```

### Cross-Platform Builds

To build for other platforms, you need to run the build on that platform:
- **For Windows**: Build on a Windows machine
- **For Linux**: Build on a Linux machine
- **For macOS**: Build on a macOS machine

Alternatively, use CI/CD services like GitHub Actions that provide runners for all platforms.

## Troubleshooting

### Build Fails

1. **Check Node version**: Requires Node.js 18 or higher
   ```bash
   node --version
   ```

2. **Clean and rebuild**:
   ```bash
   rm -rf node_modules
   rm -rf src-tauri/target
   npm install
   npm run build:prod
   ```

3. **Check Rust installation**:
   ```bash
   rustc --version
   cargo --version
   ```

### Build is Slow

First build takes 5-10 minutes due to Rust compilation. Subsequent builds are much faster due to caching.

### App Won't Open (macOS)

If you see "App is damaged and can't be opened":
```bash
xattr -cr src-tauri/target/release/bundle/macos/typesense-desktop.app
```

This removes the quarantine attribute. For distribution, you need proper code signing.

## Distribution Checklist

- [ ] Update version number in `tauri.conf.json`
- [ ] Update app metadata (name, identifier)
- [ ] Run `npm run build:prod`
- [ ] Test the built application
- [ ] Test on a clean machine (without dev environment)
- [ ] (Optional) Set up code signing
- [ ] (Optional) Set up auto-updates
- [ ] Create release notes
- [ ] Upload to distribution platform

## CI/CD

For automated builds, see `.github/workflows/` for example GitHub Actions configurations (to be added).

## Resources

- [Tauri Documentation](https://tauri.app/v2/guides/)
- [Tauri Building Guide](https://tauri.app/v2/guides/building/)
- [Code Signing Guide](https://tauri.app/v2/guides/distribution/sign-macos/)
