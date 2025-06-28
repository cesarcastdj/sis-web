import express from 'express';
import db from '../db/db.js'; // Ajusta esta ruta si es necesario
import { isAuthenticated } from '../middleware/protegerRutas.js'; // Ajusta esta ruta si es necesario (comentado para pruebas)
import { registrarAccion } from '../middleware/historial.js'; // Ajusta esta ruta si es necesario
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
          'SELECT COUNT(*) AS total FROM notas WHERE id_estudiante = ?',
          [id_usuario]
      );
      const totalCount = totalNotasResult[0].total;
      const totalPages = Math.ceil(totalCount / limit);

      // Consulta principal mejorada para obtener los detalles de manera más precisa
      const notasQuery = `
          SELECT
              n.id_nota,
              n.nota,
              n.fecha_registro,
              u.primer_nombre AS nombre_estudiante,
              u.primer_apellido AS apellido_estudiante,
              m.materia AS nombre_materia,
              c.curso AS nombre_curso,
              p.periodo AS nombre_periodo,
              a.nombre_actividad,
              a.descripcion AS descripcion_actividad,
              a.id_periodo AS id_periodo_actividad
          FROM notas n
          JOIN usuarios u ON n.id_estudiante = u.id_usuario
          JOIN actividades a ON n.id_actividad = a.id_actividad
          JOIN materias m ON a.id_materia = m.id_materia
          LEFT JOIN cursos_materias cm ON m.id_materia = cm.id_materia AND n.id_estudiante = cm.id_estudiante
          LEFT JOIN cursos c ON cm.id_curso = c.id_curso
          LEFT JOIN periodo p ON cm.id_periodo = p.id_periodo
          WHERE n.id_estudiante = ?
          GROUP BY n.id_nota
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
// FIX: Se cambió la ruta para que sea única y coincida con la descripción.
router.get('/notas/materia/:id_materia/usuario/:id_usuario', /*isAuthenticated,*/ async (req, res) => {
  const { id_materia, id_usuario } = req.params; // Obtener id_materia también
  const page = parseInt(req.query.page || '1');
  const limit = parseInt(req.query.limit || '10');
  const offset = (page - 1) * limit;

  try {
      // Consulta para el conteo total de notas del usuario para esa materia
      const [totalNotasResult] = await db.promise().query(
          'SELECT COUNT(*) AS total FROM notas n JOIN actividades a ON n.id_actividad = a.id_actividad WHERE n.id_estudiante = ? AND a.id_materia = ?',
          [id_usuario, id_materia]
      );
      const totalCount = totalNotasResult[0].total;
      const totalPages = Math.ceil(totalCount / limit);

      // Consulta principal para obtener las notas con sus detalles
      const notasQuery = `
          SELECT
              n.id_nota,
              n.nota,
              n.id_estudiante,
              n.fecha_registro,
              u.primer_nombre AS nombre_estudiante,
              u.primer_apellido AS apellido_estudiante,
              m.materia AS nombre_materia,
              c.curso AS nombre_curso,
              p.periodo AS nombre_periodo,
              a.nombre_actividad,
              a.descripcion AS descripcion_actividad,
              a.id_periodo AS id_periodo_actividad
          FROM notas n
          JOIN usuarios u ON n.id_estudiante = u.id_usuario
          JOIN actividades a ON n.id_actividad = a.id_actividad
          JOIN materias m ON a.id_materia = m.id_materia
          LEFT JOIN cursos_materias cm ON m.id_materia = cm.id_materia
          LEFT JOIN cursos c ON cm.id_curso = c.id_curso
          LEFT JOIN periodo p ON cm.id_periodo = p.id_periodo
          WHERE n.id_estudiante = ? AND m.id_materia = ?
          GROUP BY n.id_nota
          ORDER BY n.fecha_registro DESC
          LIMIT ?, ?;
      `;
      const [notas] = await db.promise().query(notasQuery, [id_usuario, id_materia, offset, limit]);

      res.json({
          notas,
          totalCount,
          totalPages,
          currentPage: page
      });

  } catch (error) {
      console.error("❌ Error al obtener notas del usuario para la materia:", error);
      res.status(500).json({ error: "Error al obtener notas del usuario para la materia", detalle: error.message });
  }
});
/**
 * @route GET /api/notas/:id_nota
 * @description Obtiene los detalles de una nota específica por su ID, incluyendo detalles de curso, periodo y sección.
 * @param {number} req.params.id_nota - ID de la nota.
 * @returns {json} Detalles de la nota.
 */
router.get('/notas/:id_nota', /*isAuthenticated,*/ async (req, res) => {
  const { id_nota } = req.params;

  if (!id_nota) {
      return res.status(400).json({ error: 'ID de nota no proporcionado.' });
  }

  try {
      // FIX: Consulta SQL reescrita para que coincida con la estructura real de la BD.
      // Utiliza LEFT JOINs para evitar errores si faltan datos de contexto.
      const notaQuery = `
          SELECT
              n.id_nota,
              n.nota,
              n.fecha_registro,
              (SELECT com.mensaje FROM comentarios com WHERE com.id_estudiante = u.id_usuario ORDER BY com.fecha_hora DESC LIMIT 1) AS comentarios,
              u.id_usuario,
              u.cedula,
              u.primer_nombre AS nombre_estudiante,
              u.primer_apellido AS apellido_estudiante,
              a.id_actividad,
              a.nombre_actividad,
              a.descripcion AS descripcion_actividad,
              a.id_periodo AS id_periodo_actividad, -- Incluir id_periodo de actividades
              m.id_materia,
              m.materia AS nombre_materia,
              c.id_curso,
              c.curso AS nombre_curso,
              p.id_periodo,
              p.periodo AS nombre_periodo,
              sec.id_seccion,
              sec.seccion AS nombre_seccion
          FROM notas AS n
          JOIN usuarios AS u ON n.id_estudiante = u.id_usuario
          JOIN actividades AS a ON n.id_actividad = a.id_actividad
          JOIN materias AS m ON a.id_materia = m.id_materia
          LEFT JOIN cursos AS c ON m.id_curso = c.id_curso
          LEFT JOIN cursos_materias AS cm ON n.id_estudiante = cm.id_estudiante AND m.id_materia = cm.id_materia -- Unir con cursos_materias para obtener el periodo
          LEFT JOIN periodo AS p ON cm.id_periodo = p.id_periodo
          LEFT JOIN matricula AS mat ON u.id_usuario = mat.id_estudiante AND cm.id_periodo = mat.id_periodo
          LEFT JOIN seccion AS sec ON mat.id_seccion = sec.id_seccion
          WHERE n.id_nota = ?
          GROUP BY n.id_nota;
      `;
      const [notaRows] = await db.promise().query(notaQuery, [id_nota]);

      if (notaRows.length === 0) {
          return res.status(404).json({ error: 'Nota no encontrada.' });
      }
      
      // El frontend espera un objeto 'nota' que contenga los detalles
      res.json({ nota: notaRows[0] });

  } catch (error) {
      console.error("❌ Error al obtener nota por ID:", error);
      res.status(500).json({ error: "Error interno del servidor al obtener la nota", detalle: error.message });
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
 * @param {number} req.body.id_periodo - ID del periodo asociado a la actividad (NUEVO).
 * @returns {json} Mensaje de éxito e ID de la nueva nota.
 */
router.post('/notas', isAuthenticated, registrarAccion('Registro de Nota Individual', 'notas'),(req, res) => {
    try {
        console.log('********* LLEGÓ PETICIÓN A /notas (individual) *********');
        console.log('BODY RECIBIDO:', JSON.stringify(req.body));
        
        const { id_estudiante, id_actividad, nota, fecha_registro, comentarios = null, id_periodo } = req.body; // id_periodo añadido

        // Obtener el ID del usuario remitente de la sesión (profesor/admin que registra la nota)
        const id_usuario_remitente = req.session.usuario?.id;
        console.log('DEBUG: ID del usuario remitente desde la sesión:', id_usuario_remitente);

        if (!id_usuario_remitente) {
            console.error("Error: ID del usuario remitente no encontrado en la sesión o inválido. No se pueden guardar notas/comentarios.");
            return res.status(401).json({ error: "No autorizado: ID del usuario remitente no disponible. Por favor, inicia sesión de nuevo." });
        }

        if (!id_estudiante || !id_actividad || nota === null || nota === undefined || nota === '') {
            console.log('❌ Campos obligatorios de nota faltantes.');
            return res.status(400).json({ error: 'ID de estudiante, actividad y nota son obligatorios.' });
        }
        
        if (!id_periodo) { // Validación para el nuevo campo
            console.log('❌ id_periodo es obligatorio.');
            return res.status(400).json({ error: 'El ID del periodo es obligatorio para registrar la nota.' });
        }

        const notaValor = parseFloat(nota);
        if (isNaN(notaValor) || notaValor < 0 || notaValor > 20) {
            console.log('❌ Nota inválida: debe ser un número entre 0 y 20.');
            return res.status(400).json({ error: 'La nota debe ser un número entre 0 y 20.' });
        }

        const fechaFinal = fecha_registro ? new Date(fecha_registro).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');
        const comentarioMensaje = comentarios && comentarios.trim() !== '' ? comentarios.trim() : null;

        // Determinar si usar pool (con transacciones) o conexión directa
        const usePool = typeof db.getConnection === 'function';
        const executeQuery = (conn, sql, params, callback) => {
            conn.query(sql, params, callback);
        };

        const handleNoteOperation = (conn) => {
            // Paso 1: Verificar si el estudiante existe en la tabla `estudiantes`
            executeQuery(conn, 'SELECT id_estudiante FROM estudiantes WHERE id_estudiante = ?', [id_estudiante], (err, estudianteExiste) => {
                if (err) {
                    console.error('Error al verificar estudiante (POST /notas):', err);
                    return sendResponse(conn, false, 'Error al verificar la existencia del estudiante.', err);
                }

                const afterStudentCheck = () => {
                    // Paso 2: Verificar si la nota ya existe para esta actividad y estudiante
                    executeQuery(conn, 'SELECT id_nota FROM notas WHERE id_actividad = ? AND id_estudiante = ?', [id_actividad, id_estudiante], (err, existeNota) => {
                        if (err) {
                            console.error('Error al verificar nota existente (POST /notas):', err);
                            return sendResponse(conn, false, 'Error al verificar la nota existente.', err);
                        }

                        const afterNoteAndCommentOperation = (noteError, commentError) => {
                            if (noteError || commentError) {
                                console.error('Errores en operaciones:', noteError, commentError);
                                return sendResponse(conn, false, 'Error al registrar/actualizar la nota o el comentario.', noteError || commentError);
                            }
                            sendResponse(conn, true, 'Nota y comentario registrados/actualizados correctamente.');
                        };

                        let noteOperationDone = false;
                        let commentOperationDone = false;
                        let noteError = null;
                        let commentError = null;

                        const checkCompletion = () => {
                            if (noteOperationDone && (commentOperationDone || comentarioMensaje === null)) { // Comment operation is done if no message
                                afterNoteAndCommentOperation(noteError, commentError);
                            }
                        };

                        if (existeNota.length > 0) {
                            // Actualizar nota existente
                            executeQuery(conn, 'UPDATE notas SET nota = ?, fecha_registro = ? WHERE id_nota = ?',
                                [notaValor, fechaFinal, existeNota[0].id_nota],
                                (err) => {
                                    if (err) {
                                        console.error('Error al actualizar nota (UPDATE /notas):', err);
                                        noteError = err;
                                    }
                                    noteOperationDone = true;
                                    checkCompletion();
                                });
                        } else {
                            // Insertar nueva nota
                            // Se asume que id_periodo se almacena en la tabla actividades y se relaciona a través de id_actividad
                            executeQuery(conn, 'INSERT INTO notas (id_actividad, id_estudiante, nota, fecha_registro) VALUES (?, ?, ?, ?)',
                                [id_actividad, id_estudiante, notaValor, fechaFinal],
                                (err) => {
                                    if (err) {
                                        console.error('Error al insertar nota (INSERT /notas):', err);
                                        noteError = err;
                                    }
                                    noteOperationDone = true;
                                    checkCompletion();
                                });
                        }

                        // Manejo del comentario (siempre después de la nota, pero puede ser una operación separada)
                        if (comentarioMensaje) {
                            // Verificar si ya existe un comentario para esta combinación de actividad y estudiante por el remitente
                            executeQuery(conn, 'SELECT id_comentario FROM comentarios WHERE id_estudiante = ? AND id_actividad = ? AND id_usuario = ?',
                                [id_estudiante, id_actividad, id_usuario_remitente],
                                (err, existeComentario) => {
                                    if (err) {
                                        console.error('Error al verificar comentario existente (POST /notas):', err);
                                        commentError = err;
                                        commentOperationDone = true;
                                        checkCompletion();
                                        return;
                                    }

                                    if (existeComentario.length > 0) {
                                        // Actualizar comentario existente
                                        executeQuery(conn, 'UPDATE comentarios SET mensaje = ?, fecha_hora = ? WHERE id_comentario = ?',
                                            [comentarioMensaje, fechaFinal, existeComentario[0].id_comentario],
                                            (err) => {
                                                if (err) {
                                                    console.error('Error al actualizar comentario (UPDATE /notas):', err);
                                                    commentError = err;
                                                }
                                                commentOperationDone = true;
                                                checkCompletion();
                                            });
                                    } else {
                                        // Insertar nuevo comentario
                                        executeQuery(conn, 'INSERT INTO comentarios (id_estudiante, id_actividad, id_usuario, mensaje, fecha_hora) VALUES (?, ?, ?, ?, ?)',
                                            [id_estudiante, id_actividad, id_usuario_remitente, comentarioMensaje, fechaFinal],
                                            (err) => {
                                                if (err) {
                                                    console.error('Error al insertar comentario (INSERT /notas):', err);
                                                    commentError = err;
                                                }
                                                commentOperationDone = true;
                                                checkCompletion();
                                            });
                                    }
                                });
                        } else {
                            // No hay comentario para guardar, así que esta "operación" está "hecha"
                            commentOperationDone = true;
                            checkCompletion();
                        }
                    });
                };

                if (estudianteExiste.length === 0) {
                    // Si el estudiante no existe en la tabla `estudiantes`, insertarlo
                    executeQuery(conn, 'INSERT INTO estudiantes (id_estudiante, id_usuario) VALUES (?, ?)', [id_estudiante, id_estudiante], (err) => {
                        if (err) {
                            console.error('Error al insertar estudiante en tabla estudiantes (POST /notas):', err);
                            return sendResponse(conn, false, 'Error al asegurar la existencia del estudiante.', err);
                        }
                        afterStudentCheck();
                    });
                } else {
                    afterStudentCheck();
                }
            });
        };

        const sendResponse = (conn, success, message, error = null) => {
            if (usePool) {
                if (success) {
                    conn.commit(err => {
                        conn.release();
                        if (err) {
                            console.error('Error al confirmar transacción:', err);
                            return res.status(500).json({ error: 'Error al confirmar transacción', detalle: err.message });
                        }
                        console.log(`✅ ${message}`);
                        res.json({ message: message });
                    });
                } else {
                    conn.rollback(() => {
                        conn.release();
                        console.error('Rollback de transacción. Error:', error);
                        res.status(500).json({ error: message, detalle: error?.message || 'Error desconocido' });
                    });
                }
            } else {
                // Sin transacciones para conexión directa
                if (success) {
                    console.log(`✅ ${message}`);
                    res.json({ message: message });
                } else {
                    console.error(`❌ ${message}. Error:`, error);
                    res.status(500).json({ error: message, detalle: error?.message || 'Error desconocido' });
                }
            }
        };

        if (usePool) {
            db.getConnection((err, conn) => {
                if (err) {
                    console.error('Error obteniendo conexión del pool (POST /notas):', err);
                    return res.status(500).json({ error: 'Error de conexión a la base de datos', detalle: err.message });
                }
                conn.beginTransaction(err => {
                    if (err) {
                        conn.release();
                        console.error('Error iniciando transacción (POST /notas):', err);
                        return res.status(500).json({ error: 'Error iniciando transacción', detalle: err.message });
                    }
                    handleNoteOperation(conn);
                });
            });
        } else {
            // Usar la conexión directa 'db'
            handleNoteOperation(db);
        }

    } catch (error) {
        console.error('❌ ERROR NO CAPTURADO EN /notas (individual):', error);
        res.status(500).json({ error: 'Error inesperado en el endpoint', detalle: error.message });
    }
});
/**
 * @route PUT /api/notas/:id_nota
 * @description Actualiza una nota existente.
 * @param {number} req.params.id_nota - ID de la nota a actualizar.
 * @param {object} req.body - Objeto con los campos a actualizar (nota, comentarios, id_actividad, etc.).
 * @returns {json} Mensaje de éxito.
 */
router.put('/notas/:id_nota', registrarAccion('Actualizacion nota', 'notas'), /*isAuthenticated,*/ async (req, res) => {
  const { id_nota } = req.params;
  const { nota, id_actividad, comentarios, fecha_registro } = req.body; 

  try {
      let updateFields = {};
      if (nota !== undefined) updateFields.nota = nota;
      if (id_actividad !== undefined) updateFields.id_actividad = id_actividad; 
      if (comentarios !== undefined) updateFields.comentarios = comentarios;
      if (fecha_registro !== undefined) updateFields.fecha_registro = new Date(fecha_registro).toISOString().slice(0, 10);

      if (Object.keys(updateFields).length === 0) {
          return res.status(400).json({ error: "No hay campos para actualizar." });
      }

      const updateQuery = 'UPDATE notas SET ? WHERE id_nota = ?';
      const [result] = await db.promise().query(updateQuery, [updateFields, id_nota]);

      if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Nota no encontrada para actualizar.' });
      }

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
router.delete('/notas/:id_nota', registrarAccion('Eliminacion nota', 'notas'), /*isAuthenticated,*/ async (req, res) => {
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
                a.id_actividad,
                a.nombre_actividad,
                a.descripcion,
                a.fecha_creacion,
                a.id_materia,
                a.id_periodo -- Incluido id_periodo
            FROM actividades a
            WHERE a.id_materia = ?
            ORDER BY a.fecha_creacion DESC;
        `;
        const [actividades] = await db.promise().query(actividadesQuery, [id_materia]);

        // FIX: Envolver el array de actividades en un objeto con la propiedad 'actividades'
        res.json({ actividades: actividades });

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
                id_materia,
                id_periodo -- Incluido id_periodo
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
 * @param {number} req.body.ponderacion - Ponderación de la actividad.
 * @param {number} req.body.id_periodo - ID del periodo asociado a la actividad (NUEVO).
 * @returns {json} Mensaje de éxito e ID de la nueva actividad.
 */
