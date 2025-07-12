#!/usr/bin/env python3
"""
Simple starter script for the Python StackIt application
"""

import os
import sys

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    # Import the Flask app
    from python_full_app import app, db
    
    print("🐍 StackIt Python Q&A Platform")
    print("=" * 50)
    print("✅ Flask app imported successfully")
    
    # Create database tables
    with app.app_context():
        db.create_all()
        print("✅ Database tables created successfully")
    
    print("🚀 Starting Flask app on port 5002...")
    print("🌐 Access the application at http://localhost:5002")
    print("📊 Database: Connected")
    print("=" * 50)
    
    # Run the Flask app
    app.run(debug=True, host='0.0.0.0', port=5002)
    
except Exception as e:
    print(f"❌ Error starting application: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)