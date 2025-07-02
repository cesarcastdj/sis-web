import express from 'express';
import db from '../db/db.js';
import { isAuthenticated } from '../middleware/protegerRutas.js';
import { hashPassword, comparePassword } from '../f(x)/contrasenias.js';
import { syncRelationships, syncSingleRelationship } from '../f(x)/relaciones.js';
import { registrarAccion } from '../middleware/historial.js';

const router = express.Router();

// ==========================================================
// RUTAS PARA SECCIONES (Nueva funcionalidad completa)
// ==========================================================

// Obtener todas las secciones con paginación y estadísticas
router.get('/secciones-academicas', /*isAuthenticated,*/ async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
        // Obtener el conteo total de secciones
        const [totalSeccionesResult] = await db.promise().query('SELECT COUNT(*) AS total FROM seccion;');
        const totalCount = totalSeccionesResult[0].total;

        const [seccionesActivasCount] = await db.promise().query('SELECT COUNT(*) AS total FROM seccion WHERE estado = 1;');
        const activeCount = seccionesActivasCount[0].total;

        const totalPages = Math.ceil(totalCount / limit);


        // Obtener total de estudiantes en secciones (a través de cursos)
        const [estudiantesEnSeccionesResult] = await db.promise().query(`
            SELECT COUNT(DISTINCT uc.id_usuario) AS total_estudiantes
            FROM usuario_cursos uc
            JOIN usuarios u ON uc.id_usuario = u.id_usuario
            JOIN cursos_seccion cs ON uc.id_curso = cs.id_curso
            JOIN cursos c ON cs.id_curso = c.id_curso
            WHERE u.rol = 'estudiante' AND cs.id_seccion IS NOT NULL;
        `);
        const studentsCount = estudiantesEnSeccionesResult[0].total_estudiantes || 0;

        // Consulta principal para obtener las secciones con información adicional
        const seccionesQuery = `
            SELECT
                s.id_seccion,
                s.seccion,
                s.estado,
                COUNT(DISTINCT uc.id_usuario) AS total_estudiantes,
                COUNT(DISTINCT c.id_curso) AS total_cursos,
                GROUP_CONCAT(DISTINCT c.curso ORDER BY c.curso SEPARATOR ', ') AS cursos_asociados
            FROM seccion s
            LEFT JOIN cursos_seccion cs ON s.id_seccion = cs.id_seccion
            LEFT JOIN cursos c ON cs.id_curso = c.id_curso
            LEFT JOIN usuario_cursos uc ON c.id_curso = uc.id_curso
            LEFT JOIN usuarios u ON uc.id_usuario = u.id_usuario AND u.rol = 'estudiante'
            WHERE s.estado = 1
            GROUP BY s.id_seccion
            ORDER BY s.seccion 
            LIMIT ?, ?;
        `;
        const [secciones] = await db.promise().query(seccionesQuery, [offset, parseInt(limit)]);

        res.json({
            secciones: secciones,
            totalCount,
            activeCount,
            studentsCount,
            totalPages,
            currentPage: parseInt(page),
        });

    } catch (error) {
        console.error("❌ Error al obtener secciones:", error);
        res.status(500).json({ error: "Error al obtener secciones", detalle: error.message });
    }
});


router.get('/secciones-academicas/papelera', /*isAuthenticated,*/ async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
        // Obtener el conteo total de secciones
        const [totalSeccionesResult] = await db.promise().query('SELECT COUNT(*) AS total FROM seccion;');
        const totalCount = totalSeccionesResult[0].total;

        const [seccionesActivasCount] = await db.promise().query('SELECT COUNT(*) AS total FROM seccion WHERE estado = 1;');
        const activeCount = seccionesActivasCount[0].total;

        const totalPages = Math.ceil(totalCount / limit);


        // Obtener total de estudiantes en secciones (a través de cursos)
        const [estudiantesEnSeccionesResult] = await db.promise().query(`
            SELECT COUNT(DISTINCT uc.id_usuario) AS total_estudiantes
            FROM usuario_cursos uc
            JOIN usuarios u ON uc.id_usuario = u.id_usuario
            JOIN cursos_seccion cs ON uc.id_curso = cs.id_curso
            JOIN cursos c ON cs.id_curso = c.id_curso
            WHERE u.rol = 'estudiante' AND cs.id_seccion IS NOT NULL;
        `);
        const studentsCount = estudiantesEnSeccionesResult[0].total_estudiantes || 0;

        // Consulta principal para obtener las secciones con información adicional
        const seccionesQuery = `
            SELECT
                s.id_seccion,
                s.seccion,
                s.estado,
                COUNT(DISTINCT uc.id_usuario) AS total_estudiantes,
                COUNT(DISTINCT c.id_curso) AS total_cursos,
                GROUP_CONCAT(DISTINCT c.curso ORDER BY c.curso SEPARATOR ', ') AS cursos_asociados
            FROM seccion s
            LEFT JOIN cursos_seccion cs ON s.id_seccion = cs.id_seccion
            LEFT JOIN cursos c ON cs.id_curso = c.id_curso
            LEFT JOIN usuario_cursos uc ON c.id_curso = uc.id_curso
            LEFT JOIN usuarios u ON uc.id_usuario = u.id_usuario AND u.rol = 'estudiante'
            WHERE s.estado = 0
            GROUP BY s.id_seccion
            ORDER BY s.seccion 
            LIMIT ?, ?;
        `;
        const [secciones] = await db.promise().query(seccionesQuery, [offset, parseInt(limit)]);

        res.json({
            secciones: secciones,
            totalCount,
            activeCount,
            studentsCount,
            totalPages,
            currentPage: parseInt(page),
        });

    } catch (error) {
        console.error("❌ Error al obtener secciones:", error);
        res.status(500).json({ error: "Error al obtener secciones", detalle: error.message });
    }
});

// Obtener detalles específicos de una sección
router.get('/secciones-academicas/:id/detalles', /*isAuthenticated,*/ async (req, res) => {
    const { id } = req.params;
    
    try {
        // Obtener cursos asociados a la sección
        const [cursosResult] = await db.promise().query(`
            SELECT 
                c.id_curso,
                c.curso AS nombre_curso,
                p.periodo AS nombre_periodo
            FROM cursos c
            LEFT JOIN cursos_periodo cp ON c.id_curso = cp.id_curso
            LEFT JOIN periodo p ON cp.id_periodo = p.id_periodo
            LEFT JOIN cursos_seccion cs ON c.id_curso = cs.id_curso
            WHERE cs.id_seccion = ?
        `, [id]);

        // Obtener estudiantes asignados a la sección (a través de cursos)
        const [estudiantesResult] = await db.promise().query(`
            SELECT DISTINCT
                u.id_usuario,
                CONCAT(u.primer_nombre, ' ', u.primer_apellido) AS nombre_completo,
                u.cedula,
                c.curso
            FROM usuarios u
            JOIN usuario_cursos uc ON u.id_usuario = uc.id_usuario
            JOIN cursos c ON uc.id_curso = c.id_curso
            WHERE u.rol = 'estudiante'
            ORDER BY u.primer_nombre, u.primer_apellido;
        `, [id]);

        res.json({
            cursos: cursosResult,
            estudiantes: estudiantesResult
        });

    } catch (error) {
        console.error("❌ Error al obtener detalles de la sección:", error);
        res.status(500).json({ error: "Error al obtener detalles de la sección", detalle: error.message });
    }
});

// Crear una nueva sección
router.post('/secciones-academicas', registrarAccion('Creación de sección', 'seccion'), /*isAuthenticated,*/ (req, res) => { // La función ahora no es 'async'
    const { nombreSeccion} = req.body;

    // Validación básica: el nombre de la sección es obligatorio
    if (!nombreSeccion) {
        return res.status(400).json({ error: 'El nombre de la sección es obligatorio.' });
    }

    // Iniciar la transacción
    db.beginTransaction((err) => {
        if (err) {
            console.error("❌ Error al iniciar transacción:", err);
            return res.status(500).json({ error: "Error al crear sección", detalle: err.message });
        }

        // Verificar si ya existe una sección con el mismo nombre.
        db.query(
            'SELECT id_seccion FROM seccion WHERE seccion = ?',
            [nombreSeccion],
            (err, existingSectionRows) => {
                if (err) {
                    // Si hay un error, revertir la transacción y responder
                    return db.rollback(() => {
                        console.error("❌ Error al verificar sección existente:", err);
                        res.status(500).json({ error: "Error al crear sección", detalle: err.message });
                    });
                }

                if (existingSectionRows.length > 0) {
                    // Si ya existe una sección, revertir la transacción y responder
                    return db.rollback(() => {
                        res.status(400).json({ error: 'Ya existe una sección con ese nombre.' });
                    });
                }

                // Insertar la nueva sección en la base de datos.
                db.query(
                    'INSERT INTO seccion (seccion, estado) VALUES (?, 1)', // Asumimos que el estado por defecto es activo (1)
                    [nombreSeccion],
                    (err, seccionResult) => {
                        if (err) {
                            // Si hay un error, revertir la transacción y responder
                            return db.rollback(() => {
                                console.error("❌ Error al insertar sección:", err);
                                res.status(500).json({ error: "Error al crear sección", detalle: err.message });
                            });
                        }

                        const id_seccion = seccionResult.insertId; // id_seccion será el ID generado para la nueva sección.
                        req.params.id = id_seccion;

                        // Lógica para asignar cursos y/o estudiantes (descomenta y adapta según sea necesario):
                        // Nota: Si estas operaciones también son asíncronas y con callbacks,
                        // tendrás que anidarlas aquí o usar un patrón como async.eachSeries de 'async' library.
                        /*
                        // Asignar cursos a la sección si se proporcionaron
                        if (cursosAsignados && cursosAsignados.length > 0) {
                            // Ejemplo simple, esto requeriría más anidamiento o un enfoque diferente
                            // para manejar múltiples inserciones de forma secuencial con callbacks.
                            // db.query('INSERT INTO seccion_curso (...)', (err) => { ... });
                        }

                        // Asignar estudiantes a la sección si se proporcionaron
                        if (estudiantesAsignados && estudiantesAsignados.length > 0) {
                            // Similar al de cursosAsignados
                            // db.query('INSERT INTO seccion_estudiante (...)', (err) => { ... });
                        }
                        */

                        // Si todo va bien, confirmar la transacción para guardar los cambios.
                        db.commit((err) => {
                            if (err) {
                                // Si hay un error al confirmar, intentar revertir
                                return db.rollback(() => {
                                    console.error("❌ Error al confirmar transacción:", err);
                                    res.status(500).json({ error: "Error al crear sección", detalle: err.message });
                                });
                            }
                            res.status(201).json({ message: 'Sección creada exitosamente.', id_seccion });
                        });
                    }
                );
            }
        );
    });
});


