import multer from 'multer';

const storage = multer.memoryStorage();

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadProfilePhoto = upload.single('profilePhoto');

export {
    upload,
    uploadProfilePhoto
};