import { v2 as cloudinary } from "cloudinary";

export const uploadToCloudinary = (fileBuffer, folder = "university-logos") => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: folder },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        // Write the buffer into the stream and end it
        uploadStream.end(fileBuffer);
    });
};