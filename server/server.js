const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5555;
const DATA_FILE = path.join(__dirname, 'users.json');

// Initialize users file with default admin
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([
    { 
      username: "admin", 
      passwordHash: bcrypt.hashSync("admin123", 10),
      favorites: [] 
    }
  ]));
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Test route
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
      <li><strong>GET /api/user/:username/favorites</strong> - Get user favorites</li>
      <li><strong>POST /api/favorites/:username</strong> - Update favorites</li>
      <li><strong>GET /api/test</strong> - Connection test</li>
    </ul>
    <p>Server running on port ${PORT}</p>
  `);
});

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    let users = [];
    try {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      users = JSON.parse(data);
    } catch (readErr) {
      console.error("Error reading users:", readErr);
      throw new Error("Cannot read user database");
    }

    if (users.some(u => u.username === username)) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    users.push({ username, passwordHash, favorites: [] });

    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
    res.json({ success: true });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// User login
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
      user: {
        username: user.username,
        favorites: user.favorites || []
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user favorites
app.get('/api/user/:username/favorites', (req, res) => {
  try {
    const { username } = req.params;
    const users = JSON.parse(fs.readFileSync(DATA_FILE));
    const user = users.find(u => u.username === username);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      favorites: user.favorites || []
    });
  } catch (err) {
    console.error("Get favorites error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update favorites
app.post('/api/favorites/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { movie, action } = req.body;
    
    if (!movie || !action) {
      return res.status(400).json({ error: "Movie and action required" });
    }

    const users = JSON.parse(fs.readFileSync(DATA_FILE));
    const userIndex = users.findIndex(u => u.username === username);

    if (userIndex === -1) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!users[userIndex].favorites) {
      users[userIndex].favorites = [];
    }

    // Ensure movie has an ID
    const movieId = movie.id || `${movie.title}-${movie.year}-${movie.service}`;
    const movieWithId = { ...movie, id: movieId };

    if (action === 'add') {
      if (!users[userIndex].favorites.some(fav => fav.id === movieId)) {
        users[userIndex].favorites.push(movieWithId);
      }
    } else if (action === 'remove') {
      users[userIndex].favorites = users[userIndex].favorites.filter(
        fav => fav.id !== movieId
      );
    } else {
      return res.status(400).json({ error: "Invalid action" });
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
    res.json({ 
      success: true, 
      favorites: users[userIndex].favorites 
    });
  } catch (err) {
    console.error("Favorite update error:", err);
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