#!/bin/bash

# Setup script for OilField project

echo "Setting up OilField project..."

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
if [ -f "package.json" ]; then
    npm install
else
    echo "No package.json found in frontend. Skipping frontend install."
fi
cd ..

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
if [ -f "package.json" ]; then
    npm install
elif [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
else
    echo "No package.json or requirements.txt found in backend. Skipping backend install."
fi
cd ..

echo "Setup complete!"
echo "Next steps:"
echo "1. Configure your .env files"
echo "2. Start the backend: cd backend && npm start"
echo "3. Start the frontend: cd frontend && npm start"
