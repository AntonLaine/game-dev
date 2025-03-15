import os
import json
import random
from model import SimpleNeuralNetwork

class AITrainer:
    def __init__(self, input_size, hidden_size, output_size, learning_rate=0.1, num_layers=2):
        self.model = SimpleNeuralNetwork(input_size, hidden_size, output_size, num_layers)
        self.model.learning_rate = learning_rate
        self.config = {
            'input_size': input_size,
            'hidden_size': hidden_size,
            'output_size': output_size,
            'learning_rate': learning_rate,
            'num_layers': num_layers
        }
        
    def train(self, inputs, targets, epochs=1000, validation_split=0.2, early_stopping=5):
        """Train the model on provided data."""
        # Convert data if necessary
        if not isinstance(inputs[0], list):
            inputs = [[x] for x in inputs]
        if not isinstance(targets[0], list):
            targets = [[y] for y in targets]
        
        # Create validation set
        dataset = list(zip(inputs, targets))
        random.shuffle(dataset)
        
        # Split data for validation if enough samples
        if len(dataset) > 10 and validation_split > 0:
            val_size = int(len(dataset) * validation_split)
            train_data = dataset[:-val_size]
            val_data = dataset[-val_size:]
            use_validation = True
        else:
            train_data = dataset
            use_validation = False
        
        best_val_loss = float('inf')
        patience_counter = 0
        best_weights = None
        best_biases = None
        
        for epoch in range(epochs):
            # Training phase
            total_loss = 0
            
            # Shuffle training data for each epoch
            random.shuffle(train_data)
            
            for x, y in train_data:
                # Train on each example
                self.model.train(x, y)
                
                # Calculate error for logging
                prediction = self.model.predict(x)
                error = sum([(a - b)**2 for a, b in zip(y, prediction)]) / len(y)
                total_loss += error
            
            avg_loss = total_loss / len(train_data)
            
            # Validation phase
            if use_validation:
                val_loss = 0
                for x, y in val_data:
                    prediction = self.model.predict(x)
                    error = sum([(a - b)**2 for a, b in zip(y, prediction)]) / len(y)
                    val_loss += error
                val_loss /= len(val_data)
                
                if val_loss < best_val_loss:
                    best_val_loss = val_loss
                    patience_counter = 0
                    # Save the best model weights
                    best_weights = [w.copy() for w in self.model.weights]
                    best_biases = [b.copy() for b in self.model.biases]
                else:
                    patience_counter += 1
                
                # Early stopping
                if early_stopping > 0 and patience_counter >= early_stopping:
                    print(f'Early stopping at epoch {epoch+1}. Best validation loss: {best_val_loss:.6f}')
                    # Restore best weights
                    if best_weights and best_biases:
                        self.model.weights = best_weights
                        self.model.biases = best_biases
                    break
                
                if (epoch+1) % 100 == 0:
                    print(f'Epoch [{epoch+1}/{epochs}], Loss: {avg_loss:.6f}, Val Loss: {val_loss:.6f}')
            else:
                if (epoch+1) % 100 == 0:
                    print(f'Epoch [{epoch+1}/{epochs}], Loss: {avg_loss:.6f}')
                
    def predict(self, input_data):
        """Make predictions using the trained model."""
        results = []
        # Process each input sample
        for sample in input_data:
            if not isinstance(sample, list):
                sample = [sample]
            prediction = self.model.predict(sample)
            results.append(prediction)
        return results
    
    def save_model(self, path):
        """Save the model and configuration."""
        # Create directory if needed
        model_dir = os.path.dirname(path)
        if model_dir and not os.path.exists(model_dir):
            os.makedirs(model_dir)
        
        # Save the neural network
        self.model.save(path)
        
        # Save configuration separately
        config_path = os.path.splitext(path)[0] + '_config.json'
        with open(config_path, 'w') as f:
            json.dump(self.config, f)
            
        print(f"Model saved to {path} with config at {config_path}")
        
    def load_model(self, path):
        """Load model from file."""
        # Load configuration
        config_path = os.path.splitext(path)[0] + '_config.json'
        if os.path.exists(config_path):
            with open(config_path, 'r') as f:
                self.config = json.load(f)
        
        # Load the neural network
        self.model = SimpleNeuralNetwork.load(path)
    
    @staticmethod
    def auto_detect_model(model_path):
        """Automatically load model with configuration."""
        # Check for config file
        config_path = os.path.splitext(model_path)[0] + '_config.json'
        if os.path.exists(config_path):
            with open(config_path, 'r') as f:
                config = json.load(f)
                
            trainer = AITrainer(
                config['input_size'],
                config['hidden_size'],
                config['output_size'],
                config.get('learning_rate', 0.1),
                config.get('num_layers', 2)
            )
            trainer.load_model(model_path)
            return trainer
        
        # If no config, try to infer from the model file
        try:
            model = SimpleNeuralNetwork.load(model_path)
            trainer = AITrainer(
                model.input_size, 
                model.hidden_size,
                model.output_size,
                model.learning_rate,
                model.num_layers
            )
            trainer.model = model
            return trainer
        except:
            raise ValueError("Cannot automatically detect model parameters.")