// Actualizar una sección existente
router.put('/secciones-academicas/:id', registrarAccion('Actualizacion datos seccion', 'seccion'), /*isAuthenticated,*/ async (req, res) => {
    const { id } = req.params;
    const { nombreSeccion, descripcion } = req.body;

    if (!nombreSeccion) {
        return res.status(400).json({ error: 'El nombre de la sección es obligatorio.' });
    }

    try {
        // Verificar si existe otra sección con el mismo nombre (excluyendo la actual)
        const [existingSection] = await db.promise().query(
            'SELECT id_seccion FROM seccion WHERE seccion = ? AND id_seccion != ?',
            [nombreSeccion, id]
        );

        if (existingSection.length > 0) {
            return res.status(400).json({ error: 'Ya existe otra sección con ese nombre.' });
        }

        // Actualizar la sección
        const updateQuery = `
            UPDATE seccion 
            SET seccion = ?, descripcion = ?
            WHERE id_seccion = ?;
        `;
        const [result] = await db.promise().query(updateQuery, [nombreSeccion, descripcion || '', id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Sección no encontrada.' });
        }

        res.json({ message: 'Sección actualizada exitosamente.' });

    } catch (error) {
        console.error("❌ Error al actualizar sección:", error);
        res.status(500).json({ error: "Error al actualizar sección", detalle: error.message });
    }
});

// Cambiar el estado de una sección (activo/inactivo)
router.put('/secciones-academicas/:id/estado', registrarAccion('Cambio de estado de sección', 'seccion'), /*isAuthenticated,*/ async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body; // 1 o 0

    if (estado === undefined || (estado !== 0 && estado !== 1)) {
        return res.status(400).json({ error: 'El estado es inválido. Debe ser 0 o 1.' });
    }

    try {
        const [result] = await db.promise().query(
            'UPDATE seccion SET estado = ? WHERE id_seccion = ?',
            [estado, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Sección no encontrada.' });
        }

        const estadoTexto = estado === 1 ? 'activada' : 'desactivada';
        res.json({ message: `Sección ${estadoTexto} exitosamente.` });
    } catch (error) {
        console.error("❌ Error al cambiar estado de sección:", error);
        res.status(500).json({ error: "Error al cambiar estado de sección", detalle: error.message });
    }
});

// Eliminar una sección (eliminación lógica)
router.delete('/secciones-academicas/:id', registrarAccion('Eliminación de sección', 'seccion'), /*isAuthenticated,*/ async (req, res) => {
    const { id } = req.params;
    let connection;
    
    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        // Verificar si la sección tiene cursos asociados
        const [cursosAsociados] = await connection.query(
            'SELECT COUNT(*) as total FROM cursos WHERE id_seccion = ?',
            [id]
        );

        if (cursosAsociados[0].total > 0) {
            await connection.rollback();
            return res.status(400).json({ 
                error: 'No se puede eliminar la sección porque tiene cursos asociados. Primero desasocie los cursos.' 
            });
        }

        // Eliminar la sección
        const [result] = await connection.query('DELETE FROM seccion WHERE id_seccion = ?', [id]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Sección no encontrada.' });
        }

        await connection.commit();
        res.json({ message: 'Sección eliminada exitosamente.' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("❌ Error al eliminar sección:", error);
        res.status(500).json({ error: "Error al eliminar sección", detalle: error.message });
    } finally {
        if (connection) connection.release();
    }
});



// Obtener cursos disponibles
router.get('/cursos', (req, res) => {
    console.log('GET /cursos llamado');
    const sql = `
      SELECT c.id_curso, c.curso AS nombre_curso, cp.id_periodo, p.periodo AS nombre_periodo
      FROM cursos c
      JOIN cursos_periodo cp ON c.id_curso = cp.id_curso
      JOIN periodo p ON cp.id_periodo = p.id_periodo
      WHERE c.activo = 1`;
    db.query(sql, (err, results) => {
      if (err) { console.error('Error al obtener cursos:', err); return res.status(500).json({ error: 'Error al obtener cursos', detalle: err.message }); }
      res.json(results);
    });
});

// Obtener cursos disponibles en la papelera
router.get('/cursos/papelera', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  // Se usa 5 para coincidir con el itemsPerPage de las tablas de papelera en el frontend
  const limit = parseInt(req.query.limit) || 5; 
  const offset = (page - 1) * limit;


  // Consulta para obtener el conteo total de materias inactivas
  const countSql = `
    SELECT COUNT(DISTINCT c.id_curso) AS total
    FROM cursos c
    WHERE c.activo = 0;
  `;

  db.query(countSql, (err, countResults) => {
    if (err) {
      console.error('Error al obtener el conteo total de cursos inactivos:', err);
      return res.status(500).json({ error: 'Error al obtener el conteo de cursos', detalle: err.message });
    }
    const totalCount = countResults[0].total;
    const totalPages = Math.ceil(totalCount / limit);

    // Consulta para obtener los cursos inactivos paginados con nombres de período académico
    const sql = `
      SELECT
        c.id_curso,
        c.curso AS nombre_curso,
        c.activo,
        GROUP_CONCAT(DISTINCT p.periodo ORDER BY p.periodo ASC SEPARATOR ', ') AS periodoAcademicoNames
      FROM cursos c
      LEFT JOIN cursos_periodo cp ON c.id_curso = cp.id_curso
      LEFT JOIN periodo p ON cp.id_periodo = p.id_periodo
      WHERE c.activo = 0
      GROUP BY c.id_curso, c.curso, c.activo
      ORDER BY c.curso
      LIMIT ? OFFSET ?
    `;

    db.query(sql, [limit, offset], (err, results) => {
      if (err) {
        console.error('Error al obtener cursos inactivos paginados:', err);
        return res.status(500).json({ error: 'Error al obtener cursos', detalle: err.message });
      }

      // Si no hay resultados y el conteo total es 0, no hay materias inactivas.
      // Se devuelve 200 OK con un array vacío.
      if (results.length === 0 && totalCount === 0) {
          return res.json({
            cursos: [],
            totalCount: 0,
            totalPages: 0,
            currentPage: page,
            message: 'No se encontraron cursos inactivos.'
          });
      }

      res.json({
        cursos: results,
        totalCount: totalCount,
        totalPages: totalPages,
        currentPage: page,
        message: 'Cursos inactivos obtenidos exitosamente'
      });
    });
  });
});
router.put('/cursos/:id/estado', registrarAccion('Cambio de estado de curso', 'cursos'), async (req, res) => { // Eliminado el '/api'
  const { id } = req.params;
  const { estado } = req.body; 

  try {
    const updateEstadoQuery = `
      UPDATE cursos
      SET activo = ?
      WHERE id_curso = ?;
    `;
    await db.promise().query(updateEstadoQuery, [estado, id]);
    res.json({ message: `Estado del profesor ${id} actualizado a ${estado}.` });
  } catch (error) {
    console.error("❌ Error al actualizar estado del profesor:", error);
    res.status(500).json({ error: "Error al actualizar estado del profesor", detalle: error.message });
  }
});

router.put('/materias/:id/estado', registrarAccion('Cambio de estado de materia', 'materias'), async (req, res) => { // Eliminado el '/api'
  const { id } = req.params;
  const { estado } = req.body; 

  try {
    const updateEstadoQuery = `
      UPDATE materias
      SET activo = ?
      WHERE id_materia = ?;
    `;
    await db.promise().query(updateEstadoQuery, [estado, id]);
    res.json({ message: `Estado de la materia ${id} actualizado a ${estado}.` });
  } catch (error) {
    console.error("❌ Error al actualizar estado de la materia:", error);
    res.status(500).json({ error: "Error al actualizar estado de la materia", detalle: error.message });
  }
});

router.get('/materias/papelera', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  // Se usa 5 para coincidir con el itemsPerPage de las tablas de papelera en el frontend
  const limit = parseInt(req.query.limit) || 5; 
  const offset = (page - 1) * limit;

  console.log(`GET /materias/papelera llamado para página ${page} con límite ${limit}`);

  // Consulta para obtener el conteo total de materias inactivas
  const countSql = `
    SELECT COUNT(DISTINCT m.id_materia) AS total
    FROM materias m
    WHERE m.activo = 0;
  `;

  db.query(countSql, (err, countResults) => {
    if (err) {
      console.error('Error al obtener el conteo total de materias inactivas:', err);
      return res.status(500).json({ error: 'Error al obtener el conteo de materias', detalle: err.message });
    }
    const totalCount = countResults[0].total;
    const totalPages = Math.ceil(totalCount / limit);

    // Consulta para obtener las materias inactivas paginadas con nombres de período académico
    const sql = `
      SELECT
        m.id_materia,
        m.materia AS nombre_materia,
        m.activo,
        GROUP_CONCAT(DISTINCT p.periodo ORDER BY p.periodo ASC SEPARATOR ', ') AS periodoAcademicoNames
      FROM materias m
      LEFT JOIN materias_periodo mp ON m.id_materia = mp.id_materia
      LEFT JOIN periodo p ON mp.id_periodo = p.id_periodo
      WHERE m.activo = 0
      GROUP BY m.id_materia, m.materia, m.activo
      ORDER BY m.materia
      LIMIT ? OFFSET ?
    `;

    db.query(sql, [limit, offset], (err, results) => {
      if (err) {
        console.error('Error al obtener materias inactivas paginadas:', err);
        return res.status(500).json({ error: 'Error al obtener materias', detalle: err.message });
      }

      // Si no hay resultados y el conteo total es 0, no hay materias inactivas.
      // Se devuelve 200 OK con un array vacío.
      if (results.length === 0 && totalCount === 0) {
          return res.json({
            materias: [],
            totalCount: 0,
            totalPages: 0,
            currentPage: page,
            message: 'No se encontraron materias inactivas.'
          });
      }

      res.json({
        materias: results,
        totalCount: totalCount,
        totalPages: totalPages,
        currentPage: page,
        message: 'Materias inactivas obtenidas exitosamente'
      });
    });
  });
});



// Obtener materias por curso
router.get('/cursos/:id/materias', (req, res) => {
    const cursoId = req.params.id;
    const sql = `
      SELECT id_materia, materia 
      FROM materias 
      WHERE activo = 1 AND id_curso = ?
    `;
    db.query(sql, [cursoId], (err, results) => {
      if (err) return res.status(500).json({ error: 'Error al obtener materias', detalle: err.message });
      res.json(results);
    });
});

// Obtener secciones disponibles
router.get('/secciones', (req, res) => {
    console.log('GET /secciones llamado');
    db.query('SELECT id_seccion, seccion FROM seccion', (err, results) => { 
      if (err) { console.error('Error en la consulta de secciones:', err); return res.status(500).json({ error: 'Error al obtener secciones', detalle: err.message }); }
      res.json(results);
    });
});

// Obtener periodos académicos disponibles (para registros de usuarios/dropdowns)
router.get('/periodos', (req, res) => {
    console.log('GET /periodos llamado');
    db.query('SELECT id_periodo, periodo AS periodo, fechaInicio, fechaFinal FROM periodo', (err, results) => { 
      if (err) { console.error('Error en la consulta de periodos:', err); return res.status(500).json({ error: 'Error al obtener periodos académicos', detalle: err.message }); }
      res.json(results);
    });
});

// Ruta original '/perioodos' (asumo que es un typo o ruta específica que necesitas)
router.get('/perioodos', (req, res) => {
    db.query('SELECT * FROM periodo', (err, results) => { 
      if (err) {
        console.error('Error en la consulta de periodos:', err);
        return res.status(500).json({ error: 'Error al obtener periodos académicos', detalle: err.message });
      }
      res.json(results);
    });
});

