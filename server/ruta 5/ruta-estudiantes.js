import express from 'express';
import db from '../db/db.js'; // Ajusta esta ruta si es necesario
import { isAuthenticated } from '../middleware/protegerRutas.js'; // Ajusta esta ruta si es necesario
import { hashPassword, comparePassword } from '../f(x)/contrasenias.js'; // Ajusta esta ruta si es necesario
import { syncRelationships, syncSingleRelationship } from '../f(x)/relaciones.js'; // Ajusta esta ruta si es necesario

const router = express.Router();

router.get('/estudiantes', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    try {
      // 1️⃣ Consulta para el total de estudiantes
      const [totalStudentsResult] = await db.promise().query('SELECT COUNT(*) AS total FROM usuarios WHERE rol = "estudiante";');
      const totalCount = totalStudentsResult[0].total;

      // 2️⃣ Consulta para el total de estudiantes activos
      const [activeStudentsResult] = await db.promise().query('SELECT COUNT(*) AS active FROM usuarios WHERE rol = "estudiante" AND estado = 1;');
      const activeCount = activeStudentsResult[0].active;

      // 3️⃣ Consulta para el total de estudiantes inactivos
      const [inactiveStudentsResult] = await db.promise().query('SELECT COUNT(*) AS inactive FROM usuarios WHERE rol = "estudiante" AND estado = 0;');
      const inactiveCount = inactiveStudentsResult[0].inactive;

      const totalPages = Math.ceil(totalCount / limit);

      // 4️⃣ Consulta optimizada para obtener los estudiantes con todos los detalles
      const studentsQuery = `
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
            u.rol = 'estudiante'
        GROUP BY
            u.id_usuario
        ORDER BY
            u.primer_apellido ASC
        LIMIT ? OFFSET ?;
      `;

      // 🏆 Ejecutar la consulta y procesar los datos
      const [estudiantes] = await db.promise().query(studentsQuery, [limit, offset]);


      res.json({
        estudiantes: estudiantes,
        totalCount,
        activeCount,
        inactiveCount,
        totalPages,
        currentPage: page
      });

    } catch (error) {
      console.error("❌ Error al obtener estudiantes:", error);
      res.status(500).json({ error: "Error al cargar estudiantes", detalle: error.message });
    }
});

router.put('/estudiantes/:id/estado', async (req, res) => { // Eliminado el '/api'
    const { id } = req.params;
    const { estado } = req.body; 

    try {
      const updateEstadoQuery = `
        UPDATE usuarios
        SET estado = ?
        WHERE id_usuario = ?;
      `;
      await db.promise().query(updateEstadoQuery, [estado, id]);
      res.json({ message: `Estado del estudiante ${id} actualizado a ${estado}.` });
    } catch (error) {
      console.error("❌ Error al actualizar estado del estudiante:", error);
      res.status(500).json({ error: "Error al actualizar estado del estudiante", detalle: error.message });
    }
});

router.put('/estudiantes/:id', async (req, res) => { // Eliminado el '/api'
    const { id } = req.params;
    const {
      cedula, correo, primerNombre, segundoNombre, primerApellido, segundoApellido,
      telefono, direccion, materias, cursos, secciones, periodoAcademico 
    } = req.body;

    try {
      let id_direccion_a_usar = null;

      // 1. Obtener la dirección actual del usuario y sus detalles (id_direccion, direccion_texto, id_ciudad, id_estado)
      const [currentAddressResult] = await db.promise().query(`
          SELECT u.id_direccion, d.direccion, d.id_direccion, d.id_ciudad, d.id_estado
          FROM usuarios u
          LEFT JOIN direccion d ON u.id_direccion = d.id_direccion
          WHERE u.id_usuario = ?
      `, [id]);
      const currentAddress = currentAddressResult[0]; 

      if (currentAddress) {
          id_direccion_a_usar = currentAddress.id_direccion; 
      }

      // 2. Lógica para manejar la actualización de la dirección:
      // Comprobar si el texto de la dirección proporcionado en el cuerpo de la solicitud es diferente al actual del estudiante
      const isAddressTextChanged = direccion !== undefined && direccion.trim() !== (currentAddress?.direccion || '').trim();

      if (isAddressTextChanged) {
          // Si el estudiante ya tiene una dirección asociada (lo cual debería ser el caso para una actualización)
          if (currentAddress && currentAddress.id_direccion) {
              // ACTUALIZAR el texto de la dirección en el registro existente de la tabla 'direccion'
              // NO se modifican id_ciudad o id_estado, solo el texto de la dirección.
              await db.promise().query(
                  'UPDATE direccion SET direccion = ? WHERE id_direccion = ?',
                  [direccion.trim(), currentAddress.id_direccion]
              );
          } else {
              console.error(`❌ Error: El estudiante ID ${id} no tiene una dirección asociada para actualizar, y la UI de edición no proporciona datos completos para insertar una nueva dirección.`);
              return res.status(400).json({ error: "No se pudo actualizar la dirección: El estudiante no tiene una dirección asociada o faltan datos (ciudad/estado) para crear una nueva." });
          }
      }

      // Actualizar datos en la tabla 'usuarios'
      const updateUserQuery = `
        UPDATE usuarios
        SET
          cedula = ?,
          correo = ?,
          primer_nombre = ?,
          segundo_nombre = ?,
          primer_apellido = ?,
          segundo_apellido = ?,
          telefono = ?,
          id_direccion = ?
        WHERE id_usuario = ?;
      `;
      const [userUpdateResult] = await db.promise().query(updateUserQuery, [
        cedula, correo, primerNombre, segundoNombre, primerApellido, segundoApellido,
        telefono, id_direccion_a_usar, id
      ]);

      if (periodoAcademico !== undefined) { 
        await syncSingleRelationship(id, periodoAcademico, 'usuario_periodo', 'id_periodo', 'id_usuario');
      }

      if (cursos !== undefined) { 
        await syncRelationships(id, cursos, 'usuario_cursos', 'id_curso', 'id_usuario', ['fecha_inscripcion']);
      }

      if (materias !== undefined) { 
        await syncRelationships(id, materias, 'usuario_materias', 'id_materia', 'id_usuario');
      }

      if (secciones !== undefined) { 
        await syncSingleRelationship(id, secciones, 'usuario_seccion', 'id_seccion', 'id_usuario');
      }

      res.json({ message: 'Estudiante actualizado exitosamente.' });

    } catch (error) {
      console.error("❌ Error al actualizar estudiante:", error);
      res.status(500).json({ error: "Error al actualizar estudiante", detalle: error.message });
    }
}); 

export default router;