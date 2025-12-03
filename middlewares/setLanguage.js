function setLanguage(req, res, next) {
  req.lang = req.headers["accept-language"] || "en";
  next();
}

module.exports = {
  setLanguage
}
