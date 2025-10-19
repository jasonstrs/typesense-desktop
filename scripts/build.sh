#!/bin/bash

# Typesense Desktop Build Script
# This script builds the application for production
#
# Usage:
#   ./scripts/build.sh              # Build for current platform only
#   ./scripts/build.sh --all        # Build all formats for current platform
#   npm run build:prod              # Same as no args
#   npm run build:prod -- --all     # Build all formats

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
BUILD_ALL=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --all)
            BUILD_ALL=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo -e "${YELLOW}Usage:${NC}"
            echo -e "  ./scripts/build.sh         # Build for current platform"
            echo -e "  ./scripts/build.sh --all   # Build all formats for current platform"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Typesense Desktop - Build Script${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Get version from tauri.conf.json
VERSION=$(node -p "require('./src-tauri/tauri.conf.json').version")
echo -e "${BLUE}Building version: ${GREEN}${VERSION}${NC}"

# Show build mode
if [ "$BUILD_ALL" = true ]; then
    echo -e "${BLUE}Build mode: ${GREEN}All formats for current platform${NC}\n"
else
    echo -e "${BLUE}Build mode: ${GREEN}Current platform (single format)${NC}\n"
fi

# Step 1: Clean previous builds
echo -e "${YELLOW}[1/5] Cleaning previous builds...${NC}"
if [ -d "src-tauri/target/release/bundle" ]; then
    rm -rf src-tauri/target/release/bundle
    echo -e "${GREEN}✓ Cleaned previous builds${NC}\n"
else
    echo -e "${GREEN}✓ No previous builds to clean${NC}\n"
fi

# Step 2: Install dependencies
echo -e "${YELLOW}[2/5] Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}\n"

# Step 3: Run type check
echo -e "${YELLOW}[3/5] Running type check...${NC}"
npm run type-check
echo -e "${GREEN}✓ Type check passed${NC}\n"

# Step 4: Build the application
echo -e "${YELLOW}[4/5] Building application...${NC}"
echo -e "${BLUE}This may take a few minutes...${NC}"

# Detect current platform
CURRENT_OS=""
if [[ "$OSTYPE" == "darwin"* ]]; then
    CURRENT_OS="macos"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    CURRENT_OS="linux"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    CURRENT_OS="windows"
fi

# Build based on mode
if [ "$BUILD_ALL" = true ]; then
    # Build all formats for current platform
    if [ "$CURRENT_OS" = "macos" ]; then
        echo -e "${BLUE}Building: DMG, App Bundle${NC}"
        npm run tauri build -- --bundles dmg,app
    elif [ "$CURRENT_OS" = "linux" ]; then
        echo -e "${BLUE}Building: DEB, AppImage${NC}"
        npm run tauri build -- --bundles deb,appimage
    elif [ "$CURRENT_OS" = "windows" ]; then
        echo -e "${BLUE}Building: MSI, NSIS${NC}"
        npm run tauri build -- --bundles msi,nsis
    else
        npm run tauri build
    fi
else
    # Build default format for current platform
    if [ "$CURRENT_OS" = "macos" ]; then
        echo -e "${BLUE}Building: DMG only${NC}"
        npm run tauri build -- --bundles dmg
    elif [ "$CURRENT_OS" = "linux" ]; then
        echo -e "${BLUE}Building: AppImage only${NC}"
        npm run tauri build -- --bundles appimage
    elif [ "$CURRENT_OS" = "windows" ]; then
        echo -e "${BLUE}Building: MSI only${NC}"
        npm run tauri build -- --bundles msi
    else
        npm run tauri build
    fi
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build completed successfully${NC}\n"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

# Step 5: Show build artifacts
echo -e "${YELLOW}[5/5] Build artifacts:${NC}"
echo -e "${BLUE}Location: ${NC}src-tauri/target/release/bundle/\n"

# Show artifacts for current platform
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${GREEN}macOS Builds:${NC}"
    if [ -d "src-tauri/target/release/bundle/dmg" ]; then
        for file in src-tauri/target/release/bundle/dmg/*.dmg; do
            if [ -f "$file" ]; then
                size=$(du -h "$file" | cut -f1)
                echo -e "  • ${BLUE}$(basename "$file")${NC} (${size})"
            fi
        done
    fi
    if [ -d "src-tauri/target/release/bundle/macos" ]; then
        for file in src-tauri/target/release/bundle/macos/*.app; do
            if [ -d "$file" ]; then
                size=$(du -sh "$file" | cut -f1)
                echo -e "  • ${BLUE}$(basename "$file")${NC} (${size})"
            fi
        done
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo -e "${GREEN}Linux Builds:${NC}"
    if [ -d "src-tauri/target/release/bundle/deb" ]; then
        for file in src-tauri/target/release/bundle/deb/*.deb; do
            if [ -f "$file" ]; then
                size=$(du -h "$file" | cut -f1)
                echo -e "  • ${BLUE}$(basename "$file")${NC} (${size})"
            fi
        done
    fi
    if [ -d "src-tauri/target/release/bundle/appimage" ]; then
        for file in src-tauri/target/release/bundle/appimage/*.AppImage; do
            if [ -f "$file" ]; then
                size=$(du -h "$file" | cut -f1)
                echo -e "  • ${BLUE}$(basename "$file")${NC} (${size})"
            fi
        done
    fi
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    echo -e "${GREEN}Windows Builds:${NC}"
    if [ -d "src-tauri/target/release/bundle/msi" ]; then
        for file in src-tauri/target/release/bundle/msi/*.msi; do
            if [ -f "$file" ]; then
                size=$(du -h "$file" | cut -f1)
                echo -e "  • ${BLUE}$(basename "$file")${NC} (${size})"
            fi
        done
    fi
    if [ -d "src-tauri/target/release/bundle/nsis" ]; then
        for file in src-tauri/target/release/bundle/nsis/*-setup.exe; do
            if [ -f "$file" ]; then
                size=$(du -h "$file" | cut -f1)
                echo -e "  • ${BLUE}$(basename "$file")${NC} (${size})"
            fi
        done
    fi
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Build completed successfully! 🎉${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"

if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "  1. Test the build: ${YELLOW}open src-tauri/target/release/bundle/macos/*.app${NC}"
    echo -e "  2. Distribute: Share the .dmg file with users"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo -e "  1. Test the build: ${YELLOW}./src-tauri/target/release/bundle/appimage/*.AppImage${NC}"
    echo -e "  2. Distribute: Share the .AppImage file with users"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    echo -e "  1. Test the build: Run the .msi installer"
    echo -e "  2. Distribute: Share the .msi file with users"
fi

echo -e "  3. (Optional) Sign the app for distribution"
echo ""
