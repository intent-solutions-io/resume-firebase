#!/bin/bash
# Operation Hired - Local Development Quick Start
# This script helps you get the app running locally

set -e  # Exit on error

echo "🚀 Operation Hired - Local Development Setup"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 20+${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm --version)${NC}"

# Check gcloud
if ! command -v gcloud &> /dev/null; then
    echo -e "${YELLOW}⚠️  gcloud CLI not found (needed for worker service)${NC}"
    echo "   Install from: https://cloud.google.com/sdk/docs/install"
else
    echo -e "${GREEN}✅ gcloud CLI installed${NC}"
fi

# Check chromium
if command -v chromium &> /dev/null || command -v chromium-browser &> /dev/null; then
    echo -e "${GREEN}✅ Chromium installed${NC}"
else
    echo -e "${YELLOW}⚠️  Chromium not found (needed for PDF generation)${NC}"
    echo "   Install: sudo apt-get install chromium chromium-browser"
fi

echo ""
echo "=============================================="
echo ""

# Ask user what they want to do
echo "What would you like to do?"
echo ""
echo "1) Install dependencies (first time setup)"
echo "2) Configure Firebase credentials"
echo "3) Authenticate with Google Cloud"
echo "4) Start frontend only (use production worker)"
echo "5) Start both frontend + worker locally"
echo "6) Run health checks"
echo "7) Exit"
echo ""
read -p "Enter choice [1-7]: " choice

case $choice in
    1)
        echo ""
        echo "📦 Installing dependencies..."
        echo ""

        # Configure npm for better reliability
        echo "Configuring npm timeouts..."
        npm config set fetch-timeout 600000
        npm config set fetch-retry-mintimeout 200000
        npm config set fetch-retry-maxtimeout 1200000

        echo ""
        echo "Installing shared package..."
        cd packages/shared
        npm install
        npm run build

        echo ""
        echo "Installing frontend..."
        cd ../../frontend
        npm install

        echo ""
        echo "Installing worker..."
        cd ../services/worker
        npm install

        echo ""
        echo -e "${GREEN}✅ All dependencies installed!${NC}"
        echo ""
        echo "Next steps:"
        echo "  1. Run this script again and choose option 2 (Configure Firebase)"
        echo "  2. Run this script again and choose option 3 (Authenticate GCloud)"
        echo "  3. Run this script again and choose option 4 or 5 (Start services)"
        ;;

    2)
        echo ""
        echo "🔧 Firebase Configuration"
        echo ""
        echo "You need to get Firebase config from Firebase Console:"
        echo ""
        echo "1. Go to: https://console.firebase.google.com/project/resume-gen-intent-dev/settings/general"
        echo "2. Scroll to 'Your apps' → Find the Web App (</> icon)"
        echo "3. Click 'Config' to see the configuration"
        echo ""
        echo "Now edit frontend/.env.local and replace these values:"
        echo "  - VITE_FIREBASE_API_KEY"
        echo "  - VITE_FIREBASE_MESSAGING_SENDER_ID"
        echo "  - VITE_FIREBASE_APP_ID"
        echo ""
        read -p "Press Enter to open .env.local in nano (or Ctrl+C to cancel)..."
        nano frontend/.env.local
        ;;

    3)
        echo ""
        echo "🔐 Authenticating with Google Cloud..."
        echo ""
        gcloud auth application-default login --project resume-gen-intent-dev
        echo ""
        echo -e "${GREEN}✅ Authenticated!${NC}"
        ;;

    4)
        echo ""
        echo "🚀 Starting FRONTEND only (using production worker)..."
        echo ""
        echo "Make sure frontend/.env.local has:"
        echo "  VITE_WORKER_URL=https://resume-worker-dev-96171099570.us-central1.run.app"
        echo ""
        read -p "Press Enter to continue..."

        cd frontend
        npm run dev
        ;;

    5)
        echo ""
        echo "🚀 Starting BOTH frontend + worker locally..."
        echo ""
        echo "Make sure frontend/.env.local has:"
        echo "  VITE_WORKER_URL=http://localhost:8080"
        echo ""
        echo "Opening 2 terminals:"
        echo "  Terminal 1: Worker (port 8080)"
        echo "  Terminal 2: Frontend (port 3000)"
        echo ""
        read -p "Press Enter to continue..."

        # Try to open multiple terminals
        if command -v gnome-terminal &> /dev/null; then
            gnome-terminal -- bash -c "cd services/worker && npm run dev; exec bash"
            gnome-terminal -- bash -c "cd frontend && npm run dev; exec bash"
        elif command -v xterm &> /dev/null; then
            xterm -e "cd services/worker && npm run dev; bash" &
            xterm -e "cd frontend && npm run dev; bash" &
        else
            echo ""
            echo "Could not open terminals automatically."
            echo ""
            echo "Please open 2 terminals manually and run:"
            echo ""
            echo "Terminal 1:"
            echo "  cd services/worker"
            echo "  npm run dev"
            echo ""
            echo "Terminal 2:"
            echo "  cd frontend"
            echo "  npm run dev"
        fi
        ;;

    6)
        echo ""
        echo "🏥 Running health checks..."
        echo ""

        echo "Checking worker service..."
        if curl -s http://localhost:8080/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Worker is running${NC}"
            curl -s http://localhost:8080/health | python3 -m json.tool
        else
            echo -e "${RED}❌ Worker is not running${NC}"
            echo "   Start with: cd services/worker && npm run dev"
        fi

        echo ""
        echo "Checking frontend..."
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Frontend is running${NC}"
        else
            echo -e "${RED}❌ Frontend is not running${NC}"
            echo "   Start with: cd frontend && npm run dev"
        fi
        ;;

    7)
        echo "Goodbye!"
        exit 0
        ;;

    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo "Done!"
