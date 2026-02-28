#!/bin/bash
# VoltVision Backend Runner

echo "⚡ Starting VoltVision Backend..."

# Activate virtual environment if exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Install dependencies
pip install -r requirements.txt --quiet

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
