const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Media } = require('../../models');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../../public/uploads');
        
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename: timestamp_originalname
        const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        const basename = path.basename(file.originalname, extension);
        cb(null, basename + '_' + uniqueSuffix + extension);
    }
});

// File filter for allowed file types
// File filter for allowed file types (temporarily allowing all files for testing)
const fileFilter = (req, file, cb) => {
    // Allow all files for testing
    cb(null, true);
};
// Create multer upload middleware
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: fileFilter
});

// Upload single file
const uploadSingle = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        // Save file info to database
        const media = await Media.create({
            filename: req.file.originalname,
            filePath: `/uploads/${req.file.filename}`,
            fileType: req.file.mimetype,
            size: req.file.size
        });
        
        res.json({
            message: 'File uploaded successfully',
            media: {
                id: media.id,
                filename: media.filename,
                filePath: media.filePath,
                fileType: media.fileType,
                size: media.size,
                url: `${req.protocol}://${req.get('host')}${media.filePath}`
            }
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all media files
const getAllMedia = async (req, res) => {
    try {
        const media = await Media.findAll({
            order: [['createdAt', 'DESC']]
        });
        
        // Add full URL to each media item
        const mediaWithUrls = media.map(item => ({
            ...item.toJSON(),
            url: `${req.protocol}://${req.get('host')}${item.filePath}`
        }));
        
        res.json({
            message: 'Media files retrieved successfully',
            media: mediaWithUrls
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete media file
const deleteMedia = async (req, res) => {
    try {
        const { id } = req.params;
        
        const media = await Media.findByPk(id);
        if (!media) {
            return res.status(404).json({ error: 'Media file not found' });
        }
        
        // Delete file from filesystem
        const fullPath = path.join(__dirname, '../../public', media.filePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
        
        // Delete from database
        await media.destroy();
        
        res.json({ message: 'Media file deleted successfully' });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    upload,
    uploadSingle,
    getAllMedia,
    deleteMedia
};