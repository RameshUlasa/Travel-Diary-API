const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "traveldiary.db");
let db = null;

// Initializing DB and Server
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // Create User Table
    const createUserQuery = `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      username TEXT UNIQUE,
      password TEXT
    )`;
    await db.run(createUserQuery);

    //Create DiaryEntry Table
    const createDiaryEntryQuery = `CREATE TABLE IF NOT EXISTS diary_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        date TEXT DEFAULT CURRENT_TIMESTAMP,
        location TEXT,
        userId INTEGER,
        FOREIGN KEY (userId) REFERENCES users(id)
    )`;
    await db.run(createDiaryEntryQuery);

    console.log("Database initialized successfully");
    app.listen(5002, () => {
      console.log("Server Running at http://localhost:5002/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// Define JWT secret key
// We should use .env file to store such completed data as best practice.
//But for ease of use I'm going with this approach
const JWT_SECRET = "your_secret_key_here";

/// Middleware for JWT authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Invalid Authorization header format" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Invalid JWT Token" });
  }

  jwt.verify(token, JWT_SECRET, (error, payload) => {
    if (error) {
      return res.status(401).json({ error: "Invalid JWT Token" });
    }
    req.user = payload; // Set the user payload to req.user
    next();
  });
};

// User API's
// User Registration API
app.post("/register", async (req, res) => {
  const { name, username, password } = req.body;

  try {
    // Check if the username already exists in the database
    const existingUser = await db.get(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    await db.run(
      "INSERT INTO users (name, username, password) VALUES (?, ?, ?)",
      [name, username, hashedPassword]
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.log(`Registration error: ${error.message}`);
    res.status(500).json({ error: "Registration failed" });
  }
});

//User Login API
// User Login API
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the user with the given username exists in the database
    const user = await db.get("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Compare the provided password with the hashed password in the database
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    // Generate JWT token for authentication with user ID included
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET
    );

    res.json({ accessToken: token });
  } catch (error) {
    console.error(`Login error: ${error.message}`);
    res.status(500).json({ error: "Login failed" });
  }
});

//Diary Entry API's
// Create Diary Entry API
app.post("/diary-entries", authenticateToken, async (req, res) => {
  const { title, description, location } = req.body;

  const userId = req.user.id;

  try {
    // Insert new diary entry into the database
    const result = await db.run(
      "INSERT INTO diary_entries (title, description, location, userId) VALUES (?, ?, ?, ?)",
      [title, description, location, userId]
    );

    res
      .status(201)
      .json({ message: "Diary entry created successfully", id: result.lastID });
  } catch (error) {
    console.error(`Create diary entry error: ${error.message}`);
    res.status(500).json({ error: "Failed to create diary entry" });
  }
});

// Get All Diary Entries for User API
app.get("/diary-entries", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    // Get all diary entries for the user
    const diaryEntries = await db.all(
      "SELECT * FROM diary_entries WHERE userId = ?",
      [userId]
    );

    res.json(diaryEntries);
  } catch (error) {
    console.error(`Get all diary entries error: ${error.message}`);
    res.status(500).json({ error: "Failed to get diary entries" });
  }
});

// Get Diary Entry by ID API
app.get("/diary-entries/:id", authenticateToken, async (req, res) => {
  const diaryEntryId = req.params.id;
  const userId = req.user.id;

  try {
    // Check if the diary entry exists for the given ID and user
    const diaryEntry = await db.get(
      "SELECT * FROM diary_entries WHERE id = ? AND userId = ?",
      [diaryEntryId, userId]
    );

    if (!diaryEntry) {
      return res.status(404).json({ error: "Diary entry not found" });
    }

    res.json(diaryEntry);
  } catch (error) {
    console.error(`Get diary entry by ID error: ${error.message}`);
    res.status(500).json({ error: "Failed to get diary entry" });
  }
});

// Update Diary Entry by ID API
app.put("/diary-entries/:id", authenticateToken, async (req, res) => {
  const diaryEntryId = req.params.id;
  const { title, description, location } = req.body;
  const userId = req.user.id;

  try {
    // Check if the diary entry exists for the given ID and user
    const existingDiaryEntry = await db.get(
      "SELECT * FROM diary_entries WHERE id = ? AND userId = ?",
      [diaryEntryId, userId]
    );

    if (!existingDiaryEntry) {
      return res.status(404).json({ error: "Diary entry not found" });
    }

    // Update the diary entry
    await db.run(
      "UPDATE diary_entries SET title = ?, description = ?, location = ? WHERE id = ? AND userId = ?",
      [title, description, location, diaryEntryId, userId]
    );

    res.json({ message: "Diary entry updated successfully" });
  } catch (error) {
    console.error(`Update diary entry by ID error: ${error.message}`);
    res.status(500).json({ error: "Failed to update diary entry" });
  }
});

// Delete Diary Entry by ID API
app.delete("/diary-entries/:id", authenticateToken, async (req, res) => {
  const diaryEntryId = req.params.id;
  const userId = req.user.id;

  try {
    // Check if the diary entry exists for the given ID and user
    const existingDiaryEntry = await db.get(
      "SELECT * FROM diary_entries WHERE id = ? AND userId = ?",
      [diaryEntryId, userId]
    );

    if (!existingDiaryEntry) {
      return res.status(404).json({ error: "Diary entry not found" });
    }

    // Delete the diary entry
    await db.run("DELETE FROM diary_entries WHERE id = ? AND userId = ?", [
      diaryEntryId,
      userId,
    ]);

    res.json({ message: "Diary entry deleted successfully" });
  } catch (error) {
    console.error(`Delete diary entry by ID error: ${error.message}`);
    res.status(500).json({ error: "Failed to delete diary entry" });
  }
});
