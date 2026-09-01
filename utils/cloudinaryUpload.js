import cloudinary from '../Config/cloudinary.js';

export const uploadToCloudinary = (fileBuffer, folder = "university-logos") => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: folder },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        uploadStream.end(fileBuffer);
    });
};