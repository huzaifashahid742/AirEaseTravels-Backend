import multer from 'multer';

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true); 
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images and PDF are allowed.'), false);
    }
};

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter
});

const uploadProfilePhoto = upload.single('profilePhoto');

export {
    upload,
    uploadProfilePhoto
};