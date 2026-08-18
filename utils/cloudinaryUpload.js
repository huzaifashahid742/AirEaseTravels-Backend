import cloudinary from '../Config/cloudinary.js';
import streamifier from 'streamifier';

export const uploadToCloudinary = (fileBuffer, folderName = "airease-uploads") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: folderName },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};