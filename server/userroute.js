const express = require('express');
const router = express.Router();
const User = require('./usermodel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    jwt.verify(token, 'your_jwt_secret', (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Signup route
router.post('/signup', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const user = await User.create({ 
            username, 
            password: hashedPassword,
            expenses: []
        });

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            'your_jwt_secret',
            { expiresIn: '30d' }
        );

        // Generate QR code
        const qrData = JSON.stringify({
            userId: user._id,
            token: token
        });
        
        const qrCode = await QRCode.toDataURL(qrData);
        user.qrCode = qrCode;
        await user.save();

        res.status(201).json({
            userId: user._id,
            username: user.username,
            token,
            qrCode
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        // Generate new JWT token
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            'your_jwt_secret',
            { expiresIn: '30d' }
        );

        res.status(200).json({
            userId: user._id,
            username: user.username,
            token,
            qrCode: user.qrCode
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Upload user's expenses
router.post('/upload-expenses', authenticateToken, async (req, res) => {
    try {
        const { expenses } = req.body;
        const userId = req.user.userId;

        await User.findByIdAndUpdate(userId, { expenses });
        res.status(200).json({ message: 'Expenses uploaded successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get user's expenses using QR code data
router.get('/get-expenses/:userId', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ expenses: user.expenses });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;