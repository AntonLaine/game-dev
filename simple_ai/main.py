from trainer import AITrainer
import argparse
import sys
import os
import glob
import json
import csv
import random

def train_xor_example(hidden_size=10, epochs=5000, save_path='xor_model.pth'):
    """Train the model on XOR problem as an example."""
    # Create training data
    inputs = [[0, 0], [0, 1], [1, 0], [1, 1]]
    targets = [[0], [1], [1], [0]]
    
    # Initialize AI
    ai = AITrainer(input_size=2, hidden_size=hidden_size, output_size=1)
    
    # Train model
    print("Training model on XOR problem...")
    ai.train(inputs, targets, epochs=epochs)
    
    # Test model
    print("\nTesting model:")
    for i, input_data in enumerate(inputs):
        prediction = ai.predict([input_data])
        print(f"Input: {input_data}, Expected: {targets[i][0]}, Predicted: {prediction[0][0]:.4f}")
    
    # Save the model
    ai.save_model(save_path)
    print(f"\nModel saved as '{save_path}'")
    return ai

def load_csv(file_path, has_header=False, delimiter=','):
    """Load data from CSV file."""
    data = []
    with open(file_path, 'r') as f:
        reader = csv.reader(f, delimiter=delimiter)
        
        # Skip header if it exists
        if has_header:
            next(reader)
            
        for row in reader:
            # Convert all values to float
            try:
                data.append([float(x) for x in row])
            except ValueError:
                print(f"Warning: Skipping row with non-numeric data: {row}")
    
    if not data:
        raise ValueError("No valid data rows found in the CSV file.")
        
    return data

def train_from_file(input_file, hidden_size=10, epochs=5000, save_path='model.pth', auto_tune=False):
    """Train the model using data from a file."""
    try:
        print(f"Loading data from {input_file}...")
        
        # Try to detect file format
        is_header = False
        with open(input_file, 'r') as f:
            sample = f.readline().strip()
            # Simple heuristic: if first row contains non-numeric data, assume it's a header
            parts = sample.split(',')
            if any(not is_numeric(part) for part in parts):
                is_header = True
                print("Detected header row in CSV file.")
                
        # Load data with appropriate settings
        data = load_csv(input_file, has_header=is_header)
        
        # Assume last column is the target
        inputs = [row[:-1] for row in data]
        targets = [[row[-1]] for row in data]
        
        input_size = len(inputs[0])
        output_size = 1  # Single target value
        
        # Auto-tune hyperparameters if requested
        if auto_tune:
            print("Auto-tuning hyperparameters...")
            # Simple heuristic: larger datasets get more complex models
            sample_count = len(inputs)
            if sample_count > 1000:
                hidden_size = min(256, input_size * 8)
                num_layers = 3
                epochs = min(epochs, 2000)  # Prevent too many epochs for large datasets
            elif sample_count > 100:
                hidden_size = min(128, input_size * 4)
                num_layers = 2
            else:
                hidden_size = min(64, input_size * 2)
                num_layers = 2
                
            print(f"Auto-tuned parameters: hidden_size={hidden_size}, num_layers={num_layers}, epochs={epochs}")
        else:
            num_layers = 2
        
        ai = AITrainer(input_size=input_size, hidden_size=hidden_size, output_size=output_size, num_layers=num_layers)
        print(f"Training model on data from {input_file}...")
        ai.train(inputs, targets, epochs=epochs)
        
        # Save the model
        ai.save_model(save_path)
        print(f"\nModel saved as '{save_path}'")
        return ai
    except Exception as e:
        print(f"Error loading or training with data file: {e}")
        sys.exit(1)

def is_numeric(value):
    """Check if a string can be converted to a float."""
    try:
        float(value)
        return True
    except ValueError:
        return False

def parse_input_data(input_data):
    """Parse input data from string or file."""
    if os.path.isfile(input_data):
        # Load from file
        data = load_csv(input_data)
        return data
    else:
        # Parse as comma-separated values
        try:
            values = [float(x) for x in input_data.split(',')]
            return [values]
        except ValueError:
            raise ValueError("Input data must be numeric values separated by commas")

