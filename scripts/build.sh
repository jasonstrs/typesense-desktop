#!/bin/bash

# Typesense Desktop Build Script
# This script builds the application for production

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Typesense Desktop - Build Script${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Get version from tauri.conf.json
VERSION=$(node -p "require('./src-tauri/tauri.conf.json').version")
echo -e "${BLUE}Building version: ${GREEN}${VERSION}${NC}\n"

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
npm run tauri build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build completed successfully${NC}\n"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

# Step 5: Show build artifacts
echo -e "${YELLOW}[5/5] Build artifacts:${NC}"
echo -e "${BLUE}Location: ${NC}src-tauri/target/release/bundle/\n"

# Detect platform and show relevant artifacts
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
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Build completed successfully! 🎉${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Test the build: ${YELLOW}open src-tauri/target/release/bundle/macos/*.app${NC}"
echo -e "  2. Distribute: Share the .dmg file with users"
echo -e "  3. (Optional) Sign the app for distribution"
echo ""