router.get('/periodos/:id_periodo/cursos', (req, res) => {
  const periodoId = req.params.id_periodo;

  // Modificación de la consulta SQL para incluir el JOIN y seleccionar el nombre_curso
  const query = `
    SELECT 
      cp.id_curso, 
      c.curso AS nombre_curso 
    FROM 
      cursos_periodo cp
    JOIN 
      cursos c ON cp.id_curso = c.id_curso
    WHERE 
      cp.id_periodo = ?;
  `;

  db.query(query, [periodoId], (err, results) => {
    if (err) {
      console.error('Error en la consulta de cursos por período:', err);
      return res.status(500).json({ error: 'Error al obtener cursos por período', detalle: err.message });
    }
    res.json(results);
  });
});

router.get('/materias/filter', registrarAccion('Obtener materias filtradas', 'materias'), (req, res) => {
    try {
        const { periodoId, cursoId } = req.query;

        // 📌 Validar que el ID del período sea proporcionado
        if (!periodoId) {
            return res.status(400).json({ error: 'El parámetro "periodoId" es obligatorio.' });
        }

        let sql = `
            SELECT DISTINCT 
                m.id_materia,
                m.materia AS nombre_materia,
                mp.id_materia_periodo,
                p.id_periodo,
                p.periodo AS nombre_periodo,
                c.id_curso,
                c.curso AS nombre_curso
            FROM
                materias_periodo mp
            JOIN
                materias m ON mp.id_materia = m.id_materia
            JOIN
                periodo p ON mp.id_periodo = p.id_periodo
            JOIN 
                cursos c ON m.id_curso = c.id_curso 
            WHERE
                mp.id_periodo = ?
        `;
        const values = [periodoId];

        // 📌 Añadir filtro por id_curso si se proporciona
        if (cursoId) {
            sql += ` AND m.id_curso = ?`; // Corregido para filtrar en mp.id_curso
            values.push(cursoId);
        }

        db.query(sql, values, (err, results) => {
            if (err) {
                console.error('Error al obtener materias filtradas:', err);
                return res.status(500).json({ error: 'Error interno del servidor al obtener materias.' });
            }
            res.status(200).json(results);
        });

    } catch (error) {
        console.error('Catch /api/materias/filter:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

router.get('/materias/:id/secciones', (req, res) => {
  const materiaId = req.params.id;

  const query = `
    SELECT 
      ms.id_seccion, 
      s.seccion AS nombre_seccion 
    FROM 
      materias_seccion ms
    JOIN 
      seccion s ON ms.id_seccion = s.id_seccion
    WHERE 
      ms.id_materia = ?;
  `;

  db.query(query, [materiaId], (err, results) => {
    if (err) {
      console.error('Error en la consulta de secciones por materia:', err);
      return res.status(500).json({ error: 'Error al obtener secciones por materia', detalle: err.message });
    }
    res.json(results);
  });
});

router.post('/register-materia', registrarAccion('Creación de materia', 'materias'), (req, res) => {
  const { id_curso, nombreMateria, id_periodo, id_seccion } = req.body;

  if (!id_curso || !nombreMateria || !id_periodo || !id_seccion) {
    return res.status(400).json({ error: 'El curso, el nombre de la materia, el periodo y la sección son obligatorios.' });
  }

  db.query('INSERT INTO materias (id_curso, materia, activo) VALUES (?, ?, 1)',
    [id_curso, nombreMateria], (err, materiaResult) => {
      if (err) {
        console.error('Error insertando materia:', err);
        return res.status(500).json({ error: 'Error al registrar la materia.', detalle: err.message });
      }
      const id_materia = materiaResult.insertId;
      // Insertar la relación en materias_periodo
      db.query('INSERT INTO materias_periodo (id_materia, id_periodo) VALUES (?, ?)',
        [id_materia, id_periodo], (relErr) => {
          if (relErr) {
            console.error('Error insertando relación materia-periodo:', relErr);
            return res.status(500).json({ error: 'Materia registrada, pero hubo un error al asociar el periodo.', detalle: relErr.message });
          }
          // Insertar la relación en materias_seccion
          db.query('INSERT INTO materias_seccion (id_materia, id_seccion) VALUES (?, ?)',
            [id_materia, id_seccion], (secErr) => {
              if (secErr) {
                console.error('Error insertando relación materia-sección:', secErr);
                return res.status(500).json({ error: 'Materia registrada, pero hubo un error al asociar la sección.', detalle: secErr.message });
              }
              res.json({ message: 'Materia registrada exitosamente.', id_materia });
            });
        });
    });
});


// 🔹 Ruta para registrar un nuevo curso 🔹
router.post('/register-curso', registrarAccion('Creación de curso', 'cursos'), async (req, res) => {
    try {
      const { nombreCurso, id_periodo, id_seccion, agregarMateria, nombreMateria = null, estudiantesAsignados = [] } = req.body;

      if (!nombreCurso || !id_periodo) {
        return res.status(400).json({ error: 'El nombre del curso y el periodo son obligatorios.' });
      }
      if (agregarMateria && !nombreMateria) {
        return res.status(400).json({ error: 'El nombre de la materia es obligatorio si se desea agregar.' });
      }

      // Insertar el curso solo con nombre
      db.query('INSERT INTO cursos (curso, activo) VALUES (?, 1)',
        [nombreCurso], async (err, cursoResult) => {
          if (err) {
            console.error('Error insertando curso:', err);
            return res.status(500).json({ error: 'Error al registrar el curso.', detalle: err.message });
          }
          const id_curso = cursoResult.insertId;
          req.params.id = id_curso;

          // Insertar la relación en cursos_periodo
           db.query('INSERT INTO cursos_seccion (id_curso, id_seccion) VALUES (?, ?)',
                [id_curso, id_seccion], async(err3, relResult) => {
                if (err3) {
                  console.error('Error insertando relación curso-sección:', err3);
                  return res.status(500).json({ error: 'Error al registrar la relación curso-sección.', detalle: err3.message });
               }
               

          db.query('INSERT INTO cursos_periodo (id_curso, id_periodo) VALUES (?, ?)',
            [id_curso, id_periodo], async (err2, relResult) => {
              if (err2) {
                console.error('Error insertando relación curso-periodo:', err2);
                return res.status(500).json({ error: 'Error al registrar la relación curso-periodo.', detalle: err2.message });
              }
            

              const assignments = [];

              if (agregarMateria && nombreMateria) {
                assignments.push(new Promise((resolve, reject) => {
                  db.query('INSERT INTO materias (id_curso, materia, activo) VALUES (?, ?, 1)',
                    [id_curso, nombreMateria], (materiaErr, materiaRes) => {
                      if (materiaErr) return reject(materiaErr);
                      const id_materia_creada = materiaRes.insertId;
                      if (estudiantesAsignados.length > 0) {
                        const materiaEstValues = estudiantesAsignados.map(id_est => [id_est, id_materia_creada]);
                        db.query('INSERT INTO usuario_materias (id_usuario, id_materia) VALUES ?',
                          [materiaEstValues], (estMatErr) => {
                            if (estMatErr) return reject(estMatErr);
                            resolve();
                          });
                      } else {
                        resolve();
                      }
                    });
                }));
              }

              if (estudiantesAsignados.length > 0) {
                const currentDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
                const cursoValues = estudiantesAsignados.map(id_est => [id_est, id_curso, currentDateTime]);
                assignments.push(new Promise((resolve, reject) => {
                  db.query('INSERT INTO usuario_cursos (id_usuario, id_curso, fecha_inscripcion) VALUES ?',
                    [cursoValues], (cursoEstErr) => {
                      if (cursoEstErr) return reject(cursoEstErr);
                      resolve();
                    });
                }));
              }

              Promise.all(assignments)
                .then(() => {
                  res.json({ message: 'Curso registrado exitosamente.', id_curso });
                })
                .catch(assignError => {
                  console.error('Error asignando elementos al curso:', assignError);
                  res.status(500).json({ error: 'Curso registrado, pero hubo un error al asignar elementos adicionales.', detalle: assignError.message });
                });
            });
        });
      });
    } catch (error) {
      console.error('Error en /api/register-curso:', error);
      res.status(500).json({ error: 'Error interno del servidor al registrar curso.', detalle: error.message });
    }
});


// 🔹 Ruta para registrar un nuevo periodo 🔹
router.post('/register-periodo', registrarAccion('Creación de periodo', 'periodo'), async (req, res) => {
    try {
      const { nombrePeriodo, fechaInicio, fechaFinal } = req.body;

      if (!nombrePeriodo || !fechaInicio || !fechaFinal) {
        return res.status(400).json({ error: 'El nombre, fecha de inicio y fecha final del periodo son obligatorios.' });
      }

      const formattedFechaInicio = new Date(fechaInicio).toISOString().slice(0, 10);
      const formattedFechaFinal = new Date(fechaFinal).toISOString().slice(0, 10);

      db.query('INSERT INTO periodo (periodo, fechaInicio, fechaFinal) VALUES (?, ?, ?)', 
        [nombrePeriodo, formattedFechaInicio, formattedFechaFinal], (err, periodoResult) => {
          if (err) {
            console.error('Error insertando periodo:', err);
            return res.status(500).json({ error: 'Error al registrar el periodo.', detalle: err.message });
          }
          req.params.id = periodoResult.insertId;
          res.json({ message: 'Periodo registrado exitosamente.', id_periodo: periodoResult.insertId });
        });
    } catch (error) {
      console.error('Error en /api/register-periodo:', error);
      res.status(500).json({ error: 'Error interno del servidor al registrar periodo.', detalle: error.message });
    }
});

router.get('/periodos-academicos', /*isAuthenticated,*/ async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
      const [totalPeriodosResult] = await db.promise().query('SELECT COUNT(*) AS total FROM periodo;');
      const totalCount = totalPeriodosResult[0].total;
      const totalPages = Math.ceil(totalCount / limit);

      const periodosQuery = `
        SELECT
          id_periodo,
          periodo AS nombre_periodo,
          fechaInicio,
          fechaFinal
        FROM periodo
        ORDER BY fechaInicio DESC
        LIMIT ?, ?;
      `;
      const [periodos] = await db.promise().query(periodosQuery, [offset, parseInt(limit)]);

      res.json({
        periodos: periodos,
        totalCount,
        totalPages,
        currentPage: parseInt(page),
      });

    } catch (error) {
      console.error("❌ Error al obtener periodos académicos:", error);
      res.status(500).json({ error: "Error al obtener periodos académicos", detalle: error.message });
    }
});

router.get('/periodos-academicos/resumen', /*isAuthenticated,*/ async (req, res) => {
    try {
      const [totalRows] = await db.promise().query('SELECT COUNT(*) AS total FROM periodo');
      res.json({
        total: totalRows[0].total,
      });
    } catch (error) {
      console.error("❌ Error al obtener resumen de periodos:", error);
      res.status(500).json({ error: "Error al obtener resumen de periodos", detalle: error.message });
    }
});


router.get('/periodos-academicos/:id', /*isAuthenticated,*/ async (req, res) => {
    const { id } = req.params; // id_periodo
    try {
        // 1. Obtener los detalles básicos del periodo
        const [periodoRows] = await db.promise().query(`
            SELECT
                p.id_periodo,
                p.periodo AS nombre_periodo,
                p.fechaInicio,
                p.fechaFinal
            FROM periodo p
            WHERE p.id_periodo = ?;
        `, [id]);

        if (periodoRows.length === 0) {
            return res.status(404).json({ error: 'Periodo académico no encontrado.' });
        }

        const periodo = periodoRows[0];

        // 2. Obtener cursos asociados a este periodo
        // Modificación clave: Obtener cursos a través de las materias asociadas al periodo
        const [cursosResult] = await db.promise().query(`
            SELECT DISTINCT c.id_curso, c.curso AS nombre_curso
            FROM cursos c
            JOIN materias m ON c.id_curso = m.id_curso  -- Une cursos con materias
            JOIN materias_periodo mp ON m.id_materia = mp.id_materia -- Une materias con la tabla intermedia materias_periodo
            WHERE mp.id_periodo = ?; -- Filtra por el ID del periodo
        `, [id]);
        const cursos_info = cursosResult.map(c => ({ id_curso: c.id_curso, nombre_curso: c.nombre_curso }));

        // 3. Obtener secciones asociadas a las MATERIAS de este periodo
        const [seccionesResult] = await db.promise().query(`
            SELECT DISTINCT s.id_seccion, s.seccion AS nombre_seccion
            FROM seccion s
            JOIN materias_seccion ms ON s.id_seccion = ms.id_seccion
            JOIN materias m ON ms.id_materia = m.id_materia
            JOIN materias_periodo mp ON m.id_materia = mp.id_materia
            WHERE mp.id_periodo = ?;
        `, [id]);
        const secciones_info = seccionesResult.map(s => ({ id_seccion: s.id_seccion, nombre_seccion: s.nombre_seccion }));


        // 4. Obtener materias ofrecidas en este periodo
        const [materiasResult] = await db.promise().query(`
            SELECT DISTINCT m.id_materia, m.materia AS nombre_materia
            FROM materias m
            JOIN materias_periodo mp ON m.id_materia = mp.id_materia
            WHERE mp.id_periodo = ?;
        `, [id]);
        const materias_info = materiasResult.map(m => ({ id_materia: m.id_materia, nombre_materia: m.nombre_materia }));
        
        // 5. Conteo de estudiantes inscritos en cursos de este periodo
        // Si la relación estudiante-curso-periodo es a través de cursos_periodo, se mantiene
        // Si el estudiante se inscribe al curso, y el curso está en el periodo
        const [totalEstudiantesResult] = await db.promise().query(`
            SELECT COUNT(DISTINCT uc.id_usuario) AS total_estudiantes
            FROM usuario_cursos uc
            JOIN usuarios u ON uc.id_usuario = u.id_usuario
            JOIN cursos c ON uc.id_curso = c.id_curso
            JOIN cursos_periodo cp ON c.id_curso = cp.id_curso
            WHERE u.rol = 'estudiante' AND cp.id_periodo = ?;
        `, [id]);
        const totalEstudiantes = totalEstudiantesResult[0]?.total_estudiantes || 0;

        // 6. Conteo de profesores asignados a materias de los cursos de este periodo
        // La consulta de profesores también debe considerar las materias del periodo
        const [totalProfesoresResult] = await db.promise().query(`
            SELECT COUNT(DISTINCT um.id_usuario) AS total_profesores
            FROM usuario_materias um
            JOIN usuarios u ON um.id_usuario = u.id_usuario
            JOIN materias m ON um.id_materia = m.id_materia
            JOIN materias_periodo mp ON m.id_materia = mp.id_materia
            WHERE u.rol = 'profesor' AND mp.id_periodo = ?;
        `, [id]);
        const totalProfesores = totalProfesoresResult[0]?.total_profesores || 0;

        const periodoFormateado = {
            id_periodo: periodo.id_periodo,
            nombre_periodo: periodo.nombre_periodo,
            fechaInicio: periodo.fechaInicio,
            fechaFinal: periodo.fechaFinal,
            cursos_info,
            secciones_info, 
            materias_info,
            totalEstudiantes, 
            totalProfesores 
        };

        res.json(periodoFormateado);

    } catch (error) {
        console.error("❌ Error al obtener periodo por ID:", error);
        res.status(500).json({ error: "Error al obtener periodo", detalle: error.message });
    }
});

router.post('/periodos-academicos', registrarAccion('Creación de periodo académico', 'periodo'), /*isAuthenticated,*/ async (req, res) => {
    const { nombrePeriodo, fechaInicio, fechaFinal } = req.body;

    try {
      if (!nombrePeriodo || !fechaInicio || !fechaFinal) {
        return res.status(400).json({ error: 'El nombre, fecha de inicio y fecha final del periodo son obligatorios.' });
      }

      const formattedFechaInicio = new Date(fechaInicio).toISOString().slice(0, 10);
      const formattedFechaFinal = new Date(fechaFinal).toISOString().slice(0, 10);

      const insertPeriodoQuery = `
        INSERT INTO periodo (periodo, fechaInicio, fechaFinal)
        VALUES (?, ?, ?);
      `;
      const [result] = await db.promise().query(insertPeriodoQuery, [nombrePeriodo, formattedFechaInicio, formattedFechaFinal]);
      const nuevoPeriodoId = result.insertId;

      res.status(201).json({ message: 'Periodo académico añadido exitosamente.', id: nuevoPeriodoId });
    }
    catch (error) {
      console.error("❌ Error al añadir periodo académico:", error);
      res.status(500).json({ error: "Error al añadir periodo académico", detalle: error.message });
    }
});

router.put('/periodos-academicos/:id', registrarAccion('Actualización de periodo académico', 'periodo'), /*isAuthenticated,*/ async (req, res) => {
    const { id } = req.params;
    const { nombrePeriodo, fechaInicio, fechaFinal } = req.body;

    try {
      let updateFields = {};
      if (nombrePeriodo !== undefined) updateFields.periodo = nombrePeriodo;
      if (fechaInicio !== undefined) updateFields.fechaInicio = new Date(fechaInicio).toISOString().slice(0, 10);
      if (fechaFinal !== undefined) updateFields.fechaFinal = new Date(fechaFinal).toISOString().slice(0, 10);
      
      if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ error: "No hay campos para actualizar." });
      }

      const updateQuery = 'UPDATE periodo SET ? WHERE id_periodo = ?';
      await db.promise().query(updateQuery, [updateFields, id]);

      res.json({ message: 'Periodo académico actualizado exitosamente.' });

    } catch (error) {
      console.error("❌ Error al actualizar periodo académico:", error);
      res.status(500).json({ error: "Error al actualizar periodo académico", detalle: error.message });
    }
});



