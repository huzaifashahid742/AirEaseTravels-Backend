import multer from 'multer';

export const notFound = (req, res, next) => {
    res.status(404);
    next(new Error(`Route not found: ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    // 🔴 FIX: Handle Multer-specific errors cleanly so they return 400 instead of a crashing 500
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