const express = require("express");
const router = express.Router();

// OJO: esta ruta debe apuntar al archivo real
const authController = require("../controllers/authController");

// Middleware para verificar sesión
function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  next();
}


router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);

// Endpoint para probar sesión
router.get("/me", requireAuth, (req, res) => {
  res.json({ success: true, user: req.session.user });
});

module.exports = router;
