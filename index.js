// index.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'your-secret-key'; // In production, use an environment variable

// Middleware to parse JSON and allow CORS
app.use(express.json());
app.use(cors());

// In-memory user storage (this is temporary for learning; later you use a database)
const users = [];

// Registration Endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { fullname, email, username, password, 'confirm-password': confirmPassword } = req.body;
    
    if (!fullname || !email || !username || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    // Check if user already exists
    const existingUser = users.find(u => u.email === email || u.username === username);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    // Encrypt the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user object
    const newUser = { id: Date.now(), fullname, email, username, password: hashedPassword };
    users.push(newUser);

    return res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// Login Endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Both username and password are required.' });
    }

    // Find the user (username can be either the email or username)
    const user = users.find(u => u.email === username || u.username === username);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Compare the password entered with the hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Create a token (this is optional but useful)
    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
    return res.status(200).json({ message: 'Login successful.', token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
    