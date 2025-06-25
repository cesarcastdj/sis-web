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

  let cursosSql = `
    SELECT
        c.id_curso,
        c.curso AS nombre_curso,
        c.activo AS estado,
        p.periodo AS nombre_periodo,
        IFNULL(s.seccion, 'N/A') AS nombre_seccion,
        (
            SELECT COUNT(DISTINCT m.id_materia)
            FROM materias m
            WHERE m.id_curso = c.id_curso
        ) AS total_materias_curso
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

      let pendientes = cursos.length;
      cursos.forEach((curso) => {
        // 1. Usuarios asignados directamente al curso
        db.query(`
          SELECT u.id_usuario, u.primer_nombre, u.primer_apellido, u.cedula, u.rol
          FROM usuario_cursos uc
          JOIN usuarios u ON uc.id_usuario = u.id_usuario
          WHERE uc.id_curso = ?
        `, [curso.id_curso], (err1, directUsers) => {
          if (err1) directUsers = [];
          // 2. Usuarios asignados a materias de este curso
          db.query(`
            SELECT u.id_usuario, u.primer_nombre, u.primer_apellido, u.cedula, u.rol
            FROM usuario_materias um
            JOIN usuarios u ON um.id_usuario = u.id_usuario
            JOIN materias m ON um.id_materia = m.id_materia
            WHERE m.id_curso = ?
          `, [curso.id_curso], (err2, materiaUsers) => {
            if (err2) materiaUsers = [];
            // Unificar y eliminar duplicados por id_usuario
            const allUsers = [...(directUsers || []), ...(materiaUsers || [])];
            const uniqueUsers = {};
            allUsers.forEach(u => {
              uniqueUsers[u.id_usuario] = u;
            });
            const estudiantes_info = Object.values(uniqueUsers).filter(u => u.rol === 'estudiante')
              .map(u => ({
                id_usuario: u.id_usuario,
                nombre_completo: `${u.primer_nombre} ${u.primer_apellido} (${u.cedula})`
              }));
            const profesores_info = Object.values(uniqueUsers).filter(u => u.rol === 'profesor')
              .map(u => ({
                id_usuario: u.id_usuario,
                nombre_completo: `${u.primer_nombre} ${u.primer_apellido} (${u.cedula})`
              }));
            curso.estudiantes_info = estudiantes_info;
            curso.profesores_info = profesores_info;
            pendientes--;
            if (pendientes === 0) {
              res.json({ cursos, totalCount, totalPages, currentPage: parseInt(page) });
            }
          });
        });
      });
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
  const cursoQuery = `
    SELECT
      c.id_curso,
      c.curso AS nombre_curso,
      c.activo AS estado,
      c.id_periodo,
      p.periodo AS nombre_periodo,
      c.id_seccion,
      s.seccion AS nombre_seccion
    FROM cursos c
    LEFT JOIN periodo p ON p.id_periodo = c.id_periodo
    LEFT JOIN cursos_seccion cs ON c.id_curso = cs.id_curso
    LEFT JOIN seccion s ON cs.id_seccion = s.id_seccion
    WHERE c.id_curso = ?;
  `;
  db.query(cursoQuery, [id], (err, cursoRows) => {
    if (err || !cursoRows.length) {
      return res.status(500).json({ error: 'Error al obtener curso o no encontrado.' });
    }
    const curso = cursoRows[0];
    // 1. Estudiantes y profesores asignados directamente al curso
    db.query(`
      SELECT u.id_usuario, u.primer_nombre, u.primer_apellido, u.cedula, u.rol
      FROM usuario_cursos uc
      JOIN usuarios u ON uc.id_usuario = u.id_usuario
      WHERE uc.id_curso = ?
    `, [id], (err1, directUsers) => {
      if (err1) return res.status(500).json({ error: 'Error al obtener usuarios del curso.' });
      // 2. Estudiantes y profesores asignados a materias de este curso
      db.query(`
        SELECT u.id_usuario, u.primer_nombre, u.primer_apellido, u.cedula, u.rol
        FROM usuario_materias um
        JOIN usuarios u ON um.id_usuario = u.id_usuario
        JOIN materias m ON um.id_materia = m.id_materia
        WHERE m.id_curso = ?
      `, [id], (err2, materiaUsers) => {
        if (err2) return res.status(500).json({ error: 'Error al obtener usuarios de materias del curso.' });
        // Unificar y eliminar duplicados por id_usuario
        const allUsers = [...directUsers, ...materiaUsers];
        const uniqueUsers = {};
        allUsers.forEach(u => {
          uniqueUsers[u.id_usuario] = u;
        });
        const estudiantes_info = Object.values(uniqueUsers).filter(u => u.rol === 'estudiante')
          .map(u => ({
            id_usuario: u.id_usuario,
            nombre_completo: `${u.primer_nombre} ${u.primer_apellido} (${u.cedula})`
          }));
        const profesores_info = Object.values(uniqueUsers).filter(u => u.rol === 'profesor')
          .map(u => ({
            id_usuario: u.id_usuario,
            nombre_completo: `${u.primer_nombre} ${u.primer_apellido} (${u.cedula})`
          }));
        // Materias del curso
        db.query(`
          SELECT id_materia, materia AS nombre_materia
          FROM materias
          WHERE id_curso = ?
        `, [id], (err3, materiasResult) => {
          if (err3) return res.status(500).json({ error: 'Error al obtener materias del curso.' });
          curso.estudiantes_info = estudiantes_info;
          curso.profesores_info = profesores_info;
          curso.materias_info = materiasResult.map(m => ({
            id_materia: m.id_materia,
            nombre_materia: m.nombre_materia
          }));
          res.json(curso);
        });
      });
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
router.put('/cursos-academicos/:id', registrarAccion('Actualización de curso académico', 'cursos'), /*isAuthenticated,*/ async (req, res) => {
    const { id } = req.params;
    const { nombre_curso, id_periodo } = req.body;

    try {
        if (!nombre_curso || !id_periodo) {
            return res.status(400).json({ error: 'Nombre del curso y periodo son obligatorios para la actualización.' });
        }

        const updateQuery = `
            UPDATE cursos
            SET curso = ?, id_periodo = ?
            WHERE id_curso = ?;
        `;
        await db.promise().query(updateQuery, [nombre_curso, id_periodo, id]);

        res.json({ message: 'Curso actualizado exitosamente.' });

    } catch (error) {
        console.error("❌ Error al actualizar curso:", error);
        res.status(500).json({ error: "Error al actualizar curso", detalle: error.message });
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
    LEFT JOIN materias_periodo mp ON m.id_materia = mp.id_materia
    LEFT JOIN periodo p ON mp.id_periodo = p.id_periodo
    LEFT JOIN materias_seccion ms ON m.id_materia = ms.id_materia
    LEFT JOIN seccion s ON ms.id_seccion = s.id_seccion
    WHERE m.activo = 1
  `;

  // Consulta para el conteo total de combinaciones materia-periodo
  let countSql = `
    SELECT COUNT(DISTINCT CONCAT(m.id_materia, '-', mp.id_periodo)) AS total
    FROM materias m
    LEFT JOIN materias_periodo mp ON m.id_materia = mp.id_materia
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
    GROUP BY m.id_materia, mp.id_periodo
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
        // Estudiantes asignados a la materia (por id_materia)
        db.query(
          `SELECT um.id_usuario, u.primer_nombre, u.primer_apellido, u.cedula
           FROM usuario_materias um
           JOIN usuarios u ON um.id_usuario = u.id_usuario
           WHERE um.id_materia = ? AND u.rol = 'estudiante'`,
          [materia.id_materia],
          (errEst, estudiantesResult) => {
            materia.estudiantes_info = (errEst || !estudiantesResult) ? [] :
              estudiantesResult.map(e => ({
                id_usuario: e.id_usuario,
                nombre_completo: `${e.primer_nombre} ${e.primer_apellido} (${e.cedula})`
              }));
            // Profesores asignados a la materia (por id_materia)
            db.query(
              `SELECT um.id_usuario, u.primer_nombre, u.primer_apellido, u.cedula
               FROM usuario_materias um
               JOIN usuarios u ON um.id_usuario = u.id_usuario
               WHERE um.id_materia = ? AND u.rol = 'profesor'`,
              [materia.id_materia],
              (errProf, profesoresResult) => {
                materia.profesores_info = (errProf || !profesoresResult) ? [] :
                  profesoresResult.map(p => ({
                    id_usuario: p.id_usuario,
                    nombre_completo: `${p.primer_nombre} ${p.primer_apellido} (${p.cedula})`
                  }));
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
    try {
        const materiaQuery = `
            SELECT
                m.id_materia,
                m.materia AS nombre_materia,
                m.activo AS estado,
                m.id_curso,
                c.curso AS curso,
                p.id_periodo,
                p.periodo AS nombre_periodo,
                s.id_seccion,
                s.seccion AS nombre_seccion
            FROM materias m
            JOIN cursos c ON m.id_curso = c.id_curso
            LEFT JOIN periodo p ON p.id_periodo = p.id_periodo
            LEFT JOIN seccion s ON s.id_seccion = s.id_seccion
            WHERE m.id_materia = ?;
        `;
        const [materiaRows] = await db.promise().query(materiaQuery, [id]);

        if (materiaRows.length === 0) {
            return res.status(404).json({ error: 'Materia no encontrada.' });
        }

        const materia = materiaRows[0];

        // Obtener estudiantes asignados a esta materia
        const [estudiantesResult] = await db.promise().query(`
            SELECT um.id_usuario, u.primer_nombre, u.primer_apellido, u.cedula
            FROM usuario_materias um
            JOIN usuarios u ON um.id_usuario = u.id_usuario
            WHERE um.id_materia = ? AND u.rol = 'estudiante';
        `, [id]);
        materia.estudiantes_info = estudiantesResult.map(e => ({
            id_usuario: e.id_usuario,
            nombre_completo: `${e.primer_nombre} ${e.primer_apellido} (${e.cedula})`
        }));

        // Obtener profesores asignados a esta materia
        const [profesoresResult] = await db.promise().query(`
            SELECT um.id_usuario, u.primer_nombre, u.primer_apellido, u.cedula
            FROM usuario_materias um
            JOIN usuarios u ON um.id_usuario = u.id_usuario
            WHERE um.id_materia = ? AND u.rol = 'profesor';
        `, [id]);
        materia.profesores_info = profesoresResult.map(p => ({
            id_usuario: p.id_usuario,
            nombre_completo: `${p.primer_nombre} ${p.primer_apellido} (${p.cedula})`
        }));

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

// Agregar estudiantes y profesor a una materia (sin eliminar los existentes) - versión conexión única
router.post('/materias-academicas/:id/asignar', registrarAccion('Asignación de usuarios a materia', 'usuario_materias'), (req, res) => {
  const { id: idMateria } = req.params;
  const { estudiantes = [], profesores = [] } = req.body;
  console.log('[API] POST /materias-academicas/:id/asignar - Recibido:', { idMateria, estudiantes, profesores });

  if (!Array.isArray(estudiantes) || !Array.isArray(profesores)) {
      return res.status(400).json({ error: 'Formato de datos incorrecto. Se esperan arrays para estudiantes y profesores.' });
  }

  db.beginTransaction((txErr) => {
      if (txErr) {
          console.error('[API] Error al iniciar transacción:', txErr);
          return res.status(500).json({ error: 'Error al iniciar transacción.', detalle: txErr.message });
      }

      // Paso 1: Eliminar asignaciones existentes para esta materia
      // Esto es crucial para que la asignación sea "establecer" y no "añadir"
      const deleteSql = 'DELETE FROM usuario_materias WHERE id_materia = ?';
      db.query(deleteSql, [idMateria], (deleteErr, deleteResult) => {
          if (deleteErr) {
              return db.rollback(() => {
                  console.error('[API] Error al eliminar asignaciones existentes:', deleteErr);
                  res.status(500).json({ error: 'Error al eliminar asignaciones existentes.', detalle: deleteErr.message });
              });
          }
          console.log(`[API] Eliminadas asignaciones existentes para materia ${idMateria}. Filas afectadas: ${deleteResult.affectedRows}`);

          // Paso 2: Insertar nuevos estudiantes
          if (estudiantes.length > 0) {
              const estudianteValues = estudiantes.map(id_usuario => [id_usuario, idMateria]);
              const insertEstudiantesSql = 'INSERT INTO usuario_materias (id_usuario, id_materia) VALUES ?';
              db.query(insertEstudiantesSql, [estudianteValues], (insertEstErr, insertEstResult) => {
                  if (insertEstErr) {
                      return db.rollback(() => {
                          console.error('[API] Error al insertar estudiantes:', insertEstErr);
                          res.status(500).json({ error: 'Error al insertar estudiantes.', detalle: insertEstErr.message });
                      });
                  }
                  console.log(`[API] Asignados ${insertEstResult.affectedRows} estudiantes a materia ${idMateria}`);
                  
                  // Paso 3: Insertar nuevo profesor (si hay uno)
                  // Asumimos que solo un profesor puede ser asignado por materia.
                  handleProfessorAssignment(idMateria, profesores, res, txErr);
              });
          } else {
              console.log(`[API] No hay estudiantes para asignar a materia ${idMateria}`);
              // Si no hay estudiantes, proceder directamente a manejar el profesor
              handleProfessorAssignment(idMateria, profesores, res, txErr);
          }
      });
  });

  function handleProfessorAssignment(idMateria, profesores, res, txErr) {
      if (profesores.length > 0) {
          const id_profesor = profesores[0]; // Solo tomamos el primer profesor si hay varios
          const insertProfesorSql = 'INSERT INTO usuario_materias (id_usuario, id_materia) VALUES (?, ?)';
          db.query(insertProfesorSql, [id_profesor, idMateria], (insertProfErr, insertProfResult) => {
              if (insertProfErr) {
                  return db.rollback(() => {
                      console.error('[API] Error al insertar profesor:', insertProfErr);
                      res.status(500).json({ error: 'Error al insertar profesor.', detalle: insertProfErr.message });
                  });
              }
              console.log(`[API] Asignado profesor ${id_profesor} a materia ${idMateria}`);
              finalizeTransaction(res, txErr);
          });
      } else {
          console.log(`[API] No hay profesor para asignar a materia ${idMateria} (o se ha desasignado)`);
          finalizeTransaction(res, txErr);
      }
  }

  function finalizeTransaction(res, txErr) {
      db.commit((commitErr) => {
          if (commitErr) {
              return db.rollback(() => {
                  console.error('[API] Error al hacer commit:', commitErr);
                  res.status(500).json({ error: 'Error al guardar asignaciones', detalle: commitErr.message });
              });
          }
          res.json({ message: 'Asignaciones actualizadas exitosamente.' });
      });
  }
});

export default router;