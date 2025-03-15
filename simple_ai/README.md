# Simple AI - Zero Dependencies AI System

This is an artificial intelligence system that requires **NO DEPENDENCIES** and can even run **WITHOUT PYTHON INSTALLED**. The system demonstrates how to build, train, and use neural networks with virtually no effort.

## Usage Options

### Option 1: No Installation Required

Download the pre-built executable from the releases page and run it directly:

1. Download the appropriate version for your OS:
   - Windows: `SimpleAI-Windows.zip`
   - Mac: `SimpleAI-Mac.zip`
   - Linux: `SimpleAI-Linux.zip`

2. Extract the ZIP file

3. Run the executable:
   - Windows: Double-click `SimpleAI.exe`
   - Mac/Linux: Run `./SimpleAI`

4. Use the interactive menu to train models and make predictions

### Option 2: With Python (Any Version)

If you already have Python installed (any version 2.7+ or 3.x):

1. Clone or download this repository
2. Navigate to the project folder
3. Run the launcher script:

```bash
python easy_ai.py
```

### Option 3: Build Your Own Executable

To create your own standalone executable that doesn't require Python:

1. Make sure Python is installed on your build machine
2. Run the packaging script:

```bash
python package.py
```

3. Find the standalone executable in the `dist` folder
4. Distribute this executable to any computer (no Python required)

## Features

- **Zero Dependencies**: Works with any Python installation or no Python at all
- **Zero Configuration**: Just run and go!
- **Automatic Dataset Discovery**: Finds CSV files automatically
- **Auto-Tuning**: Selects optimal hyperparameters based on your data
- **Early Stopping**: Prevents overfitting by monitoring validation performance
- **Model Configuration Storage**: Models remember their settings
- **Interactive Mode**: Easy-to-use menu interface
- **Command Line Interface**: For advanced users and automation

## How It Works

This AI system implements a neural network from scratch:

1. **Matrix Math**: Custom matrix operations for forward and backward propagation
2. **Neural Network**: Flexible architecture with configurable hidden layers
3. **Training Algorithm**: Gradient descent with backpropagation
4. **File Operations**: CSV parsing and model saving/loading with JSON

## Command Line Usage (Python Version)

For advanced users who prefer using the command line:

### Automatic Mode

Process all CSV files in a directory automatically:

```bash
python main.py auto --auto-tune
```

### XOR Example

Run the built-in XOR example:

```bash
python main.py xor
```

### Custom Training

Train with your own data (CSV format, last column is the target):

```bash
python main.py train data.csv --auto-tune
```

### Making Predictions

Make predictions using a trained model:

```bash
python main.py predict my_model.pth "0.5,0.7,0.2"
```

## Data Format

Your training data should be in CSV format with:
- Each row is a training sample
- The last column is the target/output value
- All other columns are input features

## Compatibility

This system is compatible with:
- Windows, macOS, Linux
- Can run with Python 2.7+, Python 3.x, or no Python at all
- No dependency on external libraries
- No GPU required (but will run faster with better hardware)