router.get('/cursos-academicos', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;
    const rawSearchTerm = req.query.search;
    const searchTerm = rawSearchTerm ? `%${rawSearchTerm}%` : null;

    let countSql = `
        SELECT COUNT(DISTINCT c.id_curso) AS total
        FROM cursos c
        LEFT JOIN cursos_periodo cp ON c.id_curso = cp.id_curso
        LEFT JOIN periodo p ON cp.id_periodo = p.id_periodo
        LEFT JOIN cursos_seccion cs ON c.id_curso = cs.id_curso
        LEFT JOIN seccion s ON cs.id_seccion = s.id_seccion
        WHERE c.activo = 1
    `;

    // Modificamos la consulta principal para obtener los conteos de estudiantes y profesores
    // EXCLUSIVAMENTE de usuario_materias, para ser consistentes con la vista de detalle.
    let cursosSql = `
        SELECT
            c.id_curso,
            c.curso AS nombre_curso,
            c.activo AS estado,
            p.periodo AS nombre_periodo,
            s.seccion AS nombre_seccion,
            (
                SELECT COUNT(DISTINCT m.id_materia)
                FROM materias m
                WHERE m.id_curso = c.id_curso
            ) AS total_materias_curso,
            (
                SELECT COUNT(DISTINCT um.id_usuario)
                FROM usuario_materias um
                JOIN materias m ON um.id_materia = m.id_materia
                JOIN usuarios u ON um.id_usuario = u.id_usuario
                WHERE m.id_curso = c.id_curso AND u.rol = 'estudiante'
            ) AS total_estudiantes_curso,
            (
                SELECT COUNT(DISTINCT um.id_usuario)
                FROM usuario_materias um
                JOIN materias m ON um.id_materia = m.id_materia
                JOIN usuarios u ON um.id_usuario = u.id_usuario
                WHERE m.id_curso = c.id_curso AND u.rol = 'profesor'
            ) AS total_profesores_curso
        FROM cursos c
        LEFT JOIN cursos_periodo cp ON c.id_curso = cp.id_curso
        LEFT JOIN periodo p ON cp.id_periodo = p.id_periodo
        LEFT JOIN cursos_seccion cs ON c.id_curso = cs.id_curso
        LEFT JOIN seccion s ON cs.id_seccion = s.id_seccion
        WHERE c.activo = 1
    `;

    let queryParams = []; // Parámetros para la consulta principal (cursosSql)
    let countParams = []; // Parámetros para la consulta de conteo (countSql)

    if (searchTerm) {
        countSql += ` AND c.curso LIKE ?`;
        cursosSql += ` AND c.curso LIKE ?`;
        queryParams.push(searchTerm);
        countParams.push(searchTerm);
    }

    cursosSql += `
        ORDER BY c.id_curso, p.fechaInicio DESC
        LIMIT ?, ?;
    `;
    queryParams.push(offset, parseInt(limit)); // Agrega el límite y el offset a los parámetros de la consulta principal

    db.query(countSql, countParams, (errCount, totalCursosResult) => {
        if (errCount) {
            console.error('Error al contar cursos:', errCount);
            return res.status(500).json({ error: 'Error al contar cursos', detalle: errCount.message });
        }
        const totalCount = totalCursosResult[0].total;
        const totalPages = Math.ceil(totalCount / limit);

        db.query(cursosSql, queryParams, (errCursos, cursos) => {
            if (errCursos) {
                console.error('Error al obtener cursos:', errCursos);
                return res.status(500).json({ error: 'Error al obtener cursos', detalle: errCursos.message });
            }

            if (!cursos.length) {
                return res.json({ cursos: [], totalCount, totalPages, currentPage: parseInt(page) });
            }

            // Ya no es necesario un bucle forEach y consultas anidadas para obtener estudiantes_info y profesores_info
            // porque los conteos ya se hacen en la consulta SQL principal.
            // Los campos estudiantes_info y profesores_info del objeto curso
            // serán arrays vacíos en esta API de listado, lo cual es correcto
            // porque no se necesitan para la tabla principal, solo para el modal de detalle.

            res.json({ cursos, totalCount, totalPages, currentPage: parseInt(page) });
        });
    });
});



/**
 * @route GET /api/cursos-academicos/resumen
 * @description Obtiene un resumen de los cursos (total y activos).
 * @returns {json} Objeto con el total de cursos y cursos activos.
 */
