#!/bin/bash

# LLM Council - Setup script

set -e

echo "Setting up LLM Council..."
echo ""

# Check for uv
if ! command -v uv &> /dev/null; then
    echo "Error: uv is not installed."
    echo "Install it from: https://docs.astral.sh/uv/"
    exit 1
fi

# Check for node/npm
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed."
    echo "Install Node.js from: https://nodejs.org/"
    exit 1
fi

# Install Python dependencies
echo "Installing Python dependencies..."
uv sync

# Install frontend dependencies
echo ""
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Check for .env file
if [ ! -f .env ]; then
    echo ""
    echo "Creating .env file..."
    echo "OPENROUTER_API_KEY=your_api_key_here" > .env
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your OpenRouter API key"
    echo "   Get one at: https://openrouter.ai/"
fi

echo ""
echo "✓ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Make sure your OpenRouter API key is in .env"
echo "  2. Run ./start.sh to start the app"
