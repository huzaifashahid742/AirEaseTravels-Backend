import cloudinary from '../Config/cloudinary.js';
import streamifier from 'streamifier';

export const uploadToCloudinary = (fileBuffer, folderName = "airease-uploads") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { 
        folder: folderName, 
        resource_type: "auto" // <-- Add this line to correctly process PDFs, images, etc.
      },
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