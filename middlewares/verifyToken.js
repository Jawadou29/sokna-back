const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const tokenAuth = req.headers.authorization;
  if (tokenAuth && tokenAuth.startsWith("bearer")) {
    const token = tokenAuth.split(" ")[1];
    try {
      const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
      req.user = decodedToken;
      next();
    } catch (error) {
      res.status(400).json({message: "not valid token, access denied"});
    }
  }
  else{
    res.status(400).json({message: "Invalid token, access denied"});
  }
}

// only admin
function verifyTokenAndAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.role === "admin") {
      next();
    }
    else{
      return res.status(403).json({message: "not allowed, only admin"});
    }
  })
}

// only user 
function verifyTokenAndUser(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.id === req.params.id) {
      next();
    }
    else{
      return res.status(403).json({message: "not allowed, only user him self"});
    }
  })
}


// only user or admin
function verifyTokenAndUserOrAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.id === req.params.id || req.user.role == "admin") {
      next();
    }
    else{
      return res.status(403).json({message: "not allowed, only user him self"});
    }
  })
}

module.exports = {
  verifyToken,
  verifyTokenAndAdmin,
  verifyTokenAndUser,
  verifyTokenAndUserOrAdmin
}