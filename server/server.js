const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 5555; // Changed from 5000 to avoid conflicts
const DATA_FILE = path.join(__dirname, 'users.json');

// Initialize users file with default admin
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([
    { 
      username: "admin", 
      passwordHash: bcrypt.hashSync("admin123", 10) // Password: "admin123"
    }
  ]));
}

// Middleware
app.use(cors()); // Enable CORS for React dev server
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Parse JSON bodies

// Test route (GET)
app.get('/api/test', (req, res) => {
  res.json({ status: 'Backend is working!' });
});

// Root route
app.get('/', (req, res) => {
  res.send(`
    <h1>FilterFlix Backend</h1>
    <p>Available Endpoints:</p>
    <ul>
      <li><strong>POST /api/register</strong> - Register new user</li>
      <li><strong>POST /api/login</strong> - User login</li>
      <li><strong>GET /api/test</strong> - Connection test</li>
    </ul>
    <p>Server running on port ${PORT}</p>
  `);
});

// Registration (POST)
app.post('/api/register', async (req, res) => {
  try {
    console.log("Registration attempt:", req.body); // Log incoming data

    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      console.log("Missing fields");
      return res.status(400).json({ error: "Username and password required" });
    }

    // Read users
    let users = [];
    try {
      console.log("Users file contents:", fs.readFileSync(DATA_FILE, 'utf8'));
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      users = JSON.parse(data);
      console.log("Current users:", users);
    } catch (readErr) {
      console.error("Error reading users:", readErr);
      throw new Error("Cannot read user database");
    }

    // Check duplicates
    if (users.some(u => u.username === username)) {
      console.log("Duplicate username:", username);
      return res.status(400).json({ error: "Username already exists" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    users.push({ username, passwordHash });

    // Write to file
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2)); // Pretty-print
      console.log("New user added:", username);
      res.json({ success: true });
    } catch (writeErr) {
      console.error("Error writing users:", writeErr);
      throw new Error("Cannot save user");
    }
  } catch (err) {
    console.error("Registration crash:", err);
    res.status(500).json({ 
      error: "Internal server error",
      details: err.message // Send actual error to frontend
    });
  }
});

// Login (POST)
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = JSON.parse(fs.readFileSync(DATA_FILE));
    const user = users.find(u => u.username === username);

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    res.json({ 
      success: true, 
      username: user.username 
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Server error!');
});

// Start server
app.listen(PORT, () => {
  console.log(`
  Server running on http://localhost:${PORT}
  Try these endpoints:
  - http://localhost:${PORT}/api/test
  - http://localhost:${PORT}
  `);
});