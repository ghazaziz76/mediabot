const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.use(express.static(path.join(__dirname, 'public')));

// Import routes
const authController = require('./src/controllers/authController');
const mediaController = require('./src/controllers/mediaController');
const { authenticateToken } = require('./src/middleware/auth');
const platformRoutes = require('./src/routes/platformRoutes');
const campaignRoutes = require('./src/routes/campaignRoutes');

// Authentication routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);

// Media upload routes (protected)
app.post('/api/media/upload', authenticateToken, mediaController.upload.single('file'), mediaController.uploadSingle);
app.get('/api/media', authenticateToken, mediaController.getAllMedia);
app.delete('/api/media/:id', authenticateToken, mediaController.deleteMedia);
app.use('/api/platforms', platformRoutes);

// Campaign routes (protected)
app.use('/api/campaigns', campaignRoutes);


// Protected test route
app.get('/api/protected', authenticateToken, (req, res) => {
    res.json({ 
        message: 'This is a protected route!',
        user: {
            id: req.user.id,
            username: req.user.username,
            email: req.user.email
        }
    });
});

// Basic test route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Media Bot API is running!',
        version: '1.0.0',
        status: 'active'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Access your API at: http://localhost:${PORT}`);
});