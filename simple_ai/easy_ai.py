#!/usr/bin/env python
"""
Easy AI Launcher - Run the AI system with zero configuration
No dependencies required!
Can be packaged into a standalone executable with PyInstaller.
"""

import os
import sys
import glob
import time
import subprocess
import platform

# Display constants
APP_NAME = "SIMPLE AI SYSTEM"
APP_VERSION = "1.0.0"
IS_FROZEN = getattr(sys, 'frozen', False)

def clear_screen():
    """Clear the terminal screen."""
    os.system('cls' if os.name == 'nt' else 'clear')

def show_header():
    """Show the Easy AI header."""
    clear_screen()
    print("=" * 60)
    print(f"                   {APP_NAME}")
    print("             No dependencies required")
    if IS_FROZEN:
        print("          [STANDALONE EXECUTABLE VERSION]")
    print("=" * 60)
    print(f"Version: {APP_VERSION}")
    print()

def find_datasets():
    """Find all CSV files in the current directory."""
    return glob.glob("*.csv")

def find_models():
    """Find all model files in the current directory."""
    return glob.glob("*.pth")

def run_command(cmd, suppress_output=False):
    """Run a command and handle errors."""
    try:
        if suppress_output:
            return subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        else:
            return subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {e}")
        return None
    except FileNotFoundError:
        print(f"Error: Could not find the program to execute.")
        return None

def run_main_py_command(command_args, direct_execution=False):
    """Run a command either through main.py or by direct execution."""
    if direct_execution or IS_FROZEN:
        # If we're in a frozen executable or direct execution is requested,
        # import and run the main function directly
        try:
            sys.argv = [sys.argv[0]] + command_args
            from main import main
            main()
            return True
        except Exception as e:
            print(f"Error executing command: {e}")
            return False
    else:
        # Otherwise use subprocess to run as a separate process
        return run_command([sys.executable, "main.py"] + command_args)

def create_example_csv():
    """Create an example CSV file to get started."""
    filename = "example.csv"
    if os.path.exists(filename):
        return
        
    try:
        with open(filename, "w") as f:
            f.write("feature1,feature2,output\n")
            f.write("0,0,0\n")
            f.write("0,1,1\n")
            f.write("1,0,1\n")
            f.write("1,1,0\n")
        print(f"Created example CSV file: {filename}")
    except Exception as e:
        print(f"Error creating example CSV: {e}")

def check_dependencies():
    """Make sure we have what we need to run."""
    if not IS_FROZEN and not os.path.exists("main.py"):
        print("Error: main.py not found in the current directory.")
        print("This script must be run from the Simple AI directory.")
        input("\nPress Enter to exit...")
        sys.exit(1)
    
    # Create example dataset if none exist
    datasets = find_datasets()
    if not datasets:
        print("No CSV datasets found. Creating an example dataset...")
        create_example_csv()

def main():
    """Main function - interactive menu."""
    check_dependencies()
    show_header()
    
    print("What would you like to do?")
    print("1. Automatically process all CSV files and create models")
    print("2. Train on XOR example problem")
    print("3. Make predictions with an existing model")
    print("4. Exit")
    
    choice = input("\nEnter your choice (1-4): ")
    
    if choice == '1':
        show_header()
        print("Searching for CSV datasets in the current directory...")
        
        datasets = find_datasets()
        if not datasets:
            print("No CSV datasets found. Please place CSV files in this directory.")
            input("\nPress Enter to return to the main menu...")
            main()
            return
        
        print(f"Found {len(datasets)} dataset(s).")
        print("Starting automatic training with optimized parameters...")
        
        # Run the auto command
        run_main_py_command(["auto", "--auto-tune"])
        
        print("\nTraining complete! Models have been saved.")
        input("\nPress Enter to return to the main menu...")
        main()
        
    elif choice == '2':
        show_header()
        print("Training on XOR example problem...")
        
        # Run the xor command
        run_main_py_command(["xor"])
        
        print("\nXOR training complete! Model has been saved as xor_model.pth.")
        input("\nPress Enter to return to the main menu...")
        main()
        
    elif choice == '3':
        show_header()
        
        models = find_models()
        if not models:
            print("No models found. Please train a model first.")
            input("\nPress Enter to return to the main menu...")
            main()
            return
        
        print("Available models:")
        for i, model in enumerate(models):
            print(f"{i+1}. {model}")
        
        model_idx = input("\nEnter the number of the model to use (or 'q' to go back): ")
        if model_idx.lower() == 'q':
            main()
            return
        
        try:
            model_path = models[int(model_idx) - 1]
        except (ValueError, IndexError):
            print("Invalid selection.")
            time.sleep(1)
            main()
            return
        
        show_header()
        print(f"Using model: {model_path}")
        print("\nEnter input data (comma-separated values):")
        input_data = input("> ")
        
        if not input_data:
            print("No input provided.")
            input("\nPress Enter to return to the main menu...")
            main()
            return
        
        # Run the predict command
        run_main_py_command(["predict", model_path, input_data])
        
        input("\nPress Enter to return to the main menu...")
        main()
        
    elif choice == '4':
        print("\nExiting Simple AI. Goodbye!")
        sys.exit(0)
        
    else:
        print("Invalid choice. Please try again.")
        time.sleep(1)
        main()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nOperation canceled by user. Exiting...")
        sys.exit(0)
