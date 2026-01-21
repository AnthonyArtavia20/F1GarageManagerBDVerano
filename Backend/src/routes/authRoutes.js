const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// ===== RUTAS PÚBLICAS =====

// Registro de usuario
router.post("/register", authController.register);

// Login
router.post("/login", authController.login);

// Logout
router.post("/logout", authController.logout);

// ===== RUTAS PROTEGIDAS (requieren sesión) =====

// Obtener información del usuario actual
router.get("/me", authController.requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.session.user
  });
});

// Debug de sesión (pública para troubleshooting)
router.get("/debug", (req, res) => {
  const sessionInfo = {
    sessionID: req.sessionID,
    sessionExists: !!req.session.id,
    hasUser: !!req.session.user,
    user: req.session.user || null,
    cookies: req.headers.cookie || 'none',
    origin: req.headers.origin || 'none',
    timestamp: new Date().toISOString()
  };
  
  console.log('Debug de sesión:', sessionInfo);
  
  res.json({
    success: true,
    debug: sessionInfo
  });
});

// Test de sesión persistente
router.get("/test", authController.requireAuth, (req, res) => {
  res.json({
    success: true,
    message: "Session test passed!",
    user: req.session.user,
    sessionID: req.sessionID,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;