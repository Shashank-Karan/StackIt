#!/usr/bin/env python3
"""
Simple script to run the Python StackIt application
"""
import subprocess
import sys

def main():
    """Run the Python StackIt application."""
    print("🐍 Starting StackIt Python Application...")
    print("📊 This will run the complete Python-based Q&A platform")
    print("🌐 Server will be available at http://localhost:5002")
    print("=" * 50)
    
    try:
        # Run the Python application
        subprocess.run([sys.executable, 'python_full_app.py'], check=True)
    except KeyboardInterrupt:
        print("\n👋 Application stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running application: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()