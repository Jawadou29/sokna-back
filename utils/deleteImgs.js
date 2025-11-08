const fs = require("fs");
const path = require("path");


function deleteFiles(images) {
  images.forEach(img => {
    const fullPath = path.join(__dirname, `../images/${img.filename}`);
    fs.unlink(fullPath, () => {});
  });
}

module.exports = deleteFiles;