def predict(model_path, input_data, input_size=None, hidden_size=None, output_size=None):
    """Make predictions using a trained model."""
    try:
        # Try to automatically load the model
        try:
            ai = AITrainer.auto_detect_model(model_path)
        except ValueError:
            # Fallback to manual configuration if auto-detection fails
            if input_size is None:
                print("Error: input_size is required when config file is missing.")
                sys.exit(1)
            ai = AITrainer(
                input_size=input_size, 
                hidden_size=hidden_size or 10, 
                output_size=output_size or 1
            )
            ai.load_model(model_path)
        
        # Parse and prepare input data
        data = parse_input_data(input_data)
        
        # Check input dimensions
        if len(data[0]) != ai.config['input_size']:
            print(f"Error: Input has {len(data[0])} features, but model expects {ai.config['input_size']}.")
            sys.exit(1)
            
        # Make prediction
        predictions = ai.predict(data)
        
        return predictions
    except Exception as e:
        print(f"Error making prediction: {e}")
        sys.exit(1)

def auto_discover_datasets(directory='.'):
    """Find all CSV files that might contain training data."""
    csv_files = glob.glob(os.path.join(directory, "*.csv"))
    return csv_files

def main():
    parser = argparse.ArgumentParser(description='Simple AI - Neural Network Tool')
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # Auto command for complete automation
    auto_parser = subparsers.add_parser('auto', help='Automatically discover datasets and train models')
    auto_parser.add_argument('--dir', type=str, default='.', help='Directory to search for datasets')
    auto_parser.add_argument('--auto-tune', action='store_true', help='Automatically tune hyperparameters')
    
    # XOR example command
    xor_parser = subparsers.add_parser('xor', help='Train on XOR example')
    xor_parser.add_argument('--hidden', type=int, default=10, help='Hidden layer size')
    xor_parser.add_argument('--epochs', type=int, default=5000, help='Number of epochs')
    xor_parser.add_argument('--save', type=str, default='xor_model.pth', help='Path to save model')
    
    # Train command
    train_parser = subparsers.add_parser('train', help='Train on custom data')
    train_parser.add_argument('file', type=str, help='CSV file with training data (last column is target)')
    train_parser.add_argument('--hidden', type=int, default=10, help='Hidden layer size')
    train_parser.add_argument('--epochs', type=int, default=5000, help='Number of epochs')
    train_parser.add_argument('--save', type=str, default='model.pth', help='Path to save model')
    train_parser.add_argument('--auto-tune', action='store_true', help='Automatically tune hyperparameters')
    
    # Predict command
    predict_parser = subparsers.add_parser('predict', help='Make predictions')
    predict_parser.add_argument('model', type=str, help='Path to model file')
    predict_parser.add_argument('input', type=str, help='Input data (comma-separated values or file path)')
    predict_parser.add_argument('--input-size', type=int, help='Input size of the model (required if no config file)')
    predict_parser.add_argument('--hidden', type=int, help='Hidden layer size')
    predict_parser.add_argument('--output-size', type=int, help='Output size of the model')
    
    args = parser.parse_args()
    
    if args.command == 'auto':
        datasets = auto_discover_datasets(args.dir)
        if not datasets:
            print("No CSV datasets found in the specified directory.")
            sys.exit(1)
            
        print(f"Found {len(datasets)} datasets:")
        for i, dataset in enumerate(datasets):
            print(f"{i+1}. {dataset}")
            
        for dataset in datasets:
            model_name = os.path.splitext(os.path.basename(dataset))[0] + "_model.pth"
            print(f"\nAutomatic training on {dataset}...")
            train_from_file(dataset, save_path=model_name, auto_tune=args.auto_tune)
            
        print("\nAll datasets have been processed and models saved.")
    
    elif args.command == 'xor':
        train_xor_example(hidden_size=args.hidden, epochs=args.epochs, save_path=args.save)
    
    elif args.command == 'train':
        train_from_file(args.file, hidden_size=args.hidden, epochs=args.epochs, 
                         save_path=args.save, auto_tune=args.auto_tune)
    
    elif args.command == 'predict':
        predictions = predict(
            args.model, 
            args.input, 
            input_size=args.input_size, 
            hidden_size=args.hidden, 
            output_size=args.output_size
        )
        print("\nPrediction results:")
        for i, pred in enumerate(predictions):
            print(f"Sample {i+1}: {pred}")
    
    else:
        parser.print_help()

# Add support for PyInstaller and direct execution from easy_ai
if __name__ == "__main__":
    # If this script is run directly, execute the main function
    main()
elif getattr(sys, 'frozen', False):
    # If we're running in a PyInstaller bundle, ensure we run the main function
    # This ensures the script works both when imported and when frozen
    main()
