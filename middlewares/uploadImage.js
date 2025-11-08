const multer = require("multer"); 
const path = require("path"); 

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../images"));
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
})
const uploadImage = multer({
  storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith("image")) {
      cb(null, true);
    }
    else{
      cb(new Error("unsupported file format"), false);
    }
  },
  limits: {
    fileSize: 1024 * 1024 * 2
  }
});

module.exports = uploadImage;