router.post('/actividades', registrarAccion('Creacion actividad', 'actividades'), /*isAuthenticated,*/ async (req, res) => {
    const { nombre_actividad, descripcion = null, fecha_creacion, id_materia, ponderacion, id_periodo } = req.body;

    try {
        // Validar que id_periodo esté presente
        if (!nombre_actividad || !fecha_creacion || !id_materia || id_periodo === undefined || id_periodo === null) {
            console.error('Validation Error: Missing required fields for activity creation (nombre_actividad, fecha_creacion, id_materia, id_periodo).', req.body);
            return res.status(400).json({ error: 'Nombre de actividad, fecha de creación, ID de materia y ID de periodo son obligatorios.' });
        }

        const formattedFechaCreacion = new Date(fecha_creacion).toISOString().slice(0, 10);

        const insertActividadQuery = `
            INSERT INTO actividades (nombre_actividad, descripcion, fecha_creacion, id_materia, ponderacion, id_periodo)
            VALUES (?, ?, ?, ?, ?, ?);
        `;
        const [result] = await db.promise().query(
            insertActividadQuery,
            [nombre_actividad, descripcion, formattedFechaCreacion, id_materia, ponderacion, id_periodo]
        );
        const nuevaActividadId = result.insertId;
        req.params.id = nuevaActividadId; // Para el middleware de historial

        res.status(201).json({ message: 'Actividad creada exitosamente.', id: nuevaActividadId });

    } catch (error) {
        console.error("❌ Error al crear actividad:", error);
        res.status(500).json({ error: "Error al crear actividad", detalle: error.message });
    }
});

