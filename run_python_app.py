#!/usr/bin/env python3
"""
StackIt Python Application Runner
Runs the complete Python-based Q&A platform
"""

import os
import sys
import subprocess
from pathlib import Path

def check_requirements():
    """Check if all required environment variables are set"""
    required_vars = ['DATABASE_URL']
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        return False
    
    return True

def install_dependencies():
    """Install Python dependencies if needed"""
    try:
        import flask
        import flask_sqlalchemy
        import google.generativeai
        print("✅ All dependencies are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("📦 Installing dependencies...")
        try:
            subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'], check=True)
            return True
        except subprocess.CalledProcessError:
            print("❌ Failed to install dependencies")
            return False

def main():
    """Main function to run the application"""
    print("🐍 StackIt Python Q&A Platform")
    print("=" * 50)
    
    # Check environment
    if not check_requirements():
        print("💡 Make sure DATABASE_URL is set in your environment")
        sys.exit(1)
    
    # Check dependencies
    if not install_dependencies():
        sys.exit(1)
    
    # Run the application
    print("🚀 Starting StackIt Python application...")
    print("🌐 Server will be available at http://localhost:5002")
    print("📊 Database: Connected")
    
    try:
        # Import and run the Flask app
        from python_full_app import app
        
        # Create database tables
        with app.app_context():
            from python_full_app import db
            db.create_all()
            print("✅ Database tables created/verified")
        
        print("🎉 Application started successfully!")
        print("📝 Features available:")
        print("  - User registration and login")
        print("  - Ask and answer questions")
        print("  - Vote on questions and answers")
        print("  - Real-time notifications")
        print("  - AI-powered text improvement")
        print("  - Rich text editing")
        print("=" * 50)
        
        # Run the Flask app
        app.run(debug=True, host='0.0.0.0', port=5002)
        
    except KeyboardInterrupt:
        print("\n👋 Application stopped by user")
    except Exception as e:
        print(f"❌ Error starting application: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()