import math
import random
import json

class Matrix:
    """Simple matrix operations for neural network computations."""
    
    def __init__(self, rows, cols, data=None):
        self.rows = rows
        self.cols = cols
        
        if data is not None:
            self.data = data
        else:
            self.data = [[0.0 for _ in range(cols)] for _ in range(rows)]
    
    def randomize(self, min_val=-1, max_val=1):
        """Initialize with random values."""
        for i in range(self.rows):
            for j in range(self.cols):
                self.data[i][j] = random.uniform(min_val, max_val)
        return self
    
    @staticmethod
    def from_array(arr):
        """Create matrix from array."""
        m = Matrix(len(arr), 1)
        for i in range(len(arr)):
            m.data[i][0] = arr[i]
        return m
    
    def to_array(self):
        """Convert matrix to array."""
        arr = []
        for i in range(self.rows):
            for j in range(self.cols):
                arr.append(self.data[i][j])
        return arr
    
    def add(self, other):
        """Add matrix or scalar."""
        if isinstance(other, Matrix):
            for i in range(self.rows):
                for j in range(self.cols):
                    self.data[i][j] += other.data[i][j]
        else:  # scalar
            for i in range(self.rows):
                for j in range(self.cols):
                    self.data[i][j] += other
        return self
    
    @staticmethod
    def subtract(a, b):
        """Subtract matrices."""
        result = Matrix(a.rows, a.cols)
        for i in range(result.rows):
            for j in range(result.cols):
                result.data[i][j] = a.data[i][j] - b.data[i][j]
        return result
    
    @staticmethod
    def multiply(a, b):
        """Matrix multiplication."""
        if a.cols != b.rows:
            raise ValueError("Columns of A must match rows of B.")
            
        result = Matrix(a.rows, b.cols)
        for i in range(result.rows):
            for j in range(result.cols):
                sum_val = 0
                for k in range(a.cols):
                    sum_val += a.data[i][k] * b.data[k][j]
                result.data[i][j] = sum_val
        return result
    
    def hadamard(self, other):
        """Element-wise multiplication."""
        for i in range(self.rows):
            for j in range(self.cols):
                self.data[i][j] *= other.data[i][j]
        return self
    
    def map(self, func):
        """Apply function to each element."""
        for i in range(self.rows):
            for j in range(self.cols):
                self.data[i][j] = func(self.data[i][j], i, j)
        return self
    
    @staticmethod
    def map_static(matrix, func):
        """Apply function to each element and return new matrix."""
        result = Matrix(matrix.rows, matrix.cols)
        for i in range(matrix.rows):
            for j in range(matrix.cols):
                result.data[i][j] = func(matrix.data[i][j], i, j)
        return result
    
    @staticmethod
    def transpose(matrix):
        """Transpose matrix."""
        result = Matrix(matrix.cols, matrix.rows)
        for i in range(matrix.rows):
            for j in range(matrix.cols):
                result.data[j][i] = matrix.data[i][j]
        return result
    
    def copy(self):
        """Create a copy of this matrix."""
        m = Matrix(self.rows, self.cols)
        for i in range(self.rows):
            for j in range(self.cols):
                m.data[i][j] = self.data[i][j]
        return m
    
    def serialize(self):
        """Serialize the matrix to a dictionary."""
        return {
            "rows": self.rows,
            "cols": self.cols,
            "data": self.data
        }
    
    @staticmethod
    def deserialize(data):
        """Deserialize matrix from a dictionary."""
        return Matrix(data["rows"], data["cols"], data["data"])

# Activation functions
def sigmoid(x, *args):
    try:
        return 1 / (1 + math.exp(-x))
    except OverflowError:
        return 0.0 if x < 0 else 1.0

def dsigmoid(y, *args):
    # y is already sigmoid(x)
    return y * (1 - y)

def relu(x, *args):
    return max(0, x)

def drelu(x, *args):
    return 1 if x > 0 else 0

