#!/usr/bin/env python3
"""
Run only the Python StackIt application with enhanced features
"""

import os
import sys
import signal
import subprocess
import time

def kill_existing_processes():
    """Kill any existing Python processes"""
    try:
        subprocess.run(['pkill', '-f', 'python_full_app.py'], check=False)
        subprocess.run(['pkill', '-f', 'flask'], check=False)
        time.sleep(2)
        print("Cleaned up existing processes")
    except Exception as e:
        print(f"Process cleanup: {e}")

def run_python_app():
    """Run the Python StackIt application"""
    try:
        # Import and run the application
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from python_full_app import app, db
        
        print("🐍 StackIt Python Q&A Platform")
        print("=" * 50)
        print("✅ Enhanced Features:")
        print("  • Public access to all questions and answers")
        print("  • Notification system with bell icon and badge")
        print("  • @username mentions in answers")
        print("  • Required tags with pill/bubble styling")
        print("  • Upvote notifications")
        print("  • Modern responsive UI")
        print("  • Advanced search and filtering")
        print("=" * 50)
        
        # Create database tables
        with app.app_context():
            db.create_all()
            print("✅ Database tables created/verified")
        
        print("🚀 Starting server on http://localhost:5002")
        print("📝 Access the platform in your browser")
        print("⚡ Press Ctrl+C to stop the server")
        print("=" * 50)
        
        # Run the Flask app
        app.run(debug=True, host='0.0.0.0', port=5002)
        
    except KeyboardInterrupt:
        print("\n👋 Application stopped by user")
    except Exception as e:
        print(f"❌ Error running application: {e}")
        import traceback
        traceback.print_exc()

def main():
    """Main function"""
    print("🔧 Preparing Python StackIt application...")
    
    # Clean up any existing processes
    kill_existing_processes()
    
    # Run the Python application
    run_python_app()

if __name__ == '__main__':
    main()