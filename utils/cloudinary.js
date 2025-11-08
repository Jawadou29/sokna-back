const cloudinary = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// cloudinary uplouad image
const cloudinaryUploadImage = async (fileToUpload) => {
  try {
    const data = await cloudinary.uploader.upload(fileToUpload, {
      resource_type: "auto",
    });
    return data;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to upload image to Cloudinary.")
  }
}
// cloudinary delete image
const cloudinaryDeleteImage = async (publidId) => {
  try {
      const result = await cloudinary.uploader.destroy(publidId);
      return result;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to upload image to Cloudinary.")
  }
}


// cloudinary delete delete many
const cloudinaryDeleteMany = async (images) => {
  try {
    const publicIds = images.map(obj => obj.publicId);
    const result = await cloudinary.v2.api.delete_resources(publicIds);
    return result;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to upload image to Cloudinary.")
  }
}

module.exports = {
  cloudinaryUploadImage,
  cloudinaryDeleteImage,
  cloudinaryDeleteMany
}