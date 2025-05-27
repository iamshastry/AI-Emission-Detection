#!/bin/bash

# Navigate to backend and start it
cd server && npm install && cd ..

# Navigate to frontend and install dependencies
cd client && npm install && cd ..

# Run both servers concurrently
npx concurrently \
  "npm --prefix server start" \
  "npm --prefix client run dev"