router.get('/cursos-academicos/resumen', /*isAuthenticated,*/ async (req, res) => {
    try {
        const [totalCursosResult] = await db.promise().query('SELECT COUNT(*) AS total FROM cursos;');
        const totalCursos = totalCursosResult[0].total;

        const [cursosActivosResult] = await db.promise().query('SELECT COUNT(*) AS total FROM cursos WHERE activo = 1;');
        const cursosActivos = cursosActivosResult[0].total;

        const [totalEstudiantesResult] = await db.promise().query(`
          SELECT COUNT(DISTINCT uc.id_usuario) AS total_estudiantes
          FROM usuario_cursos uc
          JOIN usuarios u ON uc.id_usuario = u.id_usuario
          WHERE u.rol = 'estudiante';
      `);
      const totalEstudiantesInscritos = totalEstudiantesResult[0].total_estudiantes;

      const [totalProfesoresResult] = await db.promise().query(`
          SELECT COUNT(DISTINCT uc.id_usuario) AS total_profesores
          FROM usuario_cursos uc
          JOIN usuarios u ON uc.id_usuario = u.id_usuario
          WHERE u.rol = 'profesor';
      `);
      const totalProfesoresAsignados = totalProfesoresResult[0].total_profesores;

        res.json({
            totalCursos,
            cursosActivos,
            totalEstudiantesInscritos,
            totalProfesoresAsignados
        });
    } catch (error) {
        console.error("❌ Error al obtener resumen de cursos:", error);
        res.status(500).json({ error: "Error al obtener resumen de cursos", detalle: error.message });
    }
});


router.get('/cursos-academicos/:id', (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: 'ID de curso no proporcionado.' });
    }

    // 1. Obtener los datos principales del curso
    // Se ajusta la unión para usar 'cursos_periodo' para la relación con 'periodo'.
    // Se ajusta la unión para usar 'cursos_seccion' para la relación con 'seccion'.
    const cursoQuery = `
        SELECT
            c.id_curso,
            c.curso AS nombre_curso,
            c.activo AS estado,
            p.id_periodo,
            p.periodo AS nombre_periodo,
            p.fechaInicio,
            p.fechaFinal,
            s.id_seccion,
            s.seccion AS nombre_seccion
        FROM cursos c
        LEFT JOIN cursos_periodo cp ON c.id_curso = cp.id_curso
        LEFT JOIN periodo p ON cp.id_periodo = p.id_periodo
        LEFT JOIN cursos_seccion cs ON c.id_curso = cs.id_curso
        LEFT JOIN seccion s ON cs.id_seccion = s.id_seccion
        WHERE c.id_curso = ? AND c.activo = 1;
    `;

    db.query(cursoQuery, [id], (err, cursoRows) => {
        if (err) {
            console.error('Error al obtener el curso principal:', err);
            return res.status(500).json({ error: 'Error interno del servidor al obtener el curso.', detalle: err.message });
        }

        if (cursoRows.length === 0) {
            return res.status(404).json({ error: 'Curso no encontrado o inactivo.' });
        }

        const curso = cursoRows[0];
        // Ahora hay 2 subconsultas: materiaUsers y materias. (Se eliminó usuario_cursos)
        let queriesCompletadas = 0;
        const allUsersRaw = []; // Almacenará usuarios de usuario_materias
        let materiasResult = [];

        // Función para verificar si todas las subconsultas han terminado
        const checkAndSendResponse = () => {
            queriesCompletadas++;
            if (queriesCompletadas === 2) { // Ahora hay 2 subconsultas
                // Unificar y eliminar duplicados de usuarios
                const uniqueUsersMap = new Map(); // Usamos Map para mantener el orden y la unicidad
                
                allUsersRaw.forEach(u => {
                    // La clave de unicidad ahora es por usuario-materia-periodo, para reflejar la granularidad de la asignación a materia
                    const key = `${u.id_usuario}-${u.id_materia}-${u.id_periodo}`; 
                    if (!uniqueUsersMap.has(key)) {
                        uniqueUsersMap.set(key, u);
                    }
                });

                const estudiantes_info = Array.from(uniqueUsersMap.values())
                    .filter(u => u.rol === 'estudiante')
                    .map(u => ({
                        id_usuario: u.id_usuario,
                        nombre_usuario: `${u.primer_nombre} ${u.primer_apellido} (${u.cedula})`,
                        rol: u.rol,
                        nombre_materia: u.nombre_materia || 'N/A', 
                        nombre_periodo: u.nombre_periodo || 'N/A'  
                    }));

                const profesores_info = Array.from(uniqueUsersMap.values())
                    .filter(u => u.rol === 'profesor')
                    .map(u => ({
                        id_usuario: u.id_usuario,
                        nombre_usuario: `${u.primer_nombre} ${u.primer_apellido} (${u.cedula})`,
                        rol: u.rol,
                        nombre_materia: u.nombre_materia || 'N/A', 
                        nombre_periodo: u.nombre_periodo || 'N/A'  
                    }));

                // Asignar los datos al objeto curso y enviar la respuesta
                curso.estudiantes_info = estudiantes_info;
                curso.profesores_info = profesores_info;
                curso.materias_info = materiasResult.map(m => ({
                    id_materia: m.id_materia,
                    nombre_materia: m.nombre_materia
                }));

                res.json(curso);
            }
        };

        // La consulta a 'usuario_cursos' ha sido eliminada para que los datos provengan
        // exclusivamente de 'usuario_materias' para el detalle de la asignación.
        // El conteo de 'queriesCompletadas' ahora es de 2 (usuario_materias y materias).

        // 2. Obtener usuarios asignados a materias de este curso
        // Se unen las tablas para obtener el nombre de la materia y el periodo.
        db.query(`
            SELECT
                u.id_usuario,
                u.primer_nombre,
                u.primer_apellido,
                u.cedula,
                u.rol,
                m.id_materia,
                m.materia AS nombre_materia,
                p.id_periodo,
                p.periodo AS nombre_periodo
            FROM usuario_materias um
            JOIN usuarios u ON um.id_usuario = u.id_usuario
            JOIN materias m ON um.id_materia = m.id_materia
            LEFT JOIN periodo p ON um.id_periodo = p.id_periodo 
            WHERE m.id_curso = ?
        `, [id], (errMateriaUsers, materiaUsers) => {
            if (errMateriaUsers) {
                console.error('Error al obtener usuarios de materias del curso:', errMateriaUsers);
            } else {
                // Solo añadimos los usuarios que vienen de usuario_materias
                materiaUsers.forEach(u => allUsersRaw.push(u));
            }
            checkAndSendResponse(); // Llama al verificador al completar esta consulta
        });

        // 3. Obtener materias del curso
        db.query(`
            SELECT id_materia, materia AS nombre_materia
            FROM materias
            WHERE id_curso = ?
        `, [id], (errMaterias, materias) => {
            if (errMaterias) {
                console.error('Error al obtener materias del curso:', errMaterias);
            } else {
                materiasResult = materias;
            }
            checkAndSendResponse(); // Llama al verificador al completar esta consulta
        });
    });
});






/**
 * @route POST /api/cursos-academicos
 * @description Crea un nuevo curso académico.
 * @param {string} req.body.nombreCurso - Nombre del curso.
 * @param {number} req.body.id_periodo - ID del periodo académico asociado.
 * @param {boolean} [req.body.agregarMateria=false] - Indica si se debe agregar una materia junto con el curso.
 * @param {string} [req.body.nombreMateria] - Nombre de la materia si se va a agregar (obligatorio si agregarMateria es true).
 * @param {Array<number>} [req.body.estudiantesAsignados=[]] - IDs de estudiantes a asignar al curso/materia.
 * @returns {json} Mensaje de éxito e ID del nuevo curso.
 */
router.post('/cursos-academicos', registrarAccion('Creación de curso académico', 'cursos'), /*isAuthenticated,*/ async (req, res) => {
    const { nombreCurso, id_periodo, agregarMateria = false, nombreMateria = null, estudiantesAsignados = [] } = req.body;

    if (!nombreCurso || !id_periodo) {
        return res.status(400).json({ error: 'El nombre del curso y el periodo son obligatorios.' });
    }
    if (agregarMateria && !nombreMateria) {
        return res.status(400).json({ error: 'El nombre de la materia es obligatorio si se desea agregar.' });
    }

    let connection;
    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        // Insertar el nuevo curso solo con nombre
        const [cursoResult] = await connection.query(
            'INSERT INTO cursos (curso, activo) VALUES (?, 1)',
            [nombreCurso]
        );
        const id_curso = cursoResult.insertId;
        req.params.id = id_curso;

        // Insertar la relación en cursos_periodo
        await connection.query('INSERT INTO cursos_periodo (id_curso, id_periodo) VALUES (?, ?)', [id_curso, id_periodo]);

        // Asignar estudiantes al curso (si hay)
        if (estudiantesAsignados.length > 0) {
            const currentDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const cursoValues = estudiantesAsignados.map(id_est => [id_est, id_curso, currentDateTime]);
            await connection.query('INSERT INTO usuario_cursos (id_usuario, id_curso, fecha_inscripcion) VALUES ?', [cursoValues]);
        }

        // Si se solicita, agregar una materia con el curso
        if (agregarMateria && nombreMateria) {
            const [materiaResult] = await connection.query(
                'INSERT INTO materias (id_curso, materia, activo) VALUES (?, ?, 1)',
                [id_curso, nombreMateria]
            );
            const id_materia_creada = materiaResult.insertId;

            // Asignar estudiantes a la materia recién creada si hay
            if (estudiantesAsignados.length > 0) {
                const materiaEstValues = estudiantesAsignados.map(id_est => [id_est, id_materia_creada]);
                await connection.query('INSERT INTO usuario_materias (id_usuario, id_materia) VALUES ?', [materiaEstValues]);
            }
        }

        await connection.commit();
        res.status(201).json({ message: 'Curso registrado exitosamente.', id_curso });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("❌ Error al crear curso:", error);
        res.status(500).json({ error: "Error al crear curso", detalle: error.message });
    } finally {
        if (connection) connection.release();
    }
});

/**
 * @route PUT /api/cursos-academicos/:id
 * @description Actualiza un curso existente.
 * @param {number} req.params.id - ID del curso a actualizar.
 * @param {string} req.body.nombre_curso - Nuevo nombre del curso.
 * @param {number} req.body.id_periodo - Nuevo ID del periodo.
 * @returns {json} Mensaje de éxito.
 */
