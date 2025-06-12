import express from 'express';
import db from '../db/db.js'; // Ajusta esta ruta si es necesario
import { isAuthenticated } from '../middleware/protegerRutas.js'; // Ajusta esta ruta si es necesario (comentado para pruebas)
import { hashPassword, comparePassword } from '../f(x)/contrasenias.js'; // Ajusta esta ruta si es necesario
import { syncRelationships, syncSingleRelationship } from '../f(x)/relaciones.js'; // Ajusta esta ruta si es necesario


const router = express.Router();

// ==========================================================
// Rutas ya existentes (Mantenidas y verificadas)
// ==========================================================

// Obtener cursos disponibles
router.get('/cursos', (req, res) => {
    db.query('SELECT id_curso, curso AS nombre_curso FROM cursos WHERE activo = 1', (err, results) => {
      if (err) return res.status(500).json({ error: 'Error al obtener cursos', detalle: err.message });
      res.json(results);
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
    db.query('SELECT id_seccion, seccion FROM seccion', (err, results) => { 
      if (err) {
        console.error('Error en la consulta de secciones:', err);
        return res.status(500).json({ error: 'Error al obtener secciones', detalle: err.message });
      }
      res.json(results);
    });
});

// Obtener periodos académicos disponibles (para registros de usuarios/dropdowns)
router.get('/periodos', (req, res) => {
    db.query('SELECT id_periodo, periodo AS periodo, fechaInicio, fechaFinal FROM periodo', (err, results) => { 
      if (err) {
        console.error('Error en la consulta de periodos:', err);
        return res.status(500).json({ error: 'Error al obtener periodos académicos', detalle: err.message });
      }
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

router.post('/register-materia', async (req, res) => { // Mantengo esta ruta existente
    try {
      const { id_curso, nombreMateria, estudiantesAsignados = [] } = req.body;

      if (!id_curso || !nombreMateria) {
        return res.status(400).json({ error: 'El curso y el nombre de la materia son obligatorios.' });
      }

      db.query('INSERT INTO materias (id_curso, materia, activo) VALUES (?, ?, 1)',
        [id_curso, nombreMateria], (err, materiaResult) => {
          if (err) {
            console.error('Error insertando materia:', err);
            return res.status(500).json({ error: 'Error al registrar la materia.', detalle: err.message });
          }
          const id_materia = materiaResult.insertId;

          if (estudiantesAsignados.length > 0) {
            const asignacionValues = estudiantesAsignados.map(id_est => [id_est, id_materia]);
            db.query('INSERT INTO usuario_materias (id_usuario, id_materia) VALUES ?',
              [asignacionValues], (assignErr) => {
                if (assignErr) {
                  console.error('Error asignando estudiantes a la materia:', assignErr);
                  return res.status(500).json({ error: 'Materia registrada, pero hubo un error al asignar estudiantes.', detalle: assignErr.message });
                }
                res.json({ message: 'Materia registrada y estudiantes asignados exitosamente.', id_materia });
              });
          } else {
            res.json({ message: 'Materia registrada exitosamente.', id_materia });
          }
        });
    } catch (error) {
      console.error('Error en /api/register-materia:', error);
      res.status(500).json({ error: 'Error interno del servidor al registrar materia.', detalle: error.message });
    }
});


// 🔹 Ruta para registrar un nuevo curso 🔹
router.post('/register-curso', async (req, res) => {
    try {
      const { nombreCurso, id_periodo, id_seccion, agregarMateria, nombreMateria = null, estudiantesAsignados = [] } = req.body;

      if (!nombreCurso || !id_periodo || !id_seccion) {
        return res.status(400).json({ error: 'El nombre del curso, periodo y sección son obligatorios.' });
      }
      if (agregarMateria && !nombreMateria) {
        return res.status(400).json({ error: 'El nombre de la materia es obligatorio si se desea agregar.' });
      }

      db.query('INSERT INTO cursos (curso, id_periodo, id_seccion, activo) VALUES (?, ?, ?, 1)',
        [nombreCurso, id_periodo, id_seccion], async (err, cursoResult) => {
          if (err) {
            console.error('Error insertando curso:', err);
            return res.status(500).json({ error: 'Error al registrar el curso.', detalle: err.message });
          }
          const id_curso = cursoResult.insertId;

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
    } catch (error) {
      console.error('Error en /api/register-curso:', error);
      res.status(500).json({ error: 'Error interno del servidor al registrar curso.', detalle: error.message });
    }
});


// 🔹 Ruta para registrar un nuevo periodo 🔹
router.post('/register-periodo', async (req, res) => {
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
    const { id } = req.params;
    try {
      const query = `
        SELECT
          p.id_periodo,
          p.periodo AS nombre_periodo,
          p.fechaInicio,
          p.fechaFinal
        FROM periodo p
        WHERE p.id_periodo = ?;
      `;
      const [rows] = await db.promise().query(query, [id]);

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Periodo académico no encontrado.' });
      }

      const periodo = rows[0];

      const [cursosResult] = await db.promise().query(`
        SELECT id_curso, curso AS curso
        FROM cursos
        WHERE id_periodo = ?;
      `, [id]);
      const cursos_info = cursosResult.map(c => ({ id_curso: c.id_curso, curso: c.curso }));

      const [materiasResult] = await db.promise().query(`
        SELECT DISTINCT m.id_materia, m.materia AS materia
        FROM materias m
        JOIN cursos c ON m.id_curso = c.id_curso
        WHERE p.id_periodo = ?;
      `, [id]);
      const materias_info = materiasResult.map(m => ({ id_materia: m.id_materia, nombre_materia: m.nombre_materia }));
      
      const [totalEstudiantesResult] = await db.promise().query(`
        SELECT COUNT(DISTINCT u.id_usuario) AS total_estudiantes
        FROM usuarios u
        JOIN usuario_cursos uc ON u.id_usuario = uc.id_usuario
        JOIN cursos c ON uc.id_curso = c.id_curso
        WHERE u.rol = 'estudiante' AND p.id_periodo = ?;
      `, [id]);
      const totalEstudiantes = totalEstudiantesResult[0]?.total_estudiantes || 0;

      const [totalProfesoresResult] = await db.promise().query(`
        SELECT COUNT(DISTINCT u.id_usuario) AS total_profesores
        FROM usuarios u
        JOIN usuario_materias um ON u.id_usuario = um.id_usuario
        JOIN materias m ON um.id_materia = m.id_materia
        JOIN cursos c ON m.id_curso = c.id_curso
        WHERE u.rol = 'profesor' AND p.id_periodo = ?;
      `, [id]);
      const totalProfesores = totalProfesoresResult[0]?.total_profesores || 0;

      const periodoFormateado = {
        id_periodo: periodo.id_periodo,
        nombre_periodo: periodo.periodo,
        fechaInicio: periodo.fechaInicio,
        fechaFinal: periodo.fechaFinal,
        cursos_info,
        materias_info,
        total_estudiantes: totalEstudiantes,
        total_profesores: totalProfesores
      };

      res.json(periodoFormateado);

    } catch (error) {
      console.error("❌ Error al obtener periodo por ID:", error);
      res.status(500).json({ error: "Error al obtener periodo", detalle: error.message });
    }
});

router.post('/periodos-academicos', /*isAuthenticated,*/ async (req, res) => {
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

router.put('/periodos-academicos/:id', /*isAuthenticated,*/ async (req, res) => {
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



router.get('/cursos-academicos', /*isAuthenticated,*/ async (req, res) => {
  const { page = 1, limit = 5, search = '' } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const searchTerm = `%${search}%`;


    try {
        // Consulta para el conteo total con filtro de búsqueda
        let countQuery = `
            SELECT COUNT(DISTINCT c.id_curso) AS total
            FROM cursos c
            LEFT JOIN periodo p ON p.id_periodo 
            LEFT JOIN seccion s ON s.id_seccion 
            WHERE c.curso LIKE ?;
        `;
        const [totalCursosResult] = await db.promise().query(countQuery, [searchTerm]);
        const totalCount = totalCursosResult[0].total;
        const totalPages = Math.ceil(totalCount / limit);

        // Consulta principal para obtener los cursos con sus detalles
        let cursosQuery = `
            SELECT
                c.id_curso,
                c.curso AS nombre_curso,
                c.activo AS estado,
                IFNULL(p.periodo, 'N/A') AS nombre_periodo,
                IFNULL(s.seccion, 'N/A') AS nombre_seccion,
                (
                    SELECT COUNT(DISTINCT uc.id_usuario)
                    FROM usuario_cursos uc
                    JOIN usuarios u ON uc.id_usuario = u.id_usuario
                    WHERE uc.id_curso = c.id_curso AND u.rol = 'estudiante'
                ) AS total_estudiantes_curso,
                (
                    SELECT COUNT(DISTINCT uc.id_usuario)
                    FROM usuario_cursos uc
                    JOIN usuarios u ON uc.id_usuario = u.id_usuario
                    WHERE uc.id_curso = c.id_curso AND u.rol = 'profesor'
                ) AS total_profesores_curso,
                (
                    SELECT COUNT(DISTINCT m.id_materia)
                    FROM materias m
                    WHERE m.id_curso = c.id_curso
                ) AS total_materias_curso
            FROM cursos c
            LEFT JOIN periodo p ON p.id_periodo 
            LEFT JOIN seccion s ON s.id_seccion 
            WHERE c.curso LIKE ?
            LIMIT ?, ?;
        `;
        const [cursos] = await db.promise().query(cursosQuery, [searchTerm, offset, parseInt(limit)]);

        res.json({
            cursos,
            totalCount,
            totalPages,
            currentPage: parseInt(page)
        });

    } catch (error) {
        console.error("❌ Error al obtener lista de cursos:", error);
        res.status(500).json({ error: "Error al obtener lista de cursos", detalle: error.message });
    }
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


router.get('/cursos-academicos/:id', /*isAuthenticated,*/ async (req, res) => {
    const { id } = req.params;
    try {
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
            LEFT JOIN periodo p ON p.id_periodo = p.id_periodo
            LEFT JOIN seccion s ON s.id_seccion = s.id_seccion
            WHERE c.id_curso = ?;
        `;
        const [cursoRows] = await db.promise().query(cursoQuery, [id]);

        if (cursoRows.length === 0) {
            return res.status(404).json({ error: 'Curso no encontrado.' });
        }

        const curso = cursoRows[0];

        // Obtener estudiantes inscritos en este curso
        const [estudiantesResult] = await db.promise().query(`
            SELECT uc.id_usuario, u.primer_nombre, u.primer_apellido, u.cedula
            FROM usuario_cursos uc
            JOIN usuarios u ON uc.id_usuario = u.id_usuario
            WHERE uc.id_curso = ? AND u.rol = 'estudiante';
        `, [id]);
        curso.estudiantes_info = estudiantesResult.map(e => ({
            id_usuario: e.id_usuario,
            nombre_completo: `${e.primer_nombre} ${e.primer_apellido} (${e.cedula})`
        }));

        // Obtener materias que pertenecen a este curso
        const [materiasResult] = await db.promise().query(`
            SELECT id_materia, materia AS nombre_materia
            FROM materias
            WHERE id_curso = ?;
        `, [id]);
        curso.materias_info = materiasResult.map(m => ({
            id_materia: m.id_materia,
            nombre_materia: m.nombre_materia
        }));

        res.json(curso);
    } catch (error) {
        console.error("❌ Error al obtener detalles del curso:", error);
        res.status(500).json({ error: "Error al obtener detalles del curso", detalle: error.message });
    }
});

/**
 * @route POST /api/cursos-academicos
 * @description Crea un nuevo curso académico.
 * @param {string} req.body.nombreCurso - Nombre del curso.
 * @param {number} req.body.id_periodo - ID del periodo académico asociado.
 * @param {number} req.body.id_seccion - ID de la sección asociada.
 * @param {boolean} [req.body.agregarMateria=false] - Indica si se debe agregar una materia junto con el curso.
 * @param {string} [req.body.nombreMateria] - Nombre de la materia si se va a agregar (obligatorio si agregarMateria es true).
 * @param {Array<number>} [req.body.estudiantesAsignados=[]] - IDs de estudiantes a asignar al curso/materia.
 * @returns {json} Mensaje de éxito e ID del nuevo curso.
 */
router.post('/cursos-academicos', /*isAuthenticated,*/ async (req, res) => {
    const { nombreCurso, id_periodo, id_seccion, agregarMateria = false, nombreMateria = null, estudiantesAsignados = [] } = req.body;

    if (!nombreCurso || !id_periodo || !id_seccion) {
        return res.status(400).json({ error: 'El nombre del curso, periodo y sección son obligatorios.' });
    }
    if (agregarMateria && !nombreMateria) {
        return res.status(400).json({ error: 'El nombre de la materia es obligatorio si se desea agregar.' });
    }

    let connection;
    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        // Insertar el nuevo curso
        const [cursoResult] = await connection.query(
            'INSERT INTO cursos (curso, id_seccion, activo) VALUES (?, ?, 1)',
            [nombreCurso, id_seccion]
        );
        const id_curso = cursoResult.insertId;

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
 * @param {number} req.body.id_seccion - Nuevo ID de la sección.
 * @returns {json} Mensaje de éxito.
 */
router.put('/cursos-academicos/:id', /*isAuthenticated,*/ async (req, res) => {
    const { id } = req.params;
    const { nombre_curso, id_periodo, id_seccion } = req.body;

    try {
        if (!nombre_curso || !id_periodo || !id_seccion) {
            return res.status(400).json({ error: 'Nombre del curso, periodo y sección son obligatorios para la actualización.' });
        }

        const updateQuery = `
            UPDATE cursos
            SET curso = ?, id_periodo = ?, id_seccion = ?
            WHERE id_curso = ?;
        `;
        await db.promise().query(updateQuery, [nombre_curso, id_periodo, id_seccion, id]);

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
router.put('/cursos-academicos/:id/estado', /*isAuthenticated,*/ async (req, res) => {
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
router.delete('/cursos-academicos/:id', /*isAuthenticated,*/ async (req, res) => {
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

// Obtener todas las materias paginadas con detalles
router.get('/materias-academicas', /*isAuthenticated,*/ async (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const searchTerm = `%${search}%`;

    try {
        // Consulta para el conteo total con filtro de búsqueda
        let countQuery = `
            SELECT COUNT(DISTINCT m.id_materia) AS total
            FROM materias m
            JOIN cursos c ON m.id_curso = c.id_curso
            LEFT JOIN periodo p ON p.id_periodo = p.id_periodo 
            LEFT JOIN seccion s ON s.id_seccion = s.id_seccion 
            WHERE m.materia LIKE ?;
        `;
        const [totalMateriasResult] = await db.promise().query(countQuery, [searchTerm]);
        const totalCount = totalMateriasResult[0].total;
        const totalPages = Math.ceil(totalCount / limit);

        // Consulta principal para obtener las materias con sus detalles y conteos
        let materiasQuery = `
            SELECT
                m.id_materia,
                m.materia AS nombre_materia,
                m.activo AS estado,
                c.curso AS nombre_curso,
                c.id_curso,
                -- Aseguramos que los nombres de periodo y seccion sean siempre cadenas, no nulos
                IFNULL(p.periodo, 'N/A') AS nombre_periodo, 
                IFNULL(s.seccion, 'N/A') AS nombre_seccion,
                -- Subconsulta para el conteo de estudiantes
                (
                    SELECT COUNT(DISTINCT um_est.id_usuario) 
                    FROM usuario_materias um_est
                    JOIN usuarios u_est ON um_est.id_usuario = u_est.id_usuario
                    WHERE um_est.id_materia = m.id_materia AND u_est.rol = 'estudiante'
                ) AS total_estudiantes_materia,
                -- Subconsulta para el conteo de profesores
                (
                    SELECT COUNT(DISTINCT um_prof.id_usuario) 
                    FROM usuario_materias um_prof
                    JOIN usuarios u_prof ON um_prof.id_usuario = u_prof.id_usuario
                    WHERE um_prof.id_materia = m.id_materia AND u_prof.rol = 'profesor'
                ) AS total_profesores_materia
            FROM materias m
            JOIN cursos c ON m.id_curso = c.id_curso
            LEFT JOIN periodo p ON p.id_periodo = p.id_periodo
            LEFT JOIN seccion s ON s.id_seccion = s.id_seccion
            WHERE m.materia LIKE ?
            ORDER BY m.materia ASC
            LIMIT ?, ?;
        `;
        const [materias] = await db.promise().query(materiasQuery, [searchTerm, offset, parseInt(limit)]);

        res.json({
            materias,
            totalCount,
            totalPages,
            currentPage: parseInt(page)
        });

    } catch (error) {
        console.error("❌ Error al obtener lista de materias:", error);
        console.error("Detalle del error SQL:", error.sqlMessage || error.message); // Línea añadida para depuración
        res.status(500).json({ error: "Error al obtener lista de materias", detalle: error.message });
    }
});

// Obtener detalles de una materia por ID
router.get('/materias-academicas/:id', /*isAuthenticated,*/ async (req, res) => {
    const { id } = req.params;
    try {
        const materiaQuery = `
            SELECT
                m.id_materia,
                m.materia AS materia,
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
router.post('/materias-academicas', /*isAuthenticated,*/ async (req, res) => {
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
router.put('/materias-academicas/:id', /*isAuthenticated,*/ async (req, res) => {
    const { id } = req.params;
    const { nombre_materia, id_curso, estudiantes = [], profesores = [] } = req.body;

    if (!nombre_materia || !id_curso) {
        return res.status(400).json({ error: 'Nombre de la materia y Curso asociado son obligatorios.' });
    }

    let connection;
    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        // Actualizar la materia
        await connection.query(
            'UPDATE materias SET materia = ?, id_curso = ? WHERE id_materia = ?',
            [nombre_materia, id_curso, id]
        );

        // Sincronizar estudiantes asignados
        await syncRelationships(connection, 'usuario_materias', 'id_materia', 'id_usuario', id, estudiantes, 'estudiante');
        
        // Sincronizar profesores asignados
        await syncRelationships(connection, 'usuario_materias', 'id_materia', 'id_usuario', id, profesores, 'profesor');

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
router.put('/materias-academicas/:id/estado', /*isAuthenticated,*/ async (req, res) => {
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
router.delete('/materias-academicas/:id', /*isAuthenticated,*/ async (req, res) => {
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


export default router;
