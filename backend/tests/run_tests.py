#!/usr/bin/env python3
"""
Test runner for transfer functionality.
Run this from the Docker container to test the transfer system.
"""

import os
import sys

# Add the parent directory to Python path so we can import backend modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def run_all_tests():
    """Run all transfer tests."""
    print("🚀 Starting transfer tests...")
    print("Make sure your database is running and accessible!")
    print("-" * 50)

    try:
        from tests.test_transfers_simple import main as run_simple_tests

        print("\n📋 Running Simple Transfer Tests...")
        simple_result = run_simple_tests()
    except Exception as e:
        print(f"❌ Simple tests failed: {e}")
        simple_result = 1

    try:
        from tests.test_batch_transfers import main as run_batch_tests

        print("\n📋 Running Batch Transfer Tests...")
        batch_result = run_batch_tests()
    except Exception as e:
        print(f"❌ Batch tests failed: {e}")
        batch_result = 1

    print("\n" + "=" * 50)
    print("📊 Test Summary:")
    print(f"   Simple Tests: {'✅ PASSED' if simple_result == 0 else '❌ FAILED'}")
    print(f"   Batch Tests:  {'✅ PASSED' if batch_result == 0 else '❌ FAILED'}")

    if simple_result == 0 and batch_result == 0:
        print("\n🎉 All tests passed! Your transfer system is working correctly!")
        return 0
    else:
        print("\n⚠️  Some tests failed. Check the output above.")
        return 1


if __name__ == "__main__":
    exit(run_all_tests())
