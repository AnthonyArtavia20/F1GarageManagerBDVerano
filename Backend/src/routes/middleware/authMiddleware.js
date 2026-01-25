module.exports = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  // Also set req.user for middleware compatibility
  req.user = req.session.user;
  next();
};
