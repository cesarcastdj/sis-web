import express from 'express';
import db from '../db/db.js';
import { comparePassword } from '../f(x)/contrasenias.js';
import { isAuthenticated } from '../middleware/protegerRutas.js';
import { hashPassword } from '../f(x)/contrasenias.js';
import { syncRelationships, syncSingleRelationship } from '../f(x)/relaciones.js';

const router = express.Router();
router.post('/login', async (req, res) => {
    const { correo, contraseña } = req.body;
  
    try {
      db.query('SELECT * FROM usuarios WHERE correo = ?', [correo], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Error del servidor' });
        if (results.length === 0) return res.status(401).json({ error: 'Usuario no encontrado' });
  
        const user = results[0];
        const match = await comparePassword(contraseña, user.contraseña);
  
        if (!match) {
          return res.status(401).json({ error: 'Contraseña incorrecta' });
        }
  
        const currentDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
  
        const insertLogin = new Promise((resolve, reject) => {
          db.query('INSERT INTO login (id_usuario, fecha_hora) VALUES (?, ?)', [user.id_usuario, currentDateTime], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
  
        const updateLastConnection = new Promise((resolve, reject) => {
          db.query('UPDATE usuarios SET ultima_conexion = ? WHERE id_usuario = ?', [currentDateTime, user.id_usuario], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
  
        await Promise.all([insertLogin, updateLastConnection]);
  
        req.session.usuario = {
          id: user.id_usuario,
          correo: user.correo,
          rol: user.rol,
          primer_nombre: user.primer_nombre,
          primer_apellido: user.primer_apellido,
          ultima_conexion: currentDateTime
        };
  
        return res.json({
          rol: user.rol,
          usuario: req.session.usuario
        });
      });
    } catch (error) {
      return res.status(500).json({ error: 'Error del servidor' });
    }
  });
  
  // Logout
  router.post('/logout', (req, res) => {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ message: 'Sesión cerrada' });
    });
  });
  
  // Obtener usuario logueado
  router.get('/usuario', isAuthenticated, (req, res) => {
    res.json(req.session.usuario);
  });

  router.post('/register', async (req, res) => {
    try {
      const {
        cedula, primerNombre, segundoNombre = null,
        primerApellido, segundoApellido = null,
        correo = null, telefono = null, direccion,
        id_estado, id_ciudad, contraseña, ultima_conexion = null
      } = req.body;
  
      // 📌 Validar campos obligatorios para el registro de login
      if (!cedula || !primerNombre || !primerApellido || !direccion || !id_estado || !id_ciudad || !contraseña) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para el registro de login' });
      }
  
      // 📌 Validar que no exista esa cédula
      db.query('SELECT id_usuario FROM usuarios WHERE cedula = ?', [cedula], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Error al verificar cédula' });
        if (rows.length > 0) return res.status(400).json({ error: 'Cédula ya registrada' });
  
        // 📌 Insertar dirección antes de registrar el usuario
        db.query('INSERT INTO direccion (direccion, id_ciudad, id_estado) VALUES (?, ?, ?)', 
          [direccion, id_ciudad, id_estado], async (err, dirResult) => {
            if (err) return res.status(500).json({ error: 'Error al insertar dirección' });
  
            const id_direccion = dirResult.insertId;
            const hashed = await hashPassword(contraseña); // La contraseña es obligatoria aquí
  
            // 📌 Asignar valores por defecto para el registro de login
            const rol = 'pendiente';       // por defecto
            const id_nivel = 4;            // nivel "pendiente"
  
            const sql = `
              INSERT INTO usuarios (
                cedula, primer_nombre, segundo_nombre,
                primer_apellido, segundo_apellido, telefono,
                correo, contraseña, rol, id_direccion, id_nivel, ultima_conexion
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
  
            const values = [
              cedula, primerNombre, segundoNombre,
              primerApellido, segundoApellido, telefono,
              correo, hashed, rol, id_direccion, id_nivel, ultima_conexion
            ];
  
            db.query(sql, values, (err, userResult) => {
              if (err) {
                console.error('Error insertando usuario:', err);
                return res.status(500).json({ error: 'Error al registrar usuario' });
              }
  
              const id_usuario = userResult.insertId;
  
              // 📌 Registrar la notificación para la administradora (id_admin = 1)
              db.query(`
                INSERT INTO notificaciones (id_usuario, id_admin, mensaje, estado) 
                VALUES (?, ?, 'Usuario por confirmación', 'pendiente')
              `, [id_usuario, 1], (err) => {
                if (err) console.error("Error creando notificación:", err);
              });
  
              return res.json({
                message: 'Usuario registrado. Espera aprobación del administrador.',
                usuario: { id_usuario, cedula }
              });
            });
          }
        );
      });
    } catch (error) {
      console.error('Catch /register:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Esta es una api para terminar el registro de un usuario (asignar rol, secciones, etc.)
  router.post('/asignar-usuario', (req, res) => {
    // Usamos un bloque try...catch para errores de sintaxis o síncronos.
    try {
      const { id_usuario, rol, secciones = [], cursos = [], materias = [] } = req.body;
  
      // 1. Asignar nivel según el rol
      const niveles = { estudiante: 1, admin: 2, profesor: 3 };
      const id_nivel = niveles[rol] || 4; // 4 para "pendiente"
  
      // Iniciamos la secuencia de operaciones con callbacks anidados.
      // Paso 1: Actualizar el rol principal del usuario.
      db.query('UPDATE usuarios SET rol = ?, id_nivel = ? WHERE id_usuario = ?', [rol, id_nivel, id_usuario], (err, result) => {
        if (err) {
          console.error('Error al actualizar el rol del usuario:', err);
          return res.status(500).json({ error: 'Error asignando el rol al usuario.' });
        }
        const continuarAsignaciones = () => {
          if (secciones && secciones.length > 0) {
            const seccionValues = secciones.map(id_sec => [id_usuario, id_sec]);
            db.query('INSERT INTO usuario_seccion (id_usuario, id_seccion) VALUES ?', [seccionValues], (err) => {
              if (err) console.error('Error insertando usuario_seccion:', err); 
            });
          }
  
          if (materias && materias.length > 0) {
            const materiaValues = materias.map(id_mat => [id_usuario, id_mat]);
            db.query('INSERT INTO usuario_materias (id_usuario, id_materia) VALUES ?', [materiaValues], (err) => {
              if (err) console.error('Error insertando usuario_materias:', err); 
            });
          }
  
          if (cursos && cursos.length > 0) {
            const currentDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const cursoValues = cursos.map(id_cur => [id_usuario, id_cur, currentDateTime]);
            db.query('INSERT INTO usuario_cursos (id_usuario, id_curso, fecha_inscripcion) VALUES ?', [cursoValues], (err) => {
              if (err) console.error('Error insertando usuario_cursos:', err); 
            });
          }
  
          db.query('UPDATE notificaciones SET estado = "procesado" WHERE id_usuario = ?', [id_usuario], (err) => {
            if (err) console.error('Error actualizando notificación:', err);
          });
  
          res.status(200).json({ message: 'Usuario asignado y registrado correctamente.' });
        };
  
        if (rol === 'estudiante') {
          db.query('INSERT INTO estudiantes (id_estudiante, id_usuario) VALUES (?, ?)', [id_usuario, id_usuario], (err) => {
            if (err) {
              console.error('Error insertando en la tabla de estudiantes:', err);
            }
            continuarAsignaciones();
          });
        } else if (rol === 'profesor') {
          db.query('INSERT INTO profesores (id_profesor, id_usuario) VALUES (?, ?)', [id_usuario, id_usuario], (err) => {
            if (err) {
              console.error('Error insertando en la tabla de profesores:', err);
            }
            continuarAsignaciones();
          });
        } else if(rol === 'admin') {
          db.query('INSERT INTO administradores (id_administrador, id_usuario) VALUES (?, ?)', [id_usuario, id_usuario], (err) => {
            if (err) {
              console.error('Error insertando en la tabla de administradores:', err);
            }
            continuarAsignaciones();
          });
        } else {
          continuarAsignaciones();
        }
      });
    } catch (error) {
      console.error('Error general en /asignar-usuario:', error);
      res.status(500).json({ error: 'Error interno del servidor.' });
    }
  });
  
 
export default router;