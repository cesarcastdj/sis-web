import express from 'express';
import db from '../db/db.js'; // Ajusta esta ruta si es necesario
import { isAuthenticated } from '../middleware/protegerRutas.js'; // Ajusta esta ruta si es necesario (comentado para pruebas)

const router = express.Router();

// Middleware de autenticación

// Aplicar middleware de autenticación a todas las rutas
// ==========================================================
// 🚀 RUTAS PARA GESTIÓN DE NOTAS 🚀
// ==========================================================

/**
 * @route GET /api/notas/usuario/:id_usuario
 * @description Obtiene todas las notas de un estudiante específico, incluyendo detalles de materia, actividad, curso, periodo y sección.
 * @param {number} req.params.id_usuario - ID del estudiante.
 * @param {number} [req.query.page=1] - Número de página para la paginación.
 * @param {number} [req.query.limit=10] - Límite de resultados por página.
 * @returns {json} Lista de notas paginadas.
 */
router.get('/notas/usuario/:id_usuario', /*isAuthenticated,*/ async (req, res) => {
    const { id_usuario } = req.params;
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');
    const offset = (page - 1) * limit;

    try {
        // Consulta para el conteo total de notas del usuario
        const [totalNotasResult] = await db.promise().query(
            'SELECT COUNT(*) AS total FROM notas WHERE id_estudiante = ?', // id_estudiante en tabla notas
            [id_usuario]
        );
        const totalCount = totalNotasResult[0].total;
        const totalPages = Math.ceil(totalCount / limit);

        // Consulta principal para obtener las notas con sus detalles
        const notasQuery = `
            SELECT
                n.id_nota,
                n.nota,
                n.fecha_registro,
                u.primer_nombre AS nombre_estudiante,
                u.primer_apellido AS apellido_estudiante,
                m.materia AS nombre_materia,
                c.curso AS nombre_curso,
                IFNULL(GROUP_CONCAT(DISTINCT p.periodo ORDER BY p.periodo ASC), 'N/A') AS nombre_periodo,
                a.nombre_actividad,
                a.descripcion AS descripcion_actividad
            FROM notas n
            JOIN usuarios u ON n.id_estudiante = u.id_usuario             -- id_estudiante en tabla notas
            JOIN actividades a ON n.id_actividad = a.id_actividad         -- Unir notas con actividades
            JOIN materias m ON m.id_materia = m.id_materia                -- Unir actividades con materias
            LEFT JOIN cursos_materias cm ON m.id_materia = cm.id_materia  -- Unir materias con cursos_materias
            LEFT JOIN cursos c ON cm.id_curso = c.id_curso                -- Obtener curso desde cursos_materias
            LEFT JOIN periodo p ON cm.id_periodo = p.id_periodo           -- Obtener periodo desde cursos_materias           -- Obtener seccion desde cursos_materias
            WHERE n.id_estudiante = ?                                     -- id_estudiante en tabla notas
            GROUP BY n.id_nota, n.nota, n.fecha_registro, u.primer_nombre, u.primer_apellido, m.materia, c.curso, a.nombre_actividad, a.descripcion
            ORDER BY n.fecha_registro DESC
            LIMIT ?, ?;
        `;
        const [notas] = await db.promise().query(notasQuery, [id_usuario, offset, limit]);

        res.json({
            notas,
            totalCount,
            totalPages,
            currentPage: page
        });

    } catch (error) {
        console.error("❌ Error al obtener notas del usuario:", error);
        res.status(500).json({ error: "Error al obtener notas del usuario", detalle: error.message });
    }
});

/**
 * @route GET /api/notas/materia/:id_materia/usuario/:id_usuario
 * @description Obtiene las notas de un estudiante para una materia específica, incluyendo detalles de curso, periodo y sección.
 * @param {number} req.params.id_materia - ID de la materia.
 * @param {number} req.params.id_usuario - ID del estudiante.
 * @returns {json} Lista de notas.
 */
router.get('/notas/materia/:id_materia/usuario/:id_usuario', /*isAuthenticated,*/ async (req, res) => {
    const { id_materia, id_usuario } = req.params;

    try {
        const notasQuery = `
            SELECT
                n.id_nota,
                n.nota,
                n.fecha_registro,
            
                u.primer_nombre AS nombre_estudiante,
                u.primer_apellido AS apellido_estudiante,
                m.materia AS nombre_materia,
                c.curso AS nombre_curso,
                IFNULL(GROUP_CONCAT(DISTINCT p.periodo ORDER BY p.periodo ASC), 'N/A') AS nombre_periodo,
                a.nombre_actividad,
                a.descripcion AS descripcion_actividad
            FROM notas n
            JOIN usuarios u ON n.id_estudiante = u.id_usuario             -- id_estudiante en tabla notas
            JOIN actividades a ON n.id_actividad = a.id_actividad         -- Unir notas con actividades
            JOIN materias m ON m.id_materia = m.id_materia                -- Unir actividades con materias
            LEFT JOIN cursos_materias cm ON m.id_materia = cm.id_materia  -- Unir materias con cursos_materias
            LEFT JOIN cursos c ON cm.id_curso = c.id_curso                -- Obtener curso desde cursos_materias
            LEFT JOIN periodo p ON cm.id_periodo = p.id_periodo           -- Obtener periodo desde cursos_materias
            WHERE m.id_materia = ? AND n.id_estudiante = ?                -- Filtrar por id_materia de actividad y id_estudiante de nota
            GROUP BY n.id_nota, n.nota, n.fecha_registro, u.primer_nombre, u.primer_apellido, m.materia, c.curso, a.nombre_actividad, a.descripcion
            ORDER BY n.fecha_registro DESC;
        `;
        const [notas] = await db.promise().query(notasQuery, [id_materia, id_usuario]);

        res.json({ notas });

    } catch (error) {
        console.error("❌ Error al obtener notas de la materia para el usuario:", error);
        res.status(500).json({ error: "Error al obtener notas", detalle: error.message });
    }
});

/**
 * @route GET /api/notas/:id_nota
 * @description Obtiene los detalles de una nota específica por su ID, incluyendo detalles de curso, periodo y sección.
 * @param {number} req.params.id_nota - ID de la nota.
 * @returns {json} Detalles de la nota.
 */
router.get('/notas', /*isAuthenticated,*/ async (req, res) => {
    const { id_nota } = req.params;

    try {
        const notaQuery = `
            SELECT
                n.id_nota,
                n.nota,
                n.fecha_registro,
                u.id_usuario,
                u.primer_nombre AS nombre_estudiante,
                u.primer_apellido AS apellido_estudiante,
                m.id_materia,
                m.materia AS nombre_materia,
                c.id_curso,
                c.curso AS nombre_curso,
                IFNULL(GROUP_CONCAT(DISTINCT p.id_periodo ORDER BY p.id_periodo ASC), '') AS id_periodo,
                IFNULL(GROUP_CONCAT(DISTINCT p.periodo ORDER BY p.periodo ASC), 'N/A') AS nombre_periodo,
                a.id_actividad,
                a.nombre_actividad,
                a.descripcion AS descripcion_actividad
            FROM notas n
            JOIN usuarios u ON n.id_estudiante = u.id_usuario             -- id_estudiante en tabla notas
            JOIN actividades a ON n.id_actividad = a.id_actividad         -- Unir notas con actividades
            JOIN materias m ON m.id_materia = m.id_materia                -- Unir actividades con materias
            LEFT JOIN cursos_materias cm ON m.id_materia = cm.id_materia  -- Unir materias con cursos_materias
            LEFT JOIN cursos c ON cm.id_curso = c.id_curso                -- Obtener curso desde cursos_materias
            LEFT JOIN periodo p ON cm.id_periodo = p.id_periodo           -- Obtener periodo desde cursos_materias          -- Obtener seccion desde cursos_materias
            WHERE n.id_nota = ?
            GROUP BY n.id_nota, n.nota, n.fecha_registro, u.id_usuario, u.primer_nombre, u.primer_apellido, m.id_materia, m.materia, c.id_curso, c.curso, a.id_actividad, a.nombre_actividad, a.descripcion;
        `;
        const [notaRows] = await db.promise().query(notaQuery, [id_nota]);

        if (notaRows.length === 0) {
            return res.status(404).json({ error: 'Nota no encontrada.' });
        }

        res.json(notaRows[0]);

    } catch (error) {
        console.error("❌ Error al obtener nota por ID:", error);
        res.status(500).json({ error: "Error al obtener nota", detalle: error.message });
    }
});

/**
 * @route POST /api/notas
 * @description Registra una nueva nota.
 * @param {number} req.body.id_estudiante - ID del estudiante (en la tabla notas).
 * @param {number} req.body.id_actividad - ID de la actividad (en la tabla notas).
 * @param {number} req.body.nota - Valor de la nota.
 * @param {string} req.body.fecha_registro - Fecha de registro (YYYY-MM-DD).
 * @param {string} [req.body.comentarios] - Comentarios (opcional).
 * @returns {json} Mensaje de éxito e ID de la nueva nota.
 */
router.post('/notas', /*isAuthenticated,*/ async (req, res) => {
    // Ya no se recibe id_materia directamente para la tabla notas, ya que no existe esa columna.
    // La materia se infiere a través de id_actividad.
    const { id_estudiante, id_actividad, nota, fecha_registro, comentarios = null } = req.body; 

    try {
        if (!id_estudiante || !id_actividad || !nota || !fecha_registro) {
            return res.status(400).json({ error: 'ID de estudiante, actividad, nota y fecha de registro son obligatorios.' });
        }

        const formattedFechaRegistro = new Date(fecha_registro).toISOString().slice(0, 10);

        const insertNotaQuery = `
            INSERT INTO notas (id_estudiante, id_actividad, nota, fecha_registro, comentarios)
            VALUES (?, ?, ?, ?, ?);
        `;
        const [result] = await db.promise().query(
            insertNotaQuery,
            [id_estudiante, id_actividad, nota, formattedFechaRegistro, comentarios]
        );
        const nuevaNotaId = result.insertId;

        res.status(201).json({ message: 'Nota registrada exitosamente.', id: nuevaNotaId });

    } catch (error) {
        console.error("❌ Error al registrar nota:", error);
        res.status(500).json({ error: "Error al registrar nota", detalle: error.message });
    }
});

/**
 * @route PUT /api/notas/:id_nota
 * @description Actualiza una nota existente.
 * @param {number} req.params.id_nota - ID de la nota a actualizar.
 * @param {object} req.body - Objeto con los campos a actualizar (nota, comentarios, id_actividad, etc.).
 * @returns {json} Mensaje de éxito.
 */
router.put('/notas/:id_nota', /*isAuthenticated,*/ async (req, res) => {
    const { id_nota } = req.params;
    const { nota, id_actividad = undefined, comentarios = undefined, fecha_registro = undefined } = req.body; 

    try {
        let updateFields = {};
        if (nota !== undefined) updateFields.nota = nota;
        // Solo actualizar id_actividad si se proporciona y es diferente (opcional)
        if (id_actividad !== undefined) updateFields.id_actividad = id_actividad; 
        if (comentarios !== undefined) updateFields.comentarios = comentarios;
        if (fecha_registro !== undefined) updateFields.fecha_registro = new Date(fecha_registro).toISOString().slice(0, 10);

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ error: "No hay campos para actualizar." });
        }

        const updateQuery = 'UPDATE notas SET ? WHERE id_nota = ?';
        await db.promise().query(updateQuery, [updateFields, id_nota]);

        res.json({ message: 'Nota actualizada exitosamente.' });

    } catch (error) {
        console.error("❌ Error al actualizar nota:", error);
        res.status(500).json({ error: "Error al actualizar nota", detalle: error.message });
    }
});

/**
 * @route DELETE /api/notas/:id_nota
 * @description Elimina una nota por su ID.
 * @param {number} req.params.id_nota - ID de la nota a eliminar.
 * @returns {json} Mensaje de éxito.
 */
router.delete('/notas/:id_nota', /*isAuthenticated,*/ async (req, res) => {
    const { id_nota } = req.params;

    try {
        const deleteQuery = 'DELETE FROM notas WHERE id_nota = ?';
        const [result] = await db.promise().query(deleteQuery, [id_nota]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Nota no encontrada para eliminar.' });
        }

        res.json({ message: 'Nota eliminada exitosamente.' });

    } catch (error) {
        console.error("❌ Error al eliminar nota:", error);
        res.status(500).json({ error: "Error al eliminar nota", detalle: error.message });
    }
});


// ==========================================================
// 🚀 RUTAS PARA GESTIÓN DE ACTIVIDADES 🚀
// ==========================================================

/**
 * @route GET /api/actividades/materia/:id_materia
 * @description Obtiene todas las actividades de una materia específica.
 * @param {number} req.params.id_materia - ID de la materia.
 * @returns {json} Lista de actividades.
 */
router.get('/actividades/materia/:id_materia', /*isAuthenticated,*/ async (req, res) => {
    const { id_materia } = req.params;

    try {
        const actividadesQuery = `
            SELECT
                id_actividad,
                nombre_actividad,
                descripcion,
                fecha_creacion,
                id_materia
            FROM actividades
            WHERE id_materia = ?
            ORDER BY fecha_creacion DESC;
        `;
        const [actividades] = await db.promise().query(actividadesQuery, [id_materia]);

        res.json({ actividades });

    } catch (error) {
        console.error("❌ Error al obtener actividades de la materia:", error);
        res.status(500).json({ error: "Error al obtener actividades", detalle: error.message });
    }
});

/**
 * @route GET /api/actividades/:id_actividad
 * @description Obtiene los detalles de una actividad específica.
 * @param {number} req.params.id_actividad - ID de la actividad.
 * @returns {json} Detalles de la actividad.
 */
router.get('/actividades/:id_actividad', /*isAuthenticated,*/ async (req, res) => {
    const { id_actividad } = req.params;

    try {
        const actividadQuery = `
            SELECT
                id_actividad,
                nombre_actividad,
                descripcion,
                fecha_creacion,
                id_materia
            FROM actividades
            WHERE id_actividad = ?;
        `;
        const [actividadRows] = await db.promise().query(actividadQuery, [id_actividad]);

        if (actividadRows.length === 0) {
            return res.status(404).json({ error: 'Actividad no encontrada.' });
        }

        res.json(actividadRows[0]);

    } catch (error) {
        console.error("❌ Error al obtener actividad por ID:", error);
        res.status(500).json({ error: "Error al obtener actividad", detalle: error.message });
    }
});

/**
 * @route POST /api/actividades
 * @description Crea una nueva actividad.
 * @param {string} req.body.nombre_actividad - Nombre de la actividad.
 * @param {string} [req.body.descripcion] - Descripción de la actividad (opcional).
 * @param {string} req.body.fecha_creacion - Fecha de creación (YYYY-MM-DD).
 * @param {number} req.body.id_materia - ID de la materia a la que pertenece la actividad.
 * @returns {json} Mensaje de éxito e ID de la nueva actividad.
 */
router.post('/actividades', /*isAuthenticated,*/ async (req, res) => {
    const { nombre_actividad, descripcion = null, fecha_creacion, id_materia } = req.body;

    try {
        if (!nombre_actividad || !fecha_creacion || !id_materia) {
            return res.status(400).json({ error: 'Nombre de actividad, fecha de creación y ID de materia son obligatorios.' });
        }

        const formattedFechaCreacion = new Date(fecha_creacion).toISOString().slice(0, 10);

        const insertActividadQuery = `
            INSERT INTO actividades (nombre_actividad, descripcion, fecha_creacion, id_materia, ponderacion)
            VALUES (?, ?, ?, ?, ?);
        `;
        const [result] = await db.promise().query(
            insertActividadQuery,
            [nombre_actividad, descripcion, formattedFechaCreacion, id_materia, 1.0]
        );
        const nuevaActividadId = result.insertId;

        res.status(201).json({ message: 'Actividad creada exitosamente.', id: nuevaActividadId });

    } catch (error) {
        console.error("❌ Error al crear actividad:", error);
        res.status(500).json({ error: "Error al crear actividad", detalle: error.message });
    }
});

/**
 * @route PUT /api/actividades/:id_actividad
 * @description Actualiza una actividad existente.
 * @param {number} req.params.id_actividad - ID de la actividad a actualizar.
 * @param {object} req.body - Objeto con los campos a actualizar (nombre_actividad, descripcion, fecha_creacion, id_materia).
 * @returns {json} Mensaje de éxito.
 */
router.put('/actividades/:id_actividad', /*isAuthenticated,*/ async (req, res) => {
    const { id_actividad } = req.params;
    const { nombre_actividad, descripcion = null, fecha_creacion, id_materia } = req.body;

    try {
        let updateFields = {};
        if (nombre_actividad !== undefined) updateFields.nombre_actividad = nombre_actividad;
        if (descripcion !== undefined) updateFields.descripcion = descripcion;
        if (fecha_creacion !== undefined) updateFields.fecha_creacion = new Date(fecha_creacion).toISOString().slice(0, 10);
        if (id_materia !== undefined) updateFields.id_materia = id_materia;

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ error: "No hay campos para actualizar." });
        }

        const updateQuery = 'UPDATE actividades SET ? WHERE id_actividad = ?';
        await db.promise().query(updateQuery, [updateFields, id_actividad]);

        res.json({ message: 'Actividad actualizada exitosamente.' });

    } catch (error) {
        console.error("❌ Error al actualizar actividad:", error);
        res.status(500).json({ error: "Error al actualizar actividad", detalle: error.message });
    }
});

/**
 * @route DELETE /api/actividades/:id_actividad
 * @description Elimina una actividad por su ID.
 * @param {number} req.params.id_actividad - ID de la actividad a eliminar.
 * @returns {json} Mensaje de éxito.
 */
router.delete('/actividades/:id_actividad', /*isAuthenticated,*/ async (req, res) => {
    const { id_actividad } = req.params;

    try {

        await db.promise().query('UPDATE notas SET id_actividad = NULL WHERE id_actividad = ?', [id_actividad]);

        const deleteQuery = 'DELETE FROM actividades WHERE id_actividad = ?';
        const [result] = await db.promise().query(deleteQuery, [id_actividad]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Actividad no encontrada para eliminar.' });
        }

        res.json({ message: 'Actividad y sus asociaciones en notas eliminadas/desvinculadas exitosamente.' });

    } catch (error) {
        console.error("❌ Error al eliminar actividad:", error);
        res.status(500).json({ error: "Error al eliminar actividad", detalle: error.message });
    }
});

/**
 * @route GET /api/estudiante/notas
 * @description Obtiene todas las notas del estudiante actual con estadísticas
 */
router.get('/estudiante/notas', async (req, res) => {
    try {
        console.log('Sesión actual:', req.session);
        console.log('Usuario en sesión:', req.session.usuario);
        
        // Obtener el ID del usuario de la sesión (ahora usando 'id' en lugar de 'id_usuario')
        const id_usuario = req.session.usuario.id;

        console.log('ID de usuario extraído:', id_usuario);

        if (!id_usuario) {
            return res.status(400).json({
                error: "Usuario no identificado",
                mensaje: "No se pudo identificar al usuario"
            });
        }

        // Verificamos si el usuario existe y es un estudiante
        const verificarEstudianteQuery = `
            SELECT 
                e.id_estudiante,
                u.primer_nombre,
                u.primer_apellido,
                u.rol
            FROM usuarios u
            LEFT JOIN estudiantes e ON u.id_usuario = e.id_usuario
            WHERE u.id_usuario = ? AND u.rol = 'estudiante';
        `;

        const [estudiante] = await db.promise().query(verificarEstudianteQuery, [id_usuario]);

        if (estudiante.length === 0) {
            return res.status(404).json({
                error: "Estudiante no encontrado",
                mensaje: "El usuario no es un estudiante o no existe",
                estadisticas: {
                    promedio_general: "0.00",
                    materias_aprobadas: "0",
                    materias_pendientes: "0"
                },
                notas: {}
            });
        }

        const id_estudiante = estudiante[0].id_estudiante;

        // 2. Obtenemos las materias matriculadas del estudiante
        const materiasQuery = `
            SELECT DISTINCT
                m.id_materia,
                m.materia AS nombre_materia,
                p.periodo AS nombre_periodo
            FROM estudiantes e
            JOIN cursos_materias cm ON e.id_estudiante = cm.id_estudiante
            JOIN materias m ON cm.id_materia = m.id_materia
            JOIN periodo p ON cm.id_periodo = p.id_periodo
            WHERE e.id_estudiante = ?
            ORDER BY p.periodo DESC, m.materia ASC;
        `;

        const [materias] = await db.promise().query(materiasQuery, [id_estudiante]);

        if (materias.length === 0) {
            return res.json({
                mensaje: "El estudiante no está matriculado en ninguna materia",
                estadisticas: {
                    promedio_general: "0.00",
                    materias_aprobadas: "0",
                    materias_pendientes: "0"
                },
                notas: {}
            });
        }

        // 3. Obtenemos las notas (si existen)
        const notasQuery = `
            SELECT 
                n.id_nota,
                n.nota,
                DATE_FORMAT(n.fecha_registro, '%d/%m/%Y') as fecha_registro,
                m.materia AS nombre_materia,
                a.nombre_actividad,
                p.periodo AS nombre_periodo
            FROM materias m
            JOIN cursos_materias cm ON m.id_materia = cm.id_materia
            JOIN periodo p ON cm.id_periodo = p.id_periodo
            LEFT JOIN notas n ON (cm.id_estudiante = n.id_estudiante AND cm.id_materia = m.id_materia)
            LEFT JOIN actividades a ON n.id_actividad = a.id_actividad
            WHERE cm.id_estudiante = ?
            ORDER BY p.periodo DESC, m.materia ASC, n.fecha_registro DESC;
        `;

        const [notas] = await db.promise().query(notasQuery, [id_estudiante]);

        // 4. Organizamos las notas por periodo y materia
        const notasPorPeriodo = {};
        materias.forEach(materia => {
            if (!notasPorPeriodo[materia.nombre_periodo]) {
                notasPorPeriodo[materia.nombre_periodo] = {};
            }
            notasPorPeriodo[materia.nombre_periodo][materia.nombre_materia] = [];
        });

        // Agregamos las notas existentes
        notas.forEach(nota => {
            if (!notasPorPeriodo[nota.nombre_periodo]) {
                notasPorPeriodo[nota.nombre_periodo] = {};
            }
            if (!notasPorPeriodo[nota.nombre_periodo][nota.nombre_materia]) {
                notasPorPeriodo[nota.nombre_periodo][nota.nombre_materia] = [];
            }
            if (nota.id_nota) {
                notasPorPeriodo[nota.nombre_periodo][nota.nombre_materia].push({
                    id_nota: nota.id_nota,
                    nota: nota.nota,
                    fecha_registro: nota.fecha_registro,
                    nombre_actividad: nota.nombre_actividad || 'Sin actividad'
                });
            }
        });

        // 5. Calculamos estadísticas
        const statsQuery = `
            SELECT 
                COALESCE(ROUND(AVG(NULLIF(n.nota, 0)), 2), 0.00) as promedio_general,
                COUNT(DISTINCT CASE WHEN n.nota >= 10 THEN m.id_materia END) as materias_aprobadas,
                COUNT(DISTINCT CASE WHEN n.nota < 10 OR n.nota IS NULL THEN m.id_materia END) as materias_pendientes
            FROM estudiantes e
            JOIN cursos_materias cm ON e.id_estudiante = cm.id_estudiante
            JOIN materias m ON cm.id_materia = m.id_materia
            LEFT JOIN notas n ON (cm.id_estudiante = n.id_estudiante AND cm.id_materia = m.id_materia)
            WHERE e.id_estudiante = ?;
        `;

        const [stats] = await db.promise().query(statsQuery, [id_estudiante]);

        res.json({
            estadisticas: {
                promedio_general: stats[0].promedio_general.toString(),
                materias_aprobadas: stats[0].materias_aprobadas.toString(),
                materias_pendientes: stats[0].materias_pendientes.toString()
            },
            notas: notasPorPeriodo
        });

    } catch (error) {
        console.error("❌ Error al obtener notas del estudiante:", error);
        console.error("Detalles de la sesión en error:", req.session);
        res.status(500).json({ 
            error: "Error al obtener notas del estudiante", 
            detalle: error.message 
        });
    }
});

// Endpoint para obtener materias filtradas por curso y periodo (PROFESIONAL)
// router.get('/materias', isAuthenticated, async (req, res) => {
router.get('/materias', async (req, res) => {
  console.log('GET /materias (notas) llamado', req.query);
  const { curso, periodo } = req.query;
  if (!curso || !periodo) {
    return res.status(400).json({ error: 'Debes especificar curso y periodo.' });
  }
  try {
    const query = `
      SELECT m.id_materia, m.materia AS nombre_materia
      FROM materias m
      JOIN cursos_periodo cp ON cp.id_curso = m.id_curso
      WHERE cp.id_curso = ? AND cp.id_periodo = ? AND m.activo = 1
    `;
    const [materias] = await db.promise().query(query, [curso, periodo]);
    // Para robustez, igual que actividades, responde como array plano
    res.json(materias);
  } catch (error) {
    console.error('Error al obtener materias filtradas:', error);
    res.status(500).json({ error: 'Error al obtener materias filtradas', detalle: error.message });
  }
});

// Obtener estudiantes de una materia
router.get('/materias/:id_materia/estudiantes', async (req, res) => {
  const { id_materia } = req.params;
  try {
    const query = `
      SELECT u.id_usuario, u.primer_nombre, u.primer_apellido, u.cedula
      FROM usuario_materias um
      JOIN usuarios u ON um.id_usuario = u.id_usuario
      WHERE um.id_materia = ? AND u.rol = 'estudiante' AND u.estado = 1
    `;
    const [estudiantes] = await db.promise().query(query, [id_materia]);
    res.json(estudiantes);
  } catch (error) {
    console.error('Error al obtener estudiantes de la materia:', error);
    res.status(500).json({ error: 'Error al obtener estudiantes de la materia', detalle: error.message });
  }
});

// Obtener notas de los estudiantes para una actividad
router.get('/notas/actividad/:id_actividad', async (req, res) => {
  const { id_actividad } = req.params;
  try {
    const [notas] = await db.promise().query(
      `SELECT n.id_estudiante, n.nota
       FROM notas n
       WHERE n.id_actividad = ?`, [id_actividad]
    );
    res.json({ notas });
  } catch (error) {
    console.error('Error al obtener notas de la actividad:', error);
    res.status(500).json({ error: 'Error al obtener notas de la actividad', detalle: error.message });
  }
});

// Guardar o actualizar notas y comentarios de varios estudiantes para una actividad
router.post('/notas/actividad/:id_actividad', (req, res) => {
  try {
    console.log('********* LLEGÓ PETICIÓN A /notas/actividad/:id_actividad *********');
    console.log('BODY RECIBIDO:', JSON.stringify(req.body));
    const { id_actividad } = req.params;
    let { notas } = req.body;
    if (!Array.isArray(notas) || notas.length === 0) {
      console.log('❌ Array de notas vacío o no enviado');
      return res.status(400).json({ error: 'Debes enviar un array de notas.' });
    }
    notas = notas.filter(n => n.id_estudiante && n.nota !== null && n.nota !== undefined && n.nota !== '' && !isNaN(Number(n.nota)));
    if (notas.length === 0) {
      console.log('❌ No hay notas válidas para guardar');
      return res.status(400).json({ error: 'No hay notas válidas para guardar.' });
    }
    db.getConnection((err, conn) => {
      if (err) {
        console.error('Error obteniendo conexión:', err);
        return res.status(500).json({ error: 'Error de conexión a la base de datos', detalle: err.message });
      }
      conn.beginTransaction(err => {
        if (err) {
          conn.release();
          console.error('Error iniciando transacción:', err);
          return res.status(500).json({ error: 'Error iniciando transacción', detalle: err.message });
        }
        let errores = [];
        let procesados = 0;
        notas.forEach(n => {
          const fecha_registro = n.fecha_registro || new Date().toISOString().slice(0, 10);
          conn.query('SELECT id_nota FROM notas WHERE id_actividad = ? AND id_estudiante = ?', [id_actividad, n.id_estudiante], (err, existe) => {
            if (err) { console.error('Error en SELECT:', err); errores.push(err); procesados++; if (procesados === notas.length) finalizar(); return; }
            if (existe.length > 0) {
              conn.query('UPDATE notas SET nota = ?, fecha_registro = ? WHERE id_nota = ?', [n.nota, fecha_registro, existe[0].id_nota], (err) => {
                if (err) { console.error('Error en UPDATE:', err); errores.push(err); }
                guardarComentario();
              });
            } else {
              conn.query('INSERT INTO notas (id_actividad, id_estudiante, nota, fecha_registro) VALUES (?, ?, ?, ?)', [id_actividad, n.id_estudiante, n.nota, fecha_registro], (err) => {
                if (err) { console.error('Error en INSERT:', err); errores.push(err); }
                guardarComentario();
              });
            }
            function guardarComentario() {
              if (n.comentarios && n.comentarios.trim() !== '') {
                conn.query('INSERT INTO comentarios (id_estudiante, id_actividad, mensaje, fecha_hora) VALUES (?, ?, ?, NOW())', [n.id_estudiante, id_actividad, n.comentarios], (err) => {
                  if (err) { console.error('Error en INSERT comentario:', err); errores.push(err); }
                  procesados++;
                  if (procesados === notas.length) finalizar();
                });
              } else {
                procesados++;
                if (procesados === notas.length) finalizar();
              }
            }
          });
        });
        function finalizar() {
          if (errores.length > 0) {
            console.error('Errores al guardar notas:', errores);
            return conn.rollback(() => {
              conn.release();
              res.status(500).json({ error: 'Error al registrar/actualizar notas y comentarios', detalle: errores.map(e => e.message) });
            });
          }
          conn.commit(err => {
            conn.release();
            if (err) {
              console.error('Error al confirmar transacción:', err);
              return res.status(500).json({ error: 'Error al confirmar transacción', detalle: err.message });
            }
            console.log('✅ Notas y comentarios registrados/actualizados correctamente.');
            res.json({ message: 'Notas y comentarios registrados/actualizados correctamente.' });
          });
        }
      });
    });
  } catch (error) {
    console.error('❌ ERROR NO CAPTURADO EN /notas/actividad/:id_actividad:', error);
    res.status(500).json({ error: 'Error inesperado en el endpoint', detalle: error.message });
  }
});

// Obtener comentarios de un estudiante para una actividad
router.get('/comentarios/actividad/:id_actividad/estudiante/:id_estudiante', async (req, res) => {
  const { id_actividad, id_estudiante } = req.params;
  try {
    const [comentarios] = await db.promise().query(
      `SELECT id_comentario, mensaje, fecha_hora FROM comentarios WHERE id_actividad = ? AND id_estudiante = ? ORDER BY fecha_hora DESC`,
      [id_actividad, id_estudiante]
    );
    res.json({ comentarios });
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({ error: 'Error al obtener comentarios', detalle: error.message });
  }
});

// Obtener actividades de una materia (paginado)
router.get('/materias/:id/actividades', async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page || '1');
  const limit = parseInt(req.query.limit || '10');
  const offset = (page - 1) * limit;
  try {
    const [actividades, actividadesCount] = await Promise.all([
      db.promise().query(
        `SELECT id_actividad, nombre_actividad, descripcion, fecha_creacion AS fecha_entrega, ponderacion
         FROM actividades WHERE id_materia = ? ORDER BY fecha_creacion DESC LIMIT ?, ?`,
        [id, offset, limit]
      ),
      db.promise().query(
        `SELECT COUNT(*) AS total FROM actividades WHERE id_materia = ?`, [id]
      )
    ]);
    res.json({
      actividades: actividades[0],
      totalPages: Math.ceil(actividadesCount[0][0].total / limit)
    });
  } catch (error) {
    console.error('Error al obtener actividades de la materia:', error);
    res.status(500).json({ error: 'Error al obtener actividades de la materia', detalle: error.message });
  }
});

// Resumen de actividades de una materia
router.get('/materias/:id/actividades/resumen', async (req, res) => {
  const { id } = req.params;
  try {
    // Total de actividades
    const [[{ totalActividades }]] = await db.promise().query(
      'SELECT COUNT(*) AS totalActividades FROM actividades WHERE id_materia = ?', [id]
    );
    // Promedio general de la materia (de todas las notas de todas las actividades de la materia)
    const [[{ promedioGeneralMateria }]] = await db.promise().query(
      `SELECT AVG(nota) AS promedioGeneralMateria FROM notas n
       JOIN actividades a ON n.id_actividad = a.id_actividad
       WHERE a.id_materia = ?`, [id]
    );
    // Total de estudiantes en la materia
    const [[{ total_estudiantes_materia }]] = await db.promise().query(
      `SELECT COUNT(DISTINCT um.id_usuario) AS total_estudiantes_materia
       FROM usuario_materias um
       WHERE um.id_materia = ?`, [id]
    );
    res.json({
      totalActividades,
      promedioGeneralMateria: promedioGeneralMateria || 0,
      total_estudiantes_materia
    });
  } catch (error) {
    console.error('Error al obtener resumen de actividades:', error);
    res.status(500).json({ error: 'Error al obtener resumen de actividades', detalle: error.message });
  }
});

export default router;
