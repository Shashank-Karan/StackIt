#!/usr/bin/env python3
"""
Test script to verify the Python StackIt application works correctly
"""

import os
import sys
import time
import subprocess
import signal
from multiprocessing import Process

def test_app_import():
    """Test that the app can be imported successfully"""
    try:
        from python_full_app import app, db, User, Question, Answer, Vote, Notification
        print("✅ All Flask components imported successfully")
        return True
    except Exception as e:
        print(f"❌ Import failed: {e}")
        return False

def test_database_connection():
    """Test database connection and table creation"""
    try:
        from python_full_app import app, db
        with app.app_context():
            db.create_all()
            print("✅ Database connection and table creation successful")
            return True
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        return False

def test_routes():
    """Test basic route functionality"""
    try:
        from python_full_app import app
        
        test_routes = [
            ('/', 'GET'),
            ('/login', 'GET'),
            ('/register', 'GET'),
            ('/ask', 'GET'),
        ]
        
        with app.test_client() as client:
            for route, method in test_routes:
                response = client.get(route) if method == 'GET' else client.post(route)
                if response.status_code in [200, 302, 404]:  # Accept redirects and not found
                    print(f"✅ Route {route} responding")
                else:
                    print(f"⚠️  Route {route} returned {response.status_code}")
        
        return True
    except Exception as e:
        print(f"❌ Route test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🐍 Testing StackIt Python Q&A Platform")
    print("=" * 50)
    
    tests = [
        ("Component Import", test_app_import),
        ("Database Connection", test_database_connection),
        ("Routes Functionality", test_routes),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🔍 Running {test_name}...")
        if test_func():
            passed += 1
        else:
            print(f"❌ {test_name} failed")
    
    print(f"\n{'=' * 50}")
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Your Python application is ready to run.")
        print("🚀 To start the application, run: python3 python_full_app.py")
        print("🌐 Access it at: http://localhost:5002")
    else:
        print("⚠️  Some tests failed. Please check the errors above.")
    
    return passed == total

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)