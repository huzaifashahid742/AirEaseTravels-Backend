import multer from 'multer';

// 1. Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Ensure this folder exists
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// 2. Base multer configuration instance
const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// 3. Export with the exact name used in auth.js routes (.single('profilePhoto'))
export const uploadProfilePhoto = upload.single('profilePhoto');

// (Optional) If you also want to keep a generic 'upload' export just in case:
export { upload };

export const notFound = (req, res, next) => {
    res.status(404);
    next(new Error(`Route not found: ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof multer.MulterError) {
        let message = err.message;
        if (err.code === "LIMIT_FILE_SIZE") {
            message = "File size is too large. Maximum limit is 5MB.";
        }
        return res.status(400).json({
            success: false,
            message: `File upload error: ${message}`
        });
    }

    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
    
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
};