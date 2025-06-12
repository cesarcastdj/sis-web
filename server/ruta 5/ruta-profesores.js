import express from 'express';
import db from '../db/db.js'; // Ajusta esta ruta si es necesario
import { isAuthenticated } from '../middleware/protegerRutas.js'; // Ajusta esta ruta si es necesario
import { hashPassword, comparePassword } from '../f(x)/contrasenias.js'; // Ajusta esta ruta si es necesario
import { syncRelationships, syncSingleRelationship } from '../f(x)/relaciones.js'; // Ajusta esta ruta si es necesario

const router = express.Router();

router.get('/profesores', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    try {
      const [TotalProfesores] = await db.promise().query('SELECT COUNT(*) AS total FROM usuarios WHERE rol = "profesor";');
      const totalCount = TotalProfesores[0].total;

      const [ProfesoresActivos] = await db.promise().query('SELECT COUNT(*) AS active FROM usuarios WHERE rol = "profesor" AND estado = 1;');
      const activeCount = ProfesoresActivos[0].active;

      const [ProfesoresInactivos] = await db.promise().query('SELECT COUNT(*) AS inactive FROM usuarios WHERE rol = "profesor" AND estado = 0;');
      const inactiveCount = ProfesoresInactivos[0].inactive;

      const totalPages = Math.ceil(totalCount / limit);

      const profesoresQuery = `
        SELECT
            u.id_usuario,
            u.cedula,
            u.primer_nombre,
            u.segundo_nombre,
            u.primer_apellido,
            u.segundo_apellido,
            u.correo,
            u.telefono,
            d.direccion AS direccion,
            u.estado AS estado,
            u.ultima_conexion,
            -- Modificación aquí para asegurar que 'periodoAcademicoNames' sea siempre el nombre del periodo o 'N/A'
            IFNULL(GROUP_CONCAT(DISTINCT p.periodo ORDER BY p.periodo ASC), 'N/A') AS periodoAcademicoNames,
            IFNULL(GROUP_CONCAT(DISTINCT up.id_periodo ORDER BY up.id_periodo ASC), '') AS periodoAcademicoIds,
            IFNULL(GROUP_CONCAT(DISTINCT c.curso ORDER BY c.curso ASC), '') AS cursosNames,
            IFNULL(GROUP_CONCAT(DISTINCT uc.id_curso ORDER BY uc.id_curso ASC), '') AS cursosIds,
            IFNULL(GROUP_CONCAT(DISTINCT m.materia ORDER BY m.materia ASC), '') AS materiasNames,
            IFNULL(GROUP_CONCAT(DISTINCT um.id_materia ORDER BY um.id_materia ASC), '') AS materiasIds,
            IFNULL(GROUP_CONCAT(DISTINCT s.seccion ORDER BY s.seccion ASC), '') AS seccionNames,
            IFNULL(GROUP_CONCAT(DISTINCT us.id_seccion ORDER BY us.id_seccion ASC), '') AS seccionIds
        FROM
            usuarios u
        LEFT JOIN
            usuario_periodo up ON u.id_usuario = up.id_usuario
        LEFT JOIN
            periodo p ON up.id_periodo = p.id_periodo
        LEFT JOIN
            usuario_cursos uc ON u.id_usuario = uc.id_usuario
        LEFT JOIN
            cursos c ON uc.id_curso = c.id_curso
        LEFT JOIN
            usuario_materias um ON u.id_usuario = um.id_usuario
        LEFT JOIN
            materias m ON um.id_materia = m.id_materia
        LEFT JOIN
            usuario_seccion us ON u.id_usuario = us.id_usuario
        LEFT JOIN
            seccion s ON us.id_seccion = s.id_seccion
        LEFT JOIN
            direccion d ON u.id_direccion = d.id_direccion
        WHERE
            u.rol = 'profesor'
        GROUP BY
            u.id_usuario
        ORDER BY
            u.primer_apellido ASC
        LIMIT ? OFFSET ?;
      `;

      // 🏆 Ejecutar la consulta y procesar los datos
      const [profesores] = await db.promise().query(profesoresQuery, [limit, offset]);


      res.json({
        profesores: profesores,
        totalCount,
        activeCount,
        inactiveCount,
        totalPages,
        currentPage: page
      });

    } catch (error) {
      console.error("❌ Error al obtener profesores:", error);
      res.status(500).json({ error: "Error al cargar profesores", detalle: error.message });
    }
});

router.put('/profesores/:id/estado', async (req, res) => { // Eliminado el '/api'
    const { id } = req.params;
    const { estado } = req.body; 

    try {
      const updateEstadoQuery = `
        UPDATE usuarios
        SET estado = ?
        WHERE id_usuario = ?;
      `;
      await db.promise().query(updateEstadoQuery, [estado, id]);
      res.json({ message: `Estado del profesor ${id} actualizado a ${estado}.` });
    } catch (error) {
      console.error("❌ Error al actualizar estado del profesor:", error);
      res.status(500).json({ error: "Error al actualizar estado del profesor", detalle: error.message });
    }
});

export default router;
