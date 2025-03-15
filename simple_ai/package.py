"""
Package Simple AI into a standalone executable that doesn't require Python installation.

This script uses PyInstaller to create a standalone executable.
If you don't have PyInstaller, install it with: pip install pyinstaller
"""

import os
import sys
import shutil
import subprocess
import platform

def check_pyinstaller():
    """Check if PyInstaller is installed."""
    try:
        import PyInstaller
        return True
    except ImportError:
        return False

def install_pyinstaller():
    """Install PyInstaller using pip."""
    print("Installing PyInstaller...")
    subprocess.call([sys.executable, "-m", "pip", "install", "pyinstaller"])

def create_executable():
    """Create standalone executable."""
    print("Creating standalone executable...")
    
    # Determine OS-specific settings
    os_name = platform.system()
    if os_name == "Windows":
        icon_option = "--icon=resources/ai_icon.ico"
        output_name = "SimpleAI.exe"
    else:
        icon_option = ""
        output_name = "SimpleAI"
    
    # Create resources directory if it doesn't exist
    os.makedirs("resources", exist_ok=True)
    
    # Create a simple icon file if it doesn't exist
    if os_name == "Windows" and not os.path.exists("resources/ai_icon.ico"):
        try:
            create_simple_icon("resources/ai_icon.ico")
        except:
            print("Warning: Could not create icon file. Using default icon.")
            icon_option = ""
    
    # Create a version file for Windows
    if os_name == "Windows":
        with open("version_info.txt", "w") as f:
            f.write("# UTF-8\n")
            f.write("VSVersionInfo(\n")
            f.write("  ffi=FixedFileInfo(\n")
            f.write("    filevers=(1, 0, 0, 0),\n")
            f.write("    prodvers=(1, 0, 0, 0),\n")
            f.write("    mask=0x3f,\n")
            f.write("    flags=0x0,\n")
            f.write("    OS=0x40004,\n")
            f.write("    fileType=0x1,\n")
            f.write("    subtype=0x0,\n")
            f.write("    date=(0, 0)\n")
            f.write("    ),\n")
            f.write("  kids=[\n")
            f.write("    StringFileInfo(\n")
            f.write("      [\n")
            f.write("      StringTable(\n")
            f.write("        u'040904B0',\n")
            f.write("        [StringStruct(u'CompanyName', u''),\n")
            f.write("        StringStruct(u'FileDescription', u'Simple AI - No Dependencies Needed'),\n")
            f.write("        StringStruct(u'FileVersion', u'1.0.0'),\n")
            f.write("        StringStruct(u'InternalName', u'SimpleAI'),\n")
            f.write("        StringStruct(u'LegalCopyright', u''),\n")
            f.write("        StringStruct(u'OriginalFilename', u'SimpleAI.exe'),\n")
            f.write("        StringStruct(u'ProductName', u'Simple AI'),\n")
            f.write("        StringStruct(u'ProductVersion', u'1.0.0')])\n")
            f.write("      ]), \n")
            f.write("    VarFileInfo([VarStruct(u'Translation', [1033, 1200])])\n")
            f.write("  ]\n")
            f.write(")\n")
        version_option = "--version-file=version_info.txt"
    else:
        version_option = ""
    
    # Build command for PyInstaller
    cmd = [
        "pyinstaller",
        "--onefile",
        "--name", output_name,
        icon_option,
        version_option,
        "--clean",
        "--noconfirm",
        "easy_ai.py"
    ]
    
    # Remove empty elements from command
    cmd = [arg for arg in cmd if arg]
    
    # Run PyInstaller
    subprocess.call(cmd)
    
    # Copy example CSV file to dist folder
    shutil.copy("example.csv" if os.path.exists("example.csv") else create_example_csv(), "dist/example.csv")
    
    # Create a readme file in the dist folder
    with open("dist/README.txt", "w") as f:
        f.write("SIMPLE AI - NO PYTHON REQUIRED\n")
        f.write("===========================\n\n")
        f.write("This is a standalone version of Simple AI that doesn't require Python installation.\n\n")
        f.write("HOW TO USE:\n")
        f.write("1. Double-click the SimpleAI executable\n")
        f.write("2. Follow the on-screen instructions\n\n")
        f.write("To train on your own data, place CSV files in this directory.\n")
        f.write("CSV format: Each row is a data point, the last column is the expected output.\n\n")
        f.write("EXAMPLE:\n")
        f.write("An example.csv file is included to get you started.\n")
    
    print(f"\nSuccess! Standalone executable created in the dist folder.")
    print(f"You can distribute the contents of the dist folder to users without Python installed.")

def create_simple_icon(filename):
    """Create a simple icon file for the executable."""
    # This requires PIL/Pillow which might not be installed
    from PIL import Image, ImageDraw
    
    # Create a 64x64 image with a blue background
    img = Image.new('RGBA', (64, 64), color=(53, 116, 240, 255))
    draw = ImageDraw.Draw(img)
    
    # Draw a simple 'AI' text
    draw.rectangle([10, 10, 54, 54], fill=(255, 255, 255, 255), outline=(0, 0, 0, 255))
    draw.text((22, 25), "AI", fill=(0, 0, 0, 255))
    
    # Save as .ico
    img.save(filename)

def create_example_csv():
    """Create an example CSV file if one doesn't exist."""
    filename = "example.csv"
    with open(filename, "w") as f:
        f.write("feature1,feature2,output\n")
        f.write("0,0,0\n")
        f.write("0,1,1\n")
        f.write("1,0,1\n")
        f.write("1,1,0\n")
    print(f"Created example CSV file: {filename}")
    return filename

def main():
    """Main function."""
    print("Preparing to package Simple AI as a standalone executable...")
    
    # Check if PyInstaller is installed
    if not check_pyinstaller():
        print("PyInstaller not found. It is required to create a standalone executable.")
        install = input("Would you like to install PyInstaller now? (y/n): ")
        if install.lower() == 'y':
            install_pyinstaller()
        else:
            print("Aborting packaging process.")
            sys.exit(1)
    
    # Create example.csv if it doesn't exist
    if not os.path.exists("example.csv"):
        create_example_csv()
    
    # Create the executable
    create_executable()

if __name__ == "__main__":
    main()
