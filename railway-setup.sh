#!/bin/bash

# Railway Deployment Quick Start Script
# This script helps you prepare your project for Railway deployment

echo "🚂 Railway Deployment Setup"
echo "============================"
echo ""

# Check if we're in the right directory
if [ ! -f "RAILWAY_DEPLOYMENT.md" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "✅ Project structure verified"
echo ""

# Check for required files
echo "📋 Checking required files..."
required_files=(
    "railway.json"
    "backend/nixpacks.toml"
    "frontend/nixpacks.toml"
    ".railwayignore"
)

all_files_exist=true
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file (missing)"
        all_files_exist=false
    fi
done

echo ""

if [ "$all_files_exist" = false ]; then
    echo "❌ Some required files are missing. Please create them first."
    exit 1
fi

# Check Git status
echo "📦 Checking Git status..."
if [ -d ".git" ]; then
    echo "  ✓ Git repository found"
    
    # Check for uncommitted changes
    if [[ -n $(git status -s) ]]; then
        echo "  ⚠️  You have uncommitted changes"
        echo ""
        echo "Would you like to commit and push? (y/n)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            git add .
            echo "Enter commit message:"
            read -r commit_msg
            git commit -m "$commit_msg"
            git push origin system-prototype-v2
            echo "  ✓ Changes committed and pushed"
        fi
    else
        echo "  ✓ No uncommitted changes"
    fi
else
    echo "  ⚠️  Not a Git repository"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📖 Next steps:"
echo "1. Go to https://railway.app and create a new project"
echo "2. Connect your GitHub repository (clarknotkent/Thesis)"
echo "3. Select branch: system-prototype-v2"
echo "4. Follow the instructions in RAILWAY_DEPLOYMENT.md"
echo ""
echo "📚 Read RAILWAY_DEPLOYMENT.md for detailed deployment instructions"