/**
 * @route PUT /api/actividades/:id_actividad
 * @description Actualiza una actividad existente.
 * Ahora permite actualizar el id_periodo si es necesario, y lo espera en el cuerpo de la solicitud.
 * @param {number} req.params.id_actividad - ID de la actividad a actualizar.
 * @param {object} req.body - Objeto con los campos a actualizar (nombre_actividad, descripcion, fecha_creacion, id_materia, ponderacion, id_periodo).
 * @returns {json} Mensaje de éxito.
 */
router.put('/actividades/:id_actividad', registrarAccion('Actualizacion actividad', 'actividades'), /*isAuthenticated,*/ async (req, res) => {
    const { id_actividad } = req.params;
    const { nombre_actividad, descripcion, fecha_creacion, id_materia, ponderacion, id_periodo } = req.body; // id_periodo añadido

    try {
        let updateFields = {};
        let queryParams = [];

        if (nombre_actividad !== undefined) {
            updateFields.nombre_actividad = nombre_actividad;
        }
        if (descripcion !== undefined) {
            updateFields.descripcion = descripcion;
        }
        if (fecha_creacion !== undefined) {
            updateFields.fecha_creacion = new Date(fecha_creacion).toISOString().slice(0, 10);
        }
        if (id_materia !== undefined) {
            updateFields.id_materia = id_materia;
        }
        if (ponderacion !== undefined) {
            updateFields.ponderacion = ponderacion;
        }
        // Incluir id_periodo en los campos a actualizar si viene en el body
        if (id_periodo !== undefined) {
            updateFields.id_periodo = id_periodo;
        }

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ error: "No hay campos para actualizar." });
        }

        // Construir la parte SET dinámicamente
        const setClauses = Object.keys(updateFields).map(key => `${key} = ?`).join(', ');
        queryParams = Object.values(updateFields);

        queryParams.push(id_actividad); // El último parámetro es el ID para el WHERE

        const updateQuery = `UPDATE actividades SET ${setClauses} WHERE id_actividad = ?`;
        await db.promise().query(updateQuery, queryParams);

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
router.delete('/actividades/:id_actividad', registrarAccion('Eliminacion actividad', 'actividades'), /*isAuthenticated,*/ async (req, res) => {
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
router.get('/estudiante/notas', /*isAuthenticated,*/ async (req, res) => { // FIX: Comentado isAuthenticated para pruebas
    try {
        console.log('Sesión actual:', req.session);
        console.log('Usuario en sesión:', req.session.usuario);
        
        // Obtener el ID del usuario de la sesión (ahora usando 'id' en lugar de 'id_usuario')
        // Si no se desea autenticación, esta línea podría necesitar ser reemplazada por un ID de prueba o manejarse de otra forma
        const id_usuario = req.session.usuario ? req.session.usuario.id : null; // FIX: Manejar caso donde req.session.usuario es undefined

        console.log('ID de usuario extraído:', id_usuario);

        if (!id_usuario) {
            return res.status(400).json({
                error: "Usuario no identificado",
                mensaje: "No se pudo identificar al usuario. Asegúrate de que la sesión esté configurada o proporciona un ID de usuario de prueba si la autenticación está deshabilitada.", // FIX: Mensaje más informativo
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
            LEFT JOIN actividades a ON n.id_actividad = a.id_actividad AND a.id_periodo = p.id_periodo -- Asegurar que la actividad sea del mismo periodo
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
    // Buscar materias activas asociadas a un curso y periodo, igual que actividades
    const query = `
      SELECT m.id_materia, m.materia AS nombre_materia
      FROM materias m
      JOIN materias_periodo mp ON m.id_materia = mp.id_materia
      JOIN cursos_periodo cp ON cp.id_curso = m.id_curso AND cp.id_periodo = mp.id_periodo
      WHERE cp.id_curso = ? AND cp.id_periodo = ? AND m.activo = 1
    `;
    const [materias] = await db.promise().query(query, [curso, periodo]);
    res.json(materias);
  } catch (error) {
    console.error('Error al obtener materias filtradas:', error);
    res.status(500).json({ error: 'Error al obtener materias filtradas', detalle: error.message });
  }
});

// Obtener estudiantes de una materia
router.get('/materias/:id_materia/estudiantes', async (req, res) => {
  const { id_materia } = req.params;
  const { id_periodo } = req.query; // Esperar id_periodo como query param

  if (!id_periodo) {
      return res.status(400).json({ error: 'Debes especificar el ID del periodo.' });
  }

  try {
    const query = `
      SELECT u.id_usuario, u.primer_nombre, u.primer_apellido, u.cedula
      FROM usuarios u
      JOIN usuario_materias um ON u.id_usuario = um.id_usuario
      WHERE um.id_materia = ? AND um.id_periodo = ? AND u.rol = 'estudiante' -- Filtrar por id_periodo
      ORDER BY u.primer_apellido, u.primer_nombre;
    `;
    const [estudiantes] = await db.promise().query(query, [id_materia, id_periodo]);
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
router.post('/notas/actividad/:id_actividad', registrarAccion('Registro de notas por lote', 'notas'), (req, res) => { 
  try {
    console.log('********* LLEGÓ PETICIÓN A /notas/actividad/:id_actividad *********');
    console.log('BODY RECIBIDO:', JSON.stringify(req.body));
    const { id_actividad } = req.params;
    let { notas, id_periodo } = req.body; // id_periodo añadido aquí

    // Get the sender's user ID from the session (Ahora obtenemos directamente de req.session.usuario)
    const id_usuario_remitente = req.session.usuario?.id;
    console.log('DEBUG: ID del usuario remitente desde la sesión:', id_usuario_remitente);

    if (!id_usuario_remitente) {
      console.error("Error: ID del usuario remitente no encontrado en la sesión o inválido. No se pueden guardar comentarios.");
      return res.status(401).json({ error: "No autorizado: ID del usuario remitente no disponible. Por favor, inicia sesión de nuevo." });
    }

    if (!Array.isArray(notas) || notas.length === 0) {
      console.log('❌ Array de notas vacío o no enviado');
      return res.status(400).json({ error: 'Debes enviar un array de notas.' });
    }
    
    if (!id_periodo) { // Validación para el nuevo campo
        console.log('❌ id_periodo es obligatorio para el registro de notas por actividad.');
        return res.status(400).json({ error: 'El ID del periodo es obligatorio para registrar las notas por actividad.' });
    }

    notas = notas.filter(n => n.id_estudiante && n.nota !== null && n.nota !== undefined && n.nota !== '' && !isNaN(Number(n.nota)));
    if (notas.length === 0) {
      console.log('❌ No hay notas válidas para guardar');
      return res.status(400).json({ error: 'No hay notas válidas para guardar.' });
    }
    // Usar db como pool clásico si no existe getConnection
    const pool = db.getConnection ? db : db;
    if (!db.getConnection) {
      // Sin transacciones, solo inserciones/actualizaciones simples
      let errores = [];
      let procesados = 0;
      notas.forEach(n => {
        pool.query('SELECT id_nota FROM notas WHERE id_actividad = ? AND id_estudiante = ?', [id_actividad, n.id_estudiante], (err, existe) => {
          if (err) { console.error('Error en SELECT:', err); errores.push(err); procesados++; if (procesados === notas.length) finalizar(); return; }
          // Verificar si el estudiante existe
          pool.query('SELECT id_estudiante FROM estudiantes WHERE id_estudiante = ?', [n.id_estudiante], (err, estudianteExiste) => {
            if (err) { console.error('Error verificando estudiante:', err); errores.push(err); procesados++; if (procesados === notas.length) finalizar(); return; }
            if (estudianteExiste.length === 0) {
              // Buscar el id_usuario correspondiente
              pool.query('SELECT id_usuario FROM usuarios WHERE id_usuario = ?', [n.id_estudiante], (err, usuarioRows) => {
                if (err) { console.error('Error buscando usuario:', err); errores.push(err); procesados++; if (procesados === notas.length) finalizar(); return; }
                if (usuarioRows.length === 0) {
                  console.error('No existe el usuario para el id_estudiante:', n.id_estudiante);
                  errores.push(new Error('No existe el usuario para el id_estudiante: ' + n.id_estudiante));
                  procesados++;
                  if (procesados === notas.length) finalizar();
                  return;
                }
                // Insertar estudiante con ambos campos
                pool.query('INSERT INTO estudiantes (id_estudiante, id_usuario) VALUES (?, ?)', [n.id_estudiante, n.id_estudiante], (err) => {
                  if (err) { console.error('Error insertando estudiante:', err); procesados++; if (procesados === notas.length) finalizar(); return; }
                  // Continuar con la lógica de notas después de insertar estudiante
                  insertarActualizarNota();
                });
              });
            } else {
              insertarActualizarNota();
            }
            function insertarActualizarNota() {
              if (existe.length > 0) {
                pool.query('UPDATE notas SET nota = ? WHERE id_nota = ?', [n.nota, existe[0].id_nota], (err) => {
                  if (err) { console.error('Error en UPDATE:', err); errores.push(err); }
                  // Solo llamar a guardarComentario si hay comentarios para guardar
                  if (n.comentarios && n.comentarios.trim() !== '') {
                      guardarComentario();
                  } else {
                      procesados++; // Incrementar procesados si no hay comentario para esta nota
                      if (procesados === notas.length) finalizar();
                  }
                });
              } else {
                pool.query('INSERT INTO notas (id_actividad, id_estudiante, nota) VALUES (?, ?, ?)', [id_actividad, n.id_estudiante, n.nota], (err) => {
                  if (err) { console.error('Error en INSERT:', err); errores.push(err); }
                  // Solo llamar a guardarComentario si hay comentarios para guardar
                  if (n.comentarios && n.comentarios.trim() !== '') {
                      guardarComentario();
                  } else {
                      procesados++; // Incrementar procesados si no hay comentario para esta nota
                      if (procesados === notas.length) finalizar();
                  }
                });
              }
            }
            function guardarComentario() {
              // Asegúrate de que n.comentarios sea null si está vacío, para evitar errores de tipo en la BD
              const comentarioMensaje = n.comentarios && n.comentarios.trim() !== '' ? n.comentarios.trim() : null;
              
              // Solo intentar insertar si el comentario no es null (después del trim)
              if (comentarioMensaje) {
                // MODIFIED: Added id_usuario and id_periodo to the INSERT query for comments
                pool.query('INSERT INTO comentarios (id_estudiante, id_usuario, mensaje, fecha_hora, id_actividad) VALUES (?, ?, ?, NOW(), ?)', [n.id_estudiante, id_usuario_remitente, comentarioMensaje, id_actividad], (err) => {
                  if (err) {
                    console.error('Error en INSERT comentario:', err);
                    errores.push(err);
                  }
                  procesados++; // Incrementar procesados en ambos casos (éxito o error de comentario)
                  if (procesados === notas.length) finalizar();
                });
              } else {
                procesados++; // Incrementar procesados si no hay comentario para esta nota
                if (procesados === notas.length) finalizar();
              }
            }
          });
        });
      });
      function finalizar() {
        if (errores.length > 0) {
          console.error('Errores al guardar notas:', errores);
          return res.status(500).json({ error: 'Error al registrar/actualizar notas y comentarios', detalle: errores.map(e => e.message) });
        }
        res.json({ message: 'Notas y comentarios registrados/actualizados correctamente.' });
      }
      return;
    }
    // Si existe getConnection, usar el flujo original con transacciones
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
          conn.query('SELECT id_nota FROM notas WHERE id_actividad = ? AND id_estudiante = ?', [id_actividad, n.id_estudiante], (err, existe) => {
            if (err) { console.error('Error en SELECT:', err); errores.push(err); procesados++; if (procesados === notas.length) finalizar(); return; }
            // Verificar si el estudiante existe
            conn.query('SELECT id_estudiante FROM estudiantes WHERE id_estudiante = ?', [n.id_estudiante], (err, estudianteExiste) => {
              if (err) { console.error('Error verificando estudiante:', err); errores.push(err); procesados++; if (procesados === notas.length) finalizar(); return; }
              if (estudianteExiste.length === 0) {
                // Buscar el id_usuario correspondiente
                conn.query('SELECT id_usuario FROM usuarios WHERE id_usuario = ?', [n.id_estudiante], (err, usuarioRows) => {
                  if (err) { console.error('Error buscando usuario:', err); errores.push(err); procesados++; if (procesados === notas.length) finalizar(); return; }
                  if (usuarioRows.length === 0) {
                    console.error('No existe el usuario para el id_estudiante:', n.id_estudiante);
                    errores.push(new Error('No existe el usuario para el id_estudiante: ' + n.id_estudiante));
                    procesados++;
                    if (procesados === notas.length) finalizar();
                    return;
                  }
                  // Insertar estudiante con ambos campos
                  conn.query('INSERT INTO estudiantes (id_estudiante, id_usuario) VALUES (?, ?)', [n.id_estudiante, n.id_estudiante], (err) => {
                    if (err) { console.error('Error insertando estudiante:', err); procesados++; if (procesados === notas.length) finalizar(); return; }
                    // Continuar con la lógica de notas después de insertar estudiante
                    insertarActualizarNota();
                  });
                });
              } else {
                insertarActualizarNota();
              }
              function insertarActualizarNota() {
                if (existe.length > 0) {
                  conn.query('UPDATE notas SET nota = ? WHERE id_nota = ?', [n.nota, existe[0].id_nota], (err) => {
                    if (err) { console.error('Error en UPDATE:', err); errores.push(err); }
                    // Solo llamar a guardarComentario si hay comentarios para guardar
                    if (n.comentarios && n.comentarios.trim() !== '') {
                        guardarComentario();
                    } else {
                        procesados++; // Incrementar procesados si no hay comentario para esta nota
                        if (procesados === notas.length) finalizar();
                    }
                  });
                } else {
                  conn.query('INSERT INTO notas (id_actividad, id_estudiante, nota) VALUES (?, ?, ?)', [id_actividad, n.id_estudiante, n.nota], (err) => {
                    if (err) { console.error('Error en INSERT:', err); errores.push(err); }
                    // Solo llamar a guardarComentario si hay comentarios para guardar
                    if (n.comentarios && n.comentarios.trim() !== '') {
                        guardarComentario();
                    } else {
                        procesados++; // Incrementar procesados si no hay comentario para esta nota
                        if (procesados === notas.length) finalizar();
                    }
                  });
                }
              }
              function guardarComentario() {
                // Asegúrate de que n.comentarios sea null si está vacío, para evitar errores de tipo en la BD
                const comentarioMensaje = n.comentarios && n.comentarios.trim() !== '' ? n.comentarios.trim() : null;

                if (comentarioMensaje) { // Solo intentar insertar si el comentario no es null (después del trim)
                  // MODIFIED: Added id_usuario and id_periodo to the INSERT query for comments
                  conn.query('INSERT INTO comentarios (id_estudiante, id_usuario, mensaje, fecha_hora) VALUES (?, ?, ?, NOW())', [n.id_estudiante, id_usuario_remitente, comentarioMensaje], (err) => {
                    if (err) {
                      console.error('Error en INSERT comentario:', err);
                      errores.push(err);
                    }
                    procesados++; // Incrementar procesados en ambos casos (éxito o error de comentario)
                    if (procesados === notas.length) finalizar();
                  });
                } else {
                  procesados++; // Incrementar procesados si no hay comentario para esta nota
                  if (procesados === notas.length) finalizar();
                }
              }
            });
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


// ==========================================================
// 🚀 RUTAS PARA GESTIÓN DE USUARIO_MATERIAS (MODIFICADA) 🚀
// ==========================================================




router.get('/materias/:id_materia/estudiantes', async (req, res) => {
  const { id_materia } = req.params;
  const { id_periodo } = req.query; // Esperar id_periodo como query param

  if (!id_periodo) {
      return res.status(400).json({ error: 'Debes especificar el ID del periodo.' });
  }
  try {
      const query = `
          SELECT u.id_usuario, u.primer_nombre, u.primer_apellido, u.cedula
          FROM usuarios u
          JOIN usuario_materias um ON u.id_usuario = um.id_usuario
          WHERE um.id_materia = ? AND um.id_periodo = ? AND u.rol = 'estudiante' -- Filtrar por id_periodo
          ORDER BY u.primer_apellido, u.primer_nombre;
      `;
      const [estudiantes] = await db.promise().query(query, [id_materia, id_periodo]);
    res.json(estudiantes);
  } catch (error) {
    console.error('Error al obtener estudiantes de la materia:', error);
    res.status(500).json({ error: 'Error al obtener estudiantes de la materia', detalle: error.message });
  }
});

/**
* @route GET /api/materias/:id_materia/actividades
* @description Obtiene las actividades de una materia específica.
*/
router.get('/materias/:id_materia/actividades', async (req, res) => {
  const { id_materia } = req.params;
  const { id_periodo } = req.query; // Esperar id_periodo como query param

  if (!id_periodo) {
      return res.status(400).json({ error: 'Debes especificar el ID del periodo.' });
  }
  try {
      const query = `
          SELECT id_actividad, nombre_actividad, descripcion, fecha_creacion AS fecha_entrega, ponderacion, id_periodo
          FROM actividades
          WHERE id_materia = ? AND id_periodo = ?
          ORDER BY nombre_actividad;
      `;
      const [actividades] = await db.promise().query(query, [id_materia, id_periodo]);
      // FIX: Envolver el array de actividades en un objeto con la propiedad 'actividades'
      res.json({ actividades: actividades });
  } catch (error) {
      console.error('Error al obtener actividades de la materia:', error);
      res.status(500).json({ error: 'Error al obtener actividades de la materia', detalle: error.message });
  }
});

// Obtener comentarios de un estudiante para una actividad
router.get('/comentarios/actividad/:id_actividad/estudiante/:id_estudiante', async (req, res) => {
  const { id_actividad, id_estudiante } = req.params;
  const { id_periodo } = req.query; // Esperar id_periodo como query param

  if (!id_periodo) {
    return res.status(400).json({ error: 'Debes especificar el ID del periodo.' });
  }
  try {
    const [comentarios] = await db.promise().query(
      `SELECT id_comentario, mensaje, fecha_hora FROM comentarios WHERE id_actividad = ? AND id_estudiante = ? AND id_periodo = ? ORDER BY fecha_hora DESC`,
      [id_actividad, id_estudiante, id_periodo]
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
    const { id_periodo, search } = req.query; // Obtener id_periodo y el nuevo parámetro 'search'

    if (!id_periodo) {
        return res.status(400).json({ error: 'Debes especificar el ID del periodo.' });
    }

    try {
        let sqlActividades = `
            SELECT id_actividad, nombre_actividad, descripcion, fecha_creacion AS fecha_entrega, ponderacion, id_periodo
            FROM actividades
            WHERE id_materia = ? AND id_periodo = ?
        `;
        let sqlCount = `
            SELECT COUNT(*) AS total FROM actividades
            WHERE id_materia = ? AND id_periodo = ?
        `;

        let queryParams = [id, id_periodo];
        let countParams = [id, id_periodo];

        // Si existe un término de búsqueda, añadir la condición WHERE
        if (search) {
            sqlActividades += ` AND (nombre_actividad LIKE ? OR descripcion LIKE ?)`;
            sqlCount += ` AND (nombre_actividad LIKE ? OR descripcion LIKE ?)`;
            // Construir el término de búsqueda con comodines una sola vez
            const searchTermPattern = `%${search}%`;
            queryParams.push(searchTermPattern, searchTermPattern);
            countParams.push(searchTermPattern, searchTermPattern);
        }

        // Añadir los parámetros de paginación al final de queryParams
        sqlActividades += ` ORDER BY fecha_creacion DESC LIMIT ?, ?`;
        queryParams.push(offset, limit);

        const [actividadesResult, actividadesCountResult] = await Promise.all([
            db.promise().query(sqlActividades, queryParams),
            db.promise().query(sqlCount, countParams) // Usar countParams para la consulta de conteo
        ]);

        const actividades = actividadesResult[0]; // Array de filas de actividades
        const totalRows = actividadesCountResult[0][0].total; // Total de actividades filtradas
        const totalPages = Math.ceil(totalRows / limit);

        console.log('DEBUG: Actividades y TotalPages para /materias/:id/actividades (paginado y con búsqueda):', { actividades, totalPages, totalRows });

        res.json({
            actividades: actividades,
            totalPages: totalPages
        });
    } catch (error) {
        console.error('Error al obtener actividades de la materia:', error);
        res.status(500).json({ error: 'Error al obtener actividades de la materia', detalle: error.message });
    }
});




// Resumen de actividades de una materia
router.get('/materias/:id/actividades/resumen', async (req, res) => {
  const { id } = req.params;
  const { id_periodo } = req.query; // Esperar id_periodo como query param

  if (!id_periodo) {
    return res.status(400).json({ error: 'Debes especificar el ID del periodo.' });
  }

  try {
    // Total de actividades
    const [[{ totalActividades }]] = await db.promise().query(
      'SELECT COUNT(*) AS totalActividades FROM actividades WHERE id_materia = ? AND id_periodo = ?', [id, id_periodo]
    );

    // Promedio general simple (promedio de todas las notas de la materia)
    const [[{ promedioGeneralMateria }]] = await db.promise().query(
      `SELECT AVG(n.nota) AS promedioGeneralMateria
       FROM notas n
       JOIN actividades a ON n.id_actividad = a.id_actividad
       WHERE a.id_materia = ? AND a.id_periodo = ?`, [id, id_periodo]
    );

    // Lista de estudiantes únicos relacionados con la materia y el periodo
    const [estudiantes] = await db.promise().query(
      `SELECT DISTINCT u.id_usuario AS id_estudiante 
       FROM usuarios u
       JOIN usuario_materias um ON u.id_usuario = um.id_usuario
       WHERE um.id_materia = ? AND um.id_periodo = ? AND u.rol = 'estudiante'`, [id, id_periodo]
    );

    // Actividades con ponderación
    const [actividades] = await db.promise().query(
      `SELECT id_actividad, ponderacion
       FROM actividades
       WHERE id_materia = ? AND id_periodo = ?`, [id, id_periodo]
    );

    // Todas las notas registradas en actividades de esta materia y periodo
    const [notas] = await db.promise().query(
      `SELECT n.id_estudiante, n.id_actividad, n.nota
       FROM notas n
       JOIN actividades a ON n.id_actividad = a.id_actividad
       WHERE a.id_materia = ? AND a.id_periodo = ?`, [id, id_periodo]
    );

    // Crear mapa de ponderaciones
    const mapaPonderaciones = new Map();
    actividades.forEach(({ id_actividad, ponderacion }) => {
      mapaPonderaciones.set(id_actividad, ponderacion);
    });

    // Calcular nota definitiva por estudiante
    const notaDefinitivaPorEstudiante = new Map();

    estudiantes.forEach(est => {
      const notasEst = notas.filter(n => n.id_estudiante === est.id_estudiante);
      let notaFinal = 0;
      let sumaPonderacion = 0;

      notasEst.forEach(n => {
        const ponderacion = mapaPonderaciones.get(n.id_actividad) || 0;
        if (n.nota !== null) {
          notaFinal += n.nota * (ponderacion / 100);
          sumaPonderacion += ponderacion;
        }
      });

      const notaDefinitiva = sumaPonderacion > 0 ? notaFinal : 0;
      notaDefinitivaPorEstudiante.set(est.id_estudiante, notaDefinitiva);
    });

    // Aprobados y reprobados por nota definitiva
    let estudiantesAprobados = 0;
    let estudiantesReprobados = 0;

    notaDefinitivaPorEstudiante.forEach(nota => {
      if (nota >= 10) estudiantesAprobados++;
      else estudiantesReprobados++;
    });

    // Enviar respuesta
    res.json({
      totalActividades,
      promedioGeneralMateria: promedioGeneralMateria || 0,
      total_estudiantes_materia: estudiantes.length,
      estudiantesAprobados,
      estudiantesReprobados
    });

  } catch (error) {
    console.error('❌ Error al obtener resumen de actividades:', error);
    res.status(500).json({
      error: 'Error al obtener resumen de actividades',
      detalle: error.message
    });
  }
});


// Obtener todas las notas de todos los estudiantes para todas las actividades de una materia
router.get('/notas/materia/:id_materia', async (req, res) => {
  const { id_materia } = req.params;
  const { id_periodo } = req.query; // Esperar id_periodo como query param

  if (!id_periodo) {
      return res.status(400).json({ error: 'Debes especificar el ID del periodo.' });
  }

  try {
    const notasQuery = `
      SELECT
        n.id_nota,
        n.nota,
        n.id_estudiante,
        n.id_actividad,
        n.fecha_registro,
        u.primer_nombre,
        u.primer_apellido,
        a.nombre_actividad,
        a.descripcion,
        m.materia AS nombre_materia,
        a.id_periodo -- Incluido id_periodo de actividades
      FROM notas n
      JOIN usuarios u ON n.id_estudiante = u.id_usuario
      JOIN actividades a ON n.id_actividad = a.id_actividad
      JOIN materias m ON a.id_materia = m.id_materia
      WHERE m.id_materia = ? AND a.id_periodo = ?
      ORDER BY u.primer_apellido ASC, u.primer_nombre ASC;
    `;

    const [notas] = await db.promise().query(notasQuery, [id_materia, id_periodo]);

    res.json({ notas });

  } catch (error) {
    console.error("❌ Error al obtener notas por materia:", error);
    res.status(500).json({
      error: "Error al obtener notas por materia",
      detalle: error.message
    });
  }
});

export default router;