class SimpleNeuralNetwork:
    def __init__(self, input_size, hidden_size, output_size, num_layers=2):
        """Initialize neural network with given architecture."""
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.output_size = output_size
        self.num_layers = num_layers
        
        # Initialize weights and biases
        self.weights = []
        self.biases = []
        
        # Input to first hidden layer
        self.weights.append(Matrix(hidden_size, input_size).randomize())
        self.biases.append(Matrix(hidden_size, 1).randomize())
        
        # Hidden layers
        for i in range(num_layers - 1):
            self.weights.append(Matrix(hidden_size, hidden_size).randomize())
            self.biases.append(Matrix(hidden_size, 1).randomize())
        
        # Last hidden to output
        self.weights.append(Matrix(output_size, hidden_size).randomize())
        self.biases.append(Matrix(output_size, 1).randomize())
        
        # Learning rate
        self.learning_rate = 0.1
        
        # Use sigmoid activation by default
        self.activation = sigmoid
        self.d_activation = dsigmoid
    
    def predict(self, input_array):
        """Forward pass through the network."""
        # Convert input to matrix
        inputs = Matrix.from_array(input_array)
        
        # Forward through layers
        current = inputs
        
        for i in range(len(self.weights)):
            # Multiply by weights
            current = Matrix.multiply(self.weights[i], current)
            # Add bias
            current.add(self.biases[i])
            # Apply activation function
            current.map(self.activation)
        
        # Return output as array
        return current.to_array()
    
    def train(self, inputs, target):
        """Train the network with one sample."""
        # Convert input to matrix
        input_matrix = Matrix.from_array(inputs)
        
        # Forward pass storing all activations
        activations = [input_matrix]
        outputs = [input_matrix]
        
        # Forward through layers
        current = input_matrix
        for i in range(len(self.weights)):
            # Multiply by weights
            current = Matrix.multiply(self.weights[i], current)
            # Add bias
            current.add(self.biases[i])
            activations.append(current.copy())
            # Apply activation function
            current.map(self.activation)
            outputs.append(current.copy())
        
        # Calculate output error
        targets = Matrix.from_array(target)
        output_errors = Matrix.subtract(targets, outputs[-1])
        
        # Backpropagation
        gradients = outputs[-1].copy()
        gradients.map(self.d_activation)
        gradients.hadamard(output_errors)
        gradients.map(lambda x, *args: x * self.learning_rate)
        
        # Adjust weights and biases for output layer
        hidden_T = Matrix.transpose(outputs[-2])
        weight_deltas = Matrix.multiply(gradients, hidden_T)
        self.weights[-1].add(weight_deltas)
        self.biases[-1].add(gradients)
        
        # Backpropagate through the hidden layers
        for layer in range(len(self.weights) - 2, -1, -1):
            # Calculate error for this layer
            who_t = Matrix.transpose(self.weights[layer + 1])
            errors = Matrix.multiply(who_t, output_errors)
            output_errors = errors
            
            # Calculate gradients
            gradients = outputs[layer + 1].copy()
            gradients.map(self.d_activation)
            gradients.hadamard(errors)
            gradients.map(lambda x, *args: x * self.learning_rate)
            
            # Calculate deltas
            inputs_t = Matrix.transpose(outputs[layer])
            weight_deltas = Matrix.multiply(gradients, inputs_t)
            self.weights[layer].add(weight_deltas)
            self.biases[layer].add(gradients)
    
    def save(self, filename):
        """Save the neural network to a file."""
        data = {
            "input_size": self.input_size,
            "hidden_size": self.hidden_size,
            "output_size": self.output_size,
            "num_layers": self.num_layers,
            "learning_rate": self.learning_rate,
            "weights": [w.serialize() for w in self.weights],
            "biases": [b.serialize() for b in self.biases]
        }
        
        with open(filename, "w") as f:
            json.dump(data, f)
    
    @staticmethod
    def load(filename):
        """Load a neural network from a file."""
        with open(filename, "r") as f:
            data = json.load(f)
        
        nn = SimpleNeuralNetwork(
            data["input_size"],
            data["hidden_size"],
            data["output_size"],
            data["num_layers"]
        )
        
        nn.learning_rate = data["learning_rate"]
        nn.weights = [Matrix.deserialize(w) for w in data["weights"]]
        nn.biases = [Matrix.deserialize(b) for b in data["biases"]]
        
        return nn
