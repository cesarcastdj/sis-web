import express from 'express';
import pool from './db.js';
const router = express.Router();

// Ruta de prueba para verificar si todo funciona
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10; 
  const offset = (page - 1) * limit;

  try {
    const [rows] = await pool.query(`
    SELECT u.id_usuario, u.cedula, u.primer_nombre AS primerNombre, u.primer_apellido AS primerApellido,
    IFNULL(p.periodo, 'Sin periodo') AS periodoAcademico,
    IFNULL(GROUP_CONCAT(DISTINCT c.curso SEPARATOR ' | '), 'Sin cursos') AS cursos,
    IFNULL(GROUP_CONCAT(DISTINCT m.materia SEPARATOR ' | '), 'Sin materias') AS materias,
    u.estado, u.ultima_conexion AS ultimaConexion
    FROM usuarios u
    LEFT JOIN usuario_periodo up ON u.id_usuario = up.id_usuario
    LEFT JOIN periodo p ON up.id_periodo = p.id_periodo
    LEFT JOIN cursos_materias cm ON u.id_usuario = cm.id_usuario
    LEFT JOIN cursos c ON cm.id_curso = c.id_curso
    LEFT JOIN materias m ON cm.id_materia = m.id_materia
    WHERE u.rol = 'estudiante'
    GROUP BY u.id_usuario, p.periodo, u.cedula, u.primer_nombre, u.primer_apellido, u.estado, u.ultima_conexion
    LIMIT ? OFFSET ?;
    `, [limit, offset]);

    console.log("🛠 Datos obtenidos desde MySQL:", rows);

    const [[totalRows]] = await pool.query("SELECT COUNT(*) AS total FROM usuarios WHERE rol = 'estudiante';");
    const totalPages = Math.ceil(totalRows.total / limit);

    res.json({ estudiantes: rows, currentPage: page, totalPages });
  } catch (error) {
    console.error("❌ Error al obtener estudiantes:", error);
    res.status(500).json({ error: "Error al cargar estudiantes" });
  }
});
export default router;
