const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const User = require('./src/models/User');
const transactionRoutes = require('./src/routes/transactions');
const goalRoutes = require('./src/routes/goals');
const db = require('./src/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Serve static files (like HTML, CSS, JS) from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Session setup
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secure-secret-key',
    resave: false,
    saveUninitialized: false,
}));

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logout successful' });
    });
});

// ===============================
// Auth Routes
// ===============================

// Registration
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            username,
            password: hashedPassword,
        });

        const newUser = await user.save();
        req.session.user = newUser;
        res.status(201).json({ message: 'Registration successful' });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        req.session.user = user;
        res.json({ message: 'Login successful', redirect: '/index.html' });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: err.message });
    }
});

// ===============================
// Authentication Middleware
// ===============================
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
}

// ===============================
// Protected Routes
// ===============================
app.use('/api/transactions', isAuthenticated, transactionRoutes);
app.use('/api/goals', isAuthenticated, goalRoutes);

// ===============================
// Routes to serve HTML pages
// ===============================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// ===============================
// Start Server
// ===============================
db.connect()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`✅ Server running at http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err);
    });
