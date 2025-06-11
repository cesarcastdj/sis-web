import express from 'express';
import db from '../db/db.js'; // Ajusta esta ruta si es necesario
import { isAuthenticated } from '../middleware/protegerRutas.js'; // Ajusta esta ruta si es necesario (comentado para pruebas)

const router = express.Router();


router.get('/notas/usuario/:id_usuario', /*isAuthenticated,*/ async (req, res) => {
    const { id_usuario } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
        // Consulta para el conteo total de notas del usuario
        const [totalNotasResult] = await db.promise().query(
            'SELECT COUNT(*) AS total FROM notas WHERE id_usuario = ?',
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
                n.comentarios,
                u.primer_nombre AS nombre_estudiante,
                u.primer_apellido AS apellido_estudiante,
                m.materia AS nombre_materia,
                a.nombre_actividad,
                a.descripcion AS descripcion_actividad
            FROM notas n
            JOIN usuarios u ON n.id_usuario = u.id_usuario
            JOIN materias m ON n.id_materia = m.id_materia
            LEFT JOIN actividades a ON n.id_actividad = a.id_actividad
            WHERE n.id_usuario = ?
            ORDER BY n.fecha_registro DESC
            LIMIT ?, ?;
        `;
        const [notas] = await db.promise().query(notasQuery, [id_usuario, offset, parseInt(limit)]);

        res.json({
            notas,
            totalCount,
            totalPages,
            currentPage: parseInt(page)
        });

    } catch (error) {
        console.error("❌ Error al obtener notas del usuario:", error);
        res.status(500).json({ error: "Error al obtener notas del usuario", detalle: error.message });
    }
});


router.get('/notas/materia/:id_materia/usuario/:id_usuario', /*isAuthenticated,*/ async (req, res) => {
    const { id_materia, id_usuario } = req.params;

    try {
        const notasQuery = `
            SELECT
                n.id_nota,
                n.nota,
                n.fecha_registro,
                n.comentarios,
                u.primer_nombre AS nombre_estudiante,
                u.primer_apellido AS apellido_estudiante,
                m.materia AS nombre_materia,
                a.nombre_actividad,
                a.descripcion AS descripcion_actividad
            FROM notas n
            JOIN usuarios u ON n.id_usuario = u.id_usuario
            JOIN materias m ON n.id_materia = m.id_materia
            LEFT JOIN actividades a ON n.id_actividad = a.id_actividad
            WHERE n.id_materia = ? AND n.id_usuario = ?
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
 * @description Obtiene los detalles de una nota específica por su ID.
 * @param {number} req.params.id_nota - ID de la nota.
 * @returns {json} Detalles de la nota.
 */
router.get('/notas/:id_nota', /*isAuthenticated,*/ async (req, res) => {
    const { id_nota } = req.params;

    try {
        const notaQuery = `
            SELECT
                n.id_nota,
                n.nota,
                n.fecha_registro,
                n.comentarios,
                u.id_usuario,
                u.primer_nombre AS nombre_estudiante,
                u.primer_apellido AS apellido_estudiante,
                m.id_materia,
                m.materia AS nombre_materia,
                a.id_actividad,
                a.nombre_actividad,
                a.descripcion AS descripcion_actividad
            FROM notas n
            JOIN usuarios u ON n.id_usuario = u.id_usuario
            JOIN materias m ON n.id_materia = m.id_materia
            LEFT JOIN actividades a ON n.id_actividad = a.id_actividad
            WHERE n.id_nota = ?;
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


router.post('/notas', /*isAuthenticated,*/ async (req, res) => {
    const { id_usuario, id_materia, id_actividad = null, nota, fecha_registro, comentarios = null } = req.body;

    try {
        if (!id_usuario || !id_materia || !nota || !fecha_registro) {
            return res.status(400).json({ error: 'ID de usuario, materia, nota y fecha de registro son obligatorios.' });
        }

        const formattedFechaRegistro = new Date(fecha_registro).toISOString().slice(0, 10);

        const insertNotaQuery = `
            INSERT INTO notas (id_usuario, id_materia, id_actividad, nota, fecha_registro, comentarios)
            VALUES (?, ?, ?, ?, ?, ?);
        `;
        const [result] = await db.promise().query(
            insertNotaQuery,
            [id_usuario, id_materia, id_actividad, nota, formattedFechaRegistro, comentarios]
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
    const { nota, id_actividad = null, comentarios = null, fecha_registro } = req.body; // id_usuario y id_materia no deberían cambiar

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
        await db.promise().query(updateQuery, [updateFields, id_nota]);

        res.json({ message: 'Nota actualizada exitosamente.' });

    } catch (error) {
        console.error("❌ Error al actualizar nota:", error);
        res.status(500).json({ error: "Error al actualizar nota", detalle: error.message });
    }
});


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


router.post('/actividades', /*isAuthenticated,*/ async (req, res) => {
    const { nombre_actividad, descripcion = null, fecha_creacion, id_materia } = req.body;

    try {
        if (!nombre_actividad || !fecha_creacion || !id_materia) {
            return res.status(400).json({ error: 'Nombre de actividad, fecha de creación y ID de materia son obligatorios.' });
        }

        const formattedFechaCreacion = new Date(fecha_creacion).toISOString().slice(0, 10);

        const insertActividadQuery = `
            INSERT INTO actividades (nombre_actividad, descripcion, fecha_creacion, id_materia)
            VALUES (?, ?, ?, ?);
        `;
        const [result] = await db.promise().query(
            insertActividadQuery,
            [nombre_actividad, descripcion, formattedFechaCreacion, id_materia]
        );
        const nuevaActividadId = result.insertId;

        res.status(201).json({ message: 'Actividad creada exitosamente.', id: nuevaActividadId });

    } catch (error) {
        console.error("❌ Error al crear actividad:", error);
        res.status(500).json({ error: "Error al crear actividad", detalle: error.message });
    }
});


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


router.delete('/actividades/:id_actividad', /*isAuthenticated,*/ async (req, res) => {
    const { id_actividad } = req.params;

    try {

        await db.promise().query('UPDATE notas SET id_actividad = NULL WHERE id_actividad = ?', [id_actividad]);
        console.log(`DEBUG: Notas asociadas a actividad ${id_actividad} desvinculadas.`);

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


export default router;
