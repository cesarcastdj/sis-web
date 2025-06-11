// routes/ruta-comunes.js
import express from 'express';
import db from '../db/db.js'; // Ajusta esta ruta si es necesario
import { isAuthenticated } from '../middleware/protegerRutas.js'; // Ajusta esta ruta si es necesario

const router = express.Router();

// --- Rutas de Comunes (API endpoints) ---

// Obtener notificaciones pendientes
router.get('/notificaciones', isAuthenticated, (req, res) => {
  db.query(`
    SELECT 
      n.id_notificacion,
      n.id_usuario,
      u.primer_nombre,
      u.primer_apellido,
      u.cedula,
      n.mensaje,
      n.fecha,
      n.estado
    FROM notificaciones n
    JOIN usuarios u ON n.id_usuario = u.id_usuario
    WHERE n.estado = 'pendiente'
    ORDER BY n.fecha DESC;
  `, (err, results) => {
    if (err) {
      console.error("Error obteniendo notificaciones:", err);
      return res.status(500).json({ error: "Error al obtener notificaciones" });
    }
    res.json({ notificaciones: results });
  });
});

// Obtener estados
router.get('/estados', (req, res) => { // No requiere autenticación si es para todos
  db.query('SELECT id_estado, estados FROM estados ORDER BY estados', (err, results) => {
    if (err) {
      console.error('Error en la consulta de estados:', err);
      return res.status(500).json({ error: 'Error al obtener estados' });
    }
    res.json(results);
  });
});

// Obtener ciudades por estado
router.get('/estados/:id/ciudades', (req, res) => { // No requiere autenticación si es para todos
  const estadoId = req.params.id;
  db.query(
    'SELECT id_ciudad, ciudad FROM ciudades WHERE id_estado = ? ORDER BY ciudad',
    [estadoId],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Error al obtener ciudades' });
      res.json(results);
    }
  );
});

// Verificar si cédula existe
router.get('/verificar-cedula', (req, res) => {
  const { cedula } = req.query;
  db.query('SELECT id_usuario FROM usuarios WHERE cedula = ?', [cedula], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error en la consulta' });

    if (results.length > 0) {
      res.json({ existe: true, id_usuario: results[0].id_usuario });
    } else {
      res.json({ existe: false });
    }
  });
});

// Verificar si correo existe
router.get('/verificar-correo', (req, res) => {
  const { email } = req.query;
  db.query('SELECT id_usuario FROM usuarios WHERE correo = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error en la consulta' });

    if (results.length > 0) {
      res.json({ existe: true, id_usuario: results[0].id_usuario });
    } else {
      res.json({ existe: false });
    }
  });
});

// Exporta el router por defecto
export default router;
