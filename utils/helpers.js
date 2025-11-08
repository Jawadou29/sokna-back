const { cloudinaryUploadImage } = require("./cloudinary");
const path = require("path");

// Group multer files by fieldname for easy lookup
function groupFilesByField(files = []) {
  const map = {};
  for (const file of files) {
    if (!map[file.fieldname]) map[file.fieldname] = [];
    map[file.fieldname].push(file);
  }
  return map;
}


// Get the full path for a multer file (prefer file.path)
function getFileFullPath(file) {
  return file.path || path.join(__dirname, '../images', file.filename);
}


async function uploadFilesToCloudinary(files = []) {
  // upload in parallel -- you can change to sequential if you prefer
  const uploads = await Promise.all(
    files.map(async (file) => {
      const fullPath = getFileFullPath(file);
      const result = await cloudinaryUploadImage(fullPath); // your existing helper
      return { url: result.url, publicId: result.public_id };
    })
  );
  return uploads;
}

module.exports = {
  groupFilesByField,
  getFileFullPath,
  uploadFilesToCloudinary
}