router.put('/cursos-academicos/:id', registrarAccion('Actualización de curso académico', 'cursos'), (req, res) => {
    const { id } = req.params;
    const { nombre_curso, id_periodo, id_seccion } = req.body;

    // Validar datos de entrada
    if (!nombre_curso || !id_periodo || !id_seccion) {
        return res.status(400).json({ error: 'Nombre del curso, período y sección son obligatorios para la actualización.' });
    }

    // Usaremos un contador para saber cuándo todas las actualizaciones han terminado.
    // Aunque no es una transacción atómica, asegura que todas las consultas se intenten.
    let updatesCompleted = 0;
    const totalUpdates = 3; // Curso, Curso_Periodo, Curso_Seccion

    const sendResponse = (message, status = 200) => {
        if (status === 200) {
            res.json({ message: message });
        } else {
            res.status(status).json({ error: message });
        }
    };

    const handleError = (errorMsg, detailError) => {
        console.error("❌ Error en la actualización de curso:", errorMsg, detailError);
        // Solo enviar respuesta de error si no se ha enviado ya
        if (!res.headersSent) {
            res.status(500).json({ error: errorMsg, detalle: detailError.message || detailError });
        }
    };

    // 1. Actualizar el nombre del curso en la tabla 'cursos'
    const updateCursoQuery = `
        UPDATE cursos
        SET curso = ?
        WHERE id_curso = ?;
    `;
    db.query(updateCursoQuery, [nombre_curso, id], (errUpdateCurso, resultUpdateCurso) => {
        if (errUpdateCurso) {
            return handleError("Error al actualizar el nombre del curso.", errUpdateCurso);
        }
        updatesCompleted++;
        checkCompletion();
    });

    // 2. Actualizar la relación con el Período en 'cursos_periodo'
    const updateCursoPeriodoQuery = `
        UPDATE cursos_periodo
        SET id_periodo = ?
        WHERE id_curso = ?;
    `;
    db.query(updateCursoPeriodoQuery, [id_periodo, id], (errUpdatePeriodo, resultUpdatePeriodo) => {
        if (errUpdatePeriodo) {
            return handleError("Error al actualizar la relación de período del curso.", errUpdatePeriodo);
        }

        if (resultUpdatePeriodo.affectedRows === 0) {
            // Si no se actualizó ninguna fila, significa que no existía la relación, entonces la insertamos
            const insertCursoPeriodoQuery = `
                INSERT INTO cursos_periodo (id_curso, id_periodo)
                VALUES (?, ?);
            `;
            db.query(insertCursoPeriodoQuery, [id, id_periodo], (errInsertPeriodo, resultInsertPeriodo) => {
                if (errInsertPeriodo) {
                    return handleError("Error al insertar la relación de período del curso.", errInsertPeriodo);
                }
                updatesCompleted++;
                checkCompletion();
            });
        } else {
            updatesCompleted++;
            checkCompletion();
        }
    });

    // 3. Actualizar la relación con la Sección en 'cursos_seccion'
    const updateCursoSeccionQuery = `
        UPDATE cursos_seccion
        SET id_seccion = ?
        WHERE id_curso = ?;
    `;
    db.query(updateCursoSeccionQuery, [id_seccion, id], (errUpdateSeccion, resultUpdateSeccion) => {
        if (errUpdateSeccion) {
            return handleError("Error al actualizar la relación de sección del curso.", errUpdateSeccion);
        }

        if (resultUpdateSeccion.affectedRows === 0) {
            // Si no se actualizó ninguna fila, la relación no existía, entonces la insertamos
            const insertCursoSeccionQuery = `
                INSERT INTO cursos_seccion (id_curso, id_seccion)
                VALUES (?, ?);
            `;
            db.query(insertCursoSeccionQuery, [id, id_seccion], (errInsertSeccion, resultInsertSeccion) => {
                if (errInsertSeccion) {
                    return handleError("Error al insertar la relación de sección del curso.", errInsertSeccion);
                }
                updatesCompleted++;
                checkCompletion();
            });
        } else {
            updatesCompleted++;
            checkCompletion();
        }
    });

    // Función para verificar si todas las actualizaciones han sido procesadas
    function checkCompletion() {
        if (updatesCompleted === totalUpdates && !res.headersSent) {
            sendResponse('Curso actualizado exitosamente.');
        }
    }
});



/**
 * @route PUT /api/cursos-academicos/:id/estado
 * @description Cambia el estado (activo/inactivo) de un curso.
 * @param {number} req.params.id - ID del curso.
 * @param {number} req.body.estado - Nuevo estado (1 para activo, 0 para inactivo).
 * @returns {json} Mensaje de éxito.
 */
router.put('/cursos-academicos/:id/estado', registrarAccion('Cambio de estado de curso académico', 'cursos'), /*isAuthenticated,*/ async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body; // 1 o 0

    if (estado === undefined || (estado !== 0 && estado !== 1)) {
        return res.status(400).json({ error: 'El estado es inválido. Debe ser 0 o 1.' });
    }

    try {
        await db.promise().query(
            'UPDATE cursos SET activo = ? WHERE id_curso = ?',
            [estado, id]
        );
        res.json({ message: `Estado del curso ${id} actualizado a ${estado}.` });
    } catch (error) {
        console.error("❌ Error al cambiar estado del curso:", error);
        res.status(500).json({ error: "Error al cambiar estado del curso", detalle: error.message });
    }
});

/**
 * @route DELETE /api/cursos-academicos/:id
 * @description Elimina un curso y todas sus asociaciones (materias y usuarios).
 * @param {number} req.params.id - ID del curso a eliminar.
 * @returns {json} Mensaje de éxito.
 */
