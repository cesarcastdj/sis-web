import db from '../db/db.js';




// Middleware para proteger rutas
function isAuthenticated(req, res, next) {
    if (req.session.usuario) return next();
    return res.status(401).json({ error: 'No autenticado' }); // 🔹 Bloquea si no hay sesión
  }
export { isAuthenticated };