router.delete('/cursos-academicos/:id', registrarAccion('Eliminación de curso académico', 'cursos'), /*isAuthenticated,*/ async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        // Eliminar las materias asociadas a este curso
        // NOTA: Si `materias.id_curso` tiene ON DELETE RESTRICT, esto fallará si hay materias.
        // Asumiendo que `ON DELETE CASCADE` o que se pueden eliminar las materias primero.
        // Si no, necesitarías una estrategia diferente (ej. pedir al usuario que elimine materias primero).
        await connection.query('DELETE FROM materias WHERE id_curso = ?', [id]);
        
        // Eliminar las asociaciones de usuarios con este curso
        await connection.query('DELETE FROM usuario_cursos WHERE id_curso = ?', [id]);

        // Finalmente, eliminar el curso
        const [result] = await connection.query('DELETE FROM cursos WHERE id_curso = ?', [id]);

        if (result.affectedRows === 0) {
            await connection.rollback(); // Deshacer si no se encontró el curso
            return res.status(404).json({ error: 'Curso no encontrado para eliminar.' });
        }

        await connection.commit();
        res.json({ message: 'Curso y todas sus asociaciones (materias y usuarios) eliminadas exitosamente.' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("❌ Error al eliminar curso:", error);
        res.status(500).json({ error: "Error al eliminar curso", detalle: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// 🚀 RUTAS PARA MATERIAS ACADÉMICAS (Funcionalidad Completa Restaurada) 🚀
// ==========================================================

// Obtener resumen de materias
router.get('/materias/resumen', /*isAuthenticated,*/ async (req, res) => {
    try {
        const [totalMateriasResult] = await db.promise().query('SELECT COUNT(*) AS total FROM materias;');
        const totalMaterias = totalMateriasResult[0].total;

        const [materiasActivasResult] = await db.promise().query('SELECT COUNT(*) AS total FROM materias WHERE activo = 1;');
        const materiasActivas = materiasActivasResult[0].total;

        const [totalEstudiantesResult] = await db.promise().query(`
            SELECT COUNT(DISTINCT um.id_usuario) AS total_estudiantes
            FROM usuario_materias um
            JOIN usuarios u ON um.id_usuario = u.id_usuario
            WHERE u.rol = 'estudiante';
        `);
        const totalEstudiantesEnMaterias = totalEstudiantesResult[0].total_estudiantes;

        const [totalProfesoresResult] = await db.promise().query(`
            SELECT COUNT(DISTINCT um.id_usuario) AS total_profesores
            FROM usuario_materias um
            JOIN usuarios u ON um.id_usuario = u.id_usuario
            WHERE u.rol = 'profesor';
        `);
        const totalProfesoresAsignadosMaterias = totalProfesoresResult[0].total_profesores;

        res.json({
            totalMaterias,
            materiasActivas,
            totalEstudiantesEnMaterias,
            totalProfesoresAsignadosMaterias
        });
    } catch (error) {
        console.error("❌ Error al obtener resumen de materias:", error);
        res.status(500).json({ error: "Error al obtener resumen de materias", detalle: error.message });
    }
});

// Endpoint para obtener la lista de materias con su periodo correspondiente
router.get('/materias-academicas', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const searchTerm = req.query.search ? `%${req.query.search}%` : null;

  // Consulta para obtener las materias paginadas, agrupando por materia y periodo
  // Se ha mejorado la unión con materias_periodo para obtener el id_periodo y el nombre
  let baseSql = `
    SELECT
      m.id_materia,
      m.materia AS nombre_materia,
      m.id_curso,
      c.curso AS nombre_curso,
      mp.id_periodo,
      p.periodo AS nombre_periodo,
      m.activo AS estado,
      GROUP_CONCAT(DISTINCT s.seccion ORDER BY s.seccion SEPARATOR ', ') AS nombre_seccion
    FROM materias m
    LEFT JOIN cursos c ON m.id_curso = c.id_curso
    JOIN materias_periodo mp ON m.id_materia = mp.id_materia -- Usar JOIN para asegurar que solo se muestren las materias que tienen un periodo asignado
    LEFT JOIN periodo p ON mp.id_periodo = p.id_periodo
    LEFT JOIN materias_seccion ms ON m.id_materia = ms.id_materia -- CORREGIDO: Eliminada la condición 'AND ms.id_periodo = mp.id_periodo'
    LEFT JOIN seccion s ON ms.id_seccion = s.id_seccion
    WHERE m.activo = 1
  `;

  // Consulta para el conteo total de combinaciones materia-periodo
  let countSql = `
    SELECT COUNT(DISTINCT CONCAT(m.id_materia, '-', mp.id_periodo)) AS total
    FROM materias m
    JOIN materias_periodo mp ON m.id_materia = mp.id_materia
    WHERE m.activo = 1
  `;

  let queryParams = [];
  let countParams = [];

  if (searchTerm) {
    baseSql += ` AND m.materia LIKE ?`;
    countSql += ` AND m.materia LIKE ?`;
    queryParams.push(searchTerm);
    countParams.push(searchTerm);
  }

  baseSql += `
    GROUP BY m.id_materia, mp.id_periodo, m.id_curso, c.curso, p.periodo, m.activo
    ORDER BY m.id_materia DESC, mp.id_periodo DESC
    LIMIT ? OFFSET ?;
  `;
  queryParams.push(limit, offset);

  db.query(countSql, countParams, (errCount, countResult) => {
    if (errCount) {
      console.error('Error al contar materias:', errCount);
      return res.status(500).json({ error: 'Error al contar materias', detalle: errCount.message });
    }
    const totalCount = countResult[0].total;

    db.query(baseSql, queryParams, (err, results) => {
      if (err) {
        console.error('Error al obtener materias:', err);
        return res.status(500).json({ error: 'Error al obtener materias', detalle: err.message });
      }

      if (!results.length && totalCount === 0) {
        return res.json({ materias: [], total: 0, totalPages: 0, currentPage: page });
      }

      const totalPages = Math.ceil(totalCount / limit);

      let pendientes = results.length;
      if (pendientes === 0) {
          return res.json({ materias: [], total: totalCount, totalPages: totalPages, currentPage: page });
      }

      results.forEach((materia) => {
        // Estudiantes asignados a la materia Y AL PERIODO ESPECÍFICO
        db.query(
          `SELECT um.id_usuario, u.primer_nombre, u.primer_apellido, u.cedula
           FROM usuario_materias um
           JOIN usuarios u ON um.id_usuario = u.id_usuario
           WHERE um.id_materia = ? AND um.id_periodo = ? AND u.rol = 'estudiante'`,
          [materia.id_materia, materia.id_periodo], // AHORA SE FILTRA TAMBIÉN POR id_periodo
          (errEst, estudiantesResult) => {
            materia.estudiantes_info = (errEst || !estudiantesResult) ? [] :
              estudiantesResult.map(e => ({
                  id_usuario: e.id_usuario,
                  nombre_completo: `${e.primer_nombre} ${e.primer_apellido} (${e.cedula})`,
                  id_periodo: materia.id_periodo // Añadir el periodo para claridad en el frontend
              }));

            // Profesores asignados a la materia Y AL PERIODO ESPECÍFICO
            db.query(
              `SELECT um.id_usuario, u.primer_nombre, u.primer_apellido, u.cedula
               FROM usuario_materias um
               JOIN usuarios u ON um.id_usuario = u.id_usuario
               WHERE um.id_materia = ? AND um.id_periodo = ? AND u.rol = 'profesor'`,
              [materia.id_materia, materia.id_periodo], // AHORA SE FILTRA TAMBIÉN POR id_periodo
              (errProf, profesoresResult) => {
                materia.profesores_info = (errProf || !profesoresResult) ? [] :
                  profesoresResult.map(p => ({
                      id_usuario: p.id_usuario,
                      nombre_completo: `${p.primer_nombre} ${p.primer_apellido} (${p.cedula})`,
                      id_periodo: materia.id_periodo // Añadir el periodo para claridad en el frontend
                  }));
                
                // Una vez que ambas consultas anidadas han terminado para esta materia
                pendientes--;
                if (pendientes === 0) {
                  res.json({ materias: results, total: totalCount, totalPages: totalPages, currentPage: page });
                }
              }
            );
          }
        );
      });
    });
  });
});



// Obtener detalles de una materia por ID
router.get('/materias-academicas/:id', /*isAuthenticated,*/ async (req, res) => {
    const { id } = req.params;
    const { id_periodo } = req.query; // Get id_periodo from query parameters

    console.log(`[API] GET /materias-academicas/:id - Materia ID: ${id}, Periodo ID: ${id_periodo}`);

    if (!id_periodo) {
        return res.status(400).json({ error: 'El ID del período es obligatorio para obtener los detalles de la materia.' });
    }

    try {
        // Query para obtener detalles de la materia, curso, periodo y sección para una materia y un periodo específicos
        const materiaQuery = `
            SELECT
                m.id_materia,
                m.materia AS nombre_materia,
                m.activo AS estado,
                m.id_curso,
                c.curso AS nombre_curso,
                mp.id_periodo,
                p.periodo AS nombre_periodo,
                GROUP_CONCAT(DISTINCT s.seccion ORDER BY s.seccion SEPARATOR ', ') AS nombre_seccion
            FROM materias m
            JOIN cursos c ON m.id_curso = c.id_curso
            JOIN materias_periodo mp ON m.id_materia = mp.id_materia AND mp.id_periodo = ?
            LEFT JOIN periodo p ON mp.id_periodo = p.id_periodo
            LEFT JOIN materias_seccion ms ON m.id_materia = ms.id_materia 
            LEFT JOIN seccion s ON ms.id_seccion = s.id_seccion
            WHERE m.id_materia = ?
            GROUP BY m.id_materia, m.materia, m.activo, m.id_curso, c.curso, mp.id_periodo, p.periodo
            LIMIT 1;
        `;
        const materiaRows = await queryPromise(materiaQuery, [id_periodo, id]);

        if (materiaRows.length === 0) {
            console.warn(`[API] No se encontró materia con ID ${id} para el período ${id_periodo}.`);
            return res.status(404).json({ error: 'Materia no encontrada para el período especificado.' });
        }

        const materia = materiaRows[0];
        console.log('[API] Detalles de la materia encontrados:', materia);

        // Obtener estudiantes asignados a esta materia Y PERIODO
        const estudiantesResult = await queryPromise(`
            SELECT um.id_usuario, u.primer_nombre, u.primer_apellido, u.cedula
            FROM usuario_materias um
            JOIN usuarios u ON um.id_usuario = u.id_usuario
            WHERE um.id_materia = ? AND um.id_periodo = ? AND u.rol = 'estudiante';
        `, [id, id_periodo]);
        
        materia.estudiantes_info = estudiantesResult.map(e => ({
            id_usuario: e.id_usuario,
            nombre_completo: `${e.primer_nombre} ${e.primer_apellido} (${e.cedula})`,
            id_periodo: id_periodo // Añadir el periodo para claridad
        }));
        console.log('[API] Estudiantes asignados (profesores_info antes de map):', estudiantesResult);
        console.log('[API] Estudiantes asignados (estudiantes_info después de map):', materia.estudiantes_info);


        // Obtener profesores asignados a esta materia Y PERIODO
        const profesoresResult = await queryPromise(`
            SELECT um.id_usuario, u.primer_nombre, u.primer_apellido, u.cedula
            FROM usuario_materias um
            JOIN usuarios u ON um.id_usuario = u.id_usuario
            WHERE um.id_materia = ? AND um.id_periodo = ? AND u.rol = 'profesor';
        `, [id, id_periodo]);
        
        materia.profesores_info = profesoresResult.map(p => ({
            id_usuario: p.id_usuario,
            nombre_completo: `${p.primer_nombre} ${p.primer_apellido} (${p.cedula})`,
            id_periodo: id_periodo // Añadir el periodo para claridad
        }));
        console.log('[API] Profesores asignados (profesores_info antes de map):', profesoresResult);
        console.log('[API] Profesores asignados (profesores_info después de map):', materia.profesores_info);


        res.json(materia);
    } catch (error) {
        console.error("❌ Error al obtener detalles de la materia:", error);
        res.status(500).json({ error: "Error al obtener detalles de la materia", detalle: error.message });
    }
});


// Crear una nueva materia
router.post('/materias-academicas', registrarAccion('Creación de materia académica', 'materias'), /*isAuthenticated,*/ async (req, res) => {
    const { nombreMateria, id_curso, estudiantes = [], profesores = [] } = req.body;

    if (!nombreMateria || !id_curso) {
        return res.status(400).json({ error: 'Nombre de la materia y Curso asociado son obligatorios.' });
    }

    let connection;
    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        // Insertar la materia
        const [materiaResult] = await connection.query(
            'INSERT INTO materias (id_curso, materia, activo) VALUES (?, ?, 1)',
            [id_curso, nombreMateria]
        );
        const id_materia = materiaResult.insertId;
        req.params.id = id_materia;

        // Sincronizar estudiantes asignados
        if (estudiantes.length > 0) {
            await syncRelationships(connection, 'usuario_materias', 'id_materia', 'id_usuario', id_materia, estudiantes, 'estudiante');
        }

        // Sincronizar profesores asignados
        if (profesores.length > 0) {
            await syncRelationships(connection, 'usuario_materias', 'id_materia', 'id_usuario', id_materia, profesores, 'profesor');
        }

        await connection.commit();
        res.status(201).json({ message: 'Materia creada y asignaciones realizadas exitosamente.', id_materia });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("❌ Error al crear materia:", error);
        res.status(500).json({ error: "Error al crear materia", detalle: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// Actualizar una materia existente
router.put('/materias-academicas/:id', registrarAccion('Actualización de materia académica', 'materias'), /*isAuthenticated,*/ async (req, res) => {
    const { id } = req.params;
    const { materia, id_curso, estudiantes = [], profesores = [] } = req.body;

    if (!materia || !id_curso) {
        return res.status(400).json({ error: 'El nombre de la materia y el curso asociado son obligatorios.' });
    }

    let connection;
    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        // Actualizar la materia
        await connection.query(
            'UPDATE materias SET materia = ?, id_curso = ? WHERE id_materia = ?',
            [materia, id_curso, id]
        );

        // Eliminar todas las asignaciones existentes
        await connection.query('DELETE FROM usuario_materias WHERE id_materia = ?', [id]);

        // Insertar nuevas asignaciones de estudiantes
        if (estudiantes.length > 0) {
            const estudianteValues = estudiantes.map(id_est => [id_est, id]);
            await connection.query(
                'INSERT INTO usuario_materias (id_usuario, id_materia) VALUES ?',
                [estudianteValues]
            );
        }

        // Insertar nuevas asignaciones de profesores
        if (profesores.length > 0) {
            const profesorValues = profesores.map(id_prof => [id_prof, id]);
            await connection.query(
                'INSERT INTO usuario_materias (id_usuario, id_materia) VALUES ?',
                [profesorValues]
            );
        }

        await connection.commit();
        res.json({ message: 'Materia actualizada y asignaciones sincronizadas exitosamente.' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("❌ Error al actualizar materia:", error);
        res.status(500).json({ error: "Error al actualizar materia", detalle: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// Cambiar el estado de una materia (activo/inactivo)
router.put('/materias-academicas/:id/estado', registrarAccion('Cambio de estado de materia académica', 'materias'), /*isAuthenticated,*/ async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body; // 'activo' o 'inactivo'

    if (!estado || (estado !== 'activo' && estado !== 'inactivo')) {
        return res.status(400).json({ error: 'El estado es inválido. Debe ser "activo" o "inactivo".' });
    }

    const activoValue = estado === 'activo' ? 1 : 0;

    try {
        await db.promise().query(
            'UPDATE materias SET activo = ? WHERE id_materia = ?',
            [activoValue, id]
        );
        res.json({ message: `Materia marcada como ${estado} exitosamente.` });
    } catch (error) {
        console.error("❌ Error al cambiar estado de materia:", error);
        res.status(500).json({ error: "Error al cambiar estado de materia", detalle: error.message });
    }
});

// Eliminar una materia
router.delete('/materias-academicas/:id', registrarAccion('Eliminación de materia académica', 'materias'), /*isAuthenticated,*/ async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        // Eliminar relaciones de estudiantes/profesores con esta materia primero
        await connection.query('DELETE FROM usuario_materias WHERE id_materia = ?', [id]);
        
        // Eliminar las actividades asociadas a esta materia
        await connection.query('DELETE FROM actividades WHERE id_materia = ?', [id]);

        // Finalmente, eliminar la materia
        await connection.query('DELETE FROM materias WHERE id_materia = ?', [id]);

        await connection.commit();
        res.json({ message: 'Materia y todas sus asociaciones (usuarios y actividades) eliminadas exitosamente.' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("❌ Error al eliminar materia:", error);
        res.status(500).json({ error: "Error al eliminar materia", detalle: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// Helper function to promisify MySQL queries
const queryPromise = (sql, params) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
};

const beginTransactionPromise = () => {
    return new Promise((resolve, reject) => {
        db.beginTransaction(err => {
            if (err) return reject(err);
            resolve();
        });
    });
};

const commitPromise = () => {
    return new Promise((resolve, reject) => {
        db.commit(err => {
            if (err) return reject(err);
            resolve();
        });
    });
};

const rollbackPromise = () => {
    return new Promise((resolve) => { // Rollback usually doesn't reject, just logs
        db.rollback(() => {
            // No action needed here, just resolve
            resolve();
        });
    });
};

/**
 * @route POST /api/materias-academicas/:id/asignar-estudiantes
 * @description Asigna o reasigna estudiantes a una materia para un periodo específico.
 * Ahora requiere el id_periodo en el cuerpo de la solicitud.
 * Esta versión está adaptada para usar la biblioteca 'mysql2' con una conexión directa.
 * @param {number} req.params.id - ID de la materia.
 * @param {object} req.body - Objeto que contiene el array de id_estudiantes y el id_periodo.
 * @param {Array<number>} req.body.estudiantes - Array de IDs de estudiantes a asignar.
 * @param {number} req.body.id_periodo - ID del periodo al que se asocian las asignaciones (OBLIGATORIO).
 * @returns {json} Mensaje de éxito.
 */
router.post('/materias-academicas/:id/asignar-estudiantes', registrarAccion('Asignación de estudiantes a materia por periodo', 'usuario_materias'), async (req, res) => {
    const { id: idMateria } = req.params;
    const { estudiantes = [], id_periodo } = req.body; // id_periodo ahora se espera en el body

    console.log('[API] POST /materias-academicas/:id/asignar-estudiantes - Raw Body recibido:', JSON.stringify(req.body));
    console.log('[API] idMateria:', idMateria);
    console.log('[API] id_periodo recibido:', id_periodo);


    if (!id_periodo) {
        console.error('[API] Error: id_periodo no proporcionado en el cuerpo de la solicitud.');
        return res.status(400).json({ error: 'El ID del periodo es obligatorio para la asignación de estudiantes.' });
    }

    if (!Array.isArray(estudiantes)) {
        console.error('[API] Error: "estudiantes" no es un array válido.', { estudiantes });
        return res.status(400).json({ error: 'Formato de datos incorrecto. "estudiantes" debe ser un array.' });
    }
    
    try {
        await beginTransactionPromise(); // Start transaction

        // Eliminar Paso 1: Ya no necesitamos consultar id_periodo de la base de datos, lo recibimos del frontend.
        // const periodoResult = await queryPromise('SELECT id_periodo FROM materias_periodo WHERE id_materia = ? LIMIT 1', [idMateria]);
        // if (periodoResult.length === 0) {
        //     console.error('[API] Error: No se encontró un periodo asociado a la materia con ID:', idMateria);
        //     throw new Error('No se encontró un periodo asociado a esta materia para la asignación de estudiantes.');
        // }
        // const id_periodo = periodoResult[0].id_periodo; // Esta línea se elimina
        // console.log(`[API] id_periodo obtenido para materia ${idMateria}: ${id_periodo}`);

        // Paso 2: Obtener los IDs de los usuarios que son estudiantes y están actualmente asignados a esta materia-periodo.
        const currentStudentsResult = await queryPromise(
            `SELECT um.id_usuario 
             FROM usuario_materias um
             JOIN usuarios u ON um.id_usuario = u.id_usuario
             WHERE um.id_materia = ? AND um.id_periodo = ? AND u.rol = 'estudiante'`,
            [idMateria, id_periodo]
        );
        const currentStudentIds = currentStudentsResult.map(row => row.id_usuario);

        // Identificar estudiantes a eliminar (los que están pero no en la nueva lista)
        const studentsToDelete = currentStudentIds.filter(id => !estudiantes.includes(id));
        if (studentsToDelete.length > 0) {
            await queryPromise(
                `DELETE FROM usuario_materias 
                 WHERE id_materia = ? AND id_periodo = ? AND id_usuario IN (?)`,
                [idMateria, id_periodo, studentsToDelete]
            );
            console.log(`[API] Eliminados estudiantes de materia ${idMateria} y periodo ${id_periodo}: ${studentsToDelete.join(', ')}`);
        }

        // Identificar estudiantes a añadir (los que están en la nueva lista pero no en la actual)
        const studentsToAdd = estudiantes.filter(id => !currentStudentIds.includes(id));
        const assignmentsToInsert = [];
        for (const id_usuario of studentsToAdd) {
            if (typeof id_usuario !== 'number' && typeof id_usuario !== 'string' || isNaN(Number(id_usuario))) {
                console.warn(`[API] Advertencia: ID de estudiante inválido encontrado y omitido: ${id_usuario}`);
                continue;
            }
            assignmentsToInsert.push([Number(id_usuario), idMateria, id_periodo]);
            console.log(`[API] Agregando estudiante ID: ${id_usuario}`);
        }

        if (assignmentsToInsert.length > 0) {
            const insertSql = 'INSERT INTO usuario_materias (id_usuario, id_materia, id_periodo) VALUES ?';
            await queryPromise(insertSql, [assignmentsToInsert]);
            console.log(`[API] Insertados ${assignmentsToInsert.length} nuevos estudiantes para materia ${idMateria} y periodo ${id_periodo}.`);
        } else {
            console.log('[API] No hay nuevos estudiantes para asignar.');
        }
        
        await commitPromise(); // Commit transaction
        res.json({ message: 'Asignaciones de estudiantes actualizadas exitosamente.' });

    } catch (error) {
        console.error('❌ ERROR en /materias-academicas/:id/asignar-estudiantes (catch principal):', error);
        await rollbackPromise(); // Rollback on error

        if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_NO_REFERENCED_PARENT_2') {
            res.status(409).json({ error: 'Error de integridad: Uno o más IDs de usuario o materia/periodo no existen.', detalle: error.message });
        } else if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ error: 'Error de duplicado: Alguna asignación ya existe.', detalle: error.message });
        } else { // No se necesita el error de "No se encontró periodo asociado" aquí, ya que el frontend lo envía
            res.status(500).json({ error: 'Error interno del servidor al asignar estudiantes a la materia', detalle: error.message });
        }
    }
});

/**
 * @route POST /api/materias-academicas/:id/asignar-profesor
 * @description Asigna o desasigna un profesor a una materia para un periodo específico.
 * Ahora requiere el id_periodo en el cuerpo de la solicitud.
 * Esta versión está adaptada para usar la biblioteca 'mysql2' con una conexión directa.
 * @param {number} req.params.id - ID de la materia.
 * @param {object} req.body - Objeto que contiene el array de id_profesores y el id_periodo.
 * @param {Array<number>} req.body.profesores - Array de IDs de profesores a asignar (se espera solo uno).
 * @param {number} req.body.id_periodo - ID del periodo al que se asocian las asignaciones (OBLIGATORIO).
 * @returns {json} Mensaje de éxito.
 */
router.post('/materias-academicas/:id/asignar-profesor', registrarAccion('Asignación de profesor a materia por periodo', 'usuario_materias'), async (req, res) => {
    const { id: idMateria } = req.params;
    const { profesores = [], id_periodo } = req.body; // id_periodo ahora se espera en el body

    console.log('[API] POST /materias-academicas/:id/asignar-profesor - Raw Body recibido:', JSON.stringify(req.body));
    console.log('[API] idMateria:', idMateria);
    console.log('[API] id_periodo recibido:', id_periodo);


    if (!id_periodo) {
        console.error('[API] Error: id_periodo no proporcionado en el cuerpo de la solicitud.');
        return res.status(400).json({ error: 'El ID del periodo es obligatorio para la asignación de profesor.' });
    }

    if (!Array.isArray(profesores)) {
        console.error('[API] Error: "profesores" no es un array válido.', { profesores });
        return res.status(400).json({ error: 'Formato de datos incorrecto. "profesores" debe ser un array.' });
    }

    if (profesores.length > 1) {
        console.warn('[API] Advertencia: Se recibieron múltiples profesores, solo se procesará el primero.');
    }
    
    try {
        await beginTransactionPromise(); // Start transaction

        // Eliminar Paso 1: Ya no necesitamos consultar id_periodo de la base de datos, lo recibimos del frontend.
        // const periodoResult = await queryPromise('SELECT id_periodo FROM materias_periodo WHERE id_materia = ? LIMIT 1', [idMateria]);
        // if (periodoResult.length === 0) {
        //     console.error('[API] Error: No se encontró un periodo asociado a la materia con ID:', idMateria);
        //     throw new Error('No se encontró un periodo asociado a esta materia para la asignación de profesor.');
        // }
        // const id_periodo = periodoResult[0].id_periodo; // Esta línea se elimina
        // console.log(`[API] id_periodo obtenido para materia ${idMateria}: ${id_periodo}`);

        // Paso 2: Obtener el profesor actual para ese par materia-periodo.
        const currentProfesorResult = await queryPromise(
            `SELECT um.id_usuario 
             FROM usuario_materias um
             JOIN usuarios u ON um.id_usuario = u.id_usuario
             WHERE um.id_materia = ? AND um.id_periodo = ? AND u.rol = 'profesor' LIMIT 1`,
            [idMateria, id_periodo]
        );
        const currentProfesorId = currentProfesorResult.length > 0 ? currentProfesorResult[0].id_usuario : null;
        const newProfesorId = profesores.length > 0 ? Number(profesores[0]) : null;

        // Si hay un profesor actual y es diferente al nuevo, o si el nuevo es nulo (desasignar)
        if (currentProfesorId !== null && (newProfesorId === null || currentProfesorId !== newProfesorId)) {
            await queryPromise(
                `DELETE FROM usuario_materias 
                 WHERE id_materia = ? AND id_periodo = ? AND id_usuario = ?`,
                [idMateria, id_periodo, currentProfesorId]
            );
            console.log(`[API] Eliminado profesor antiguo de materia ${idMateria} y periodo ${id_periodo}: ${currentProfesorId}.`);
        }

        // Si hay un nuevo profesor y es diferente al actual, o si no había actual
        if (newProfesorId !== null && currentProfesorId !== newProfesorId) {
            if (typeof newProfesorId !== 'number' && typeof newProfesorId !== 'string' || isNaN(Number(newProfesorId))) {
                throw new Error(`ID de profesor inválido: ${newProfesorId}`);
            }
            await queryPromise(
                'INSERT INTO usuario_materias (id_usuario, id_materia, id_periodo) VALUES (?, ?, ?)',
                [Number(newProfesorId), idMateria, id_periodo]
            );
            console.log(`[API] Insertado nuevo profesor para materia ${idMateria} y periodo ${id_periodo}: ${newProfesorId}.`);
        } else if (newProfesorId === currentProfesorId && newProfesorId !== null) {
            console.log(`[API] El profesor ${newProfesorId} ya está asignado a la materia ${idMateria} para el periodo ${id_periodo}. No se realizaron cambios.`);
        }

        await commitPromise(); // Commit transaction
        res.json({ message: 'Asignación de profesor actualizada exitosamente.' });

    } catch (error) {
        console.error('❌ ERROR en /materias-academicas/:id/asignar-profesor (catch principal):', error);
        await rollbackPromise(); // Rollback on error

        if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_NO_REFERENCED_PARENT_2') {
            res.status(409).json({ error: 'Error de integridad: El ID de usuario o materia/periodo no existe.', detalle: error.message });
        } else if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ error: 'Error de duplicado: El profesor ya está asignado a esta materia en este periodo.', detalle: error.message });
        } else { // No se necesita el error de "No se encontró periodo asociado" aquí, ya que el frontend lo envía
            res.status(500).json({ error: 'Error interno del servidor al asignar profesor a la materia', detalle: error.message });
        }
    }
});


export default router;