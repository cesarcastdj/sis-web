import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import db from './db.js';
import dotenv from 'dotenv';
import session from 'express-session';

dotenv.config();

const app = express();

app.use(cors({
  origin: 'http://localhost:4321', // ajusta si usas otro puerto
  credentials: true
}));
app.use(express.json());

app.use(session({
  secret: 'gllr_sistema_secreto',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 60 * 60 * 1000 // 60 minutos
  }
}));

// Hashear contraseña
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(String(password).trim(), saltRounds);
}

// Comparar contraseña
async function comparePassword(password, hashed) {
  return await bcrypt.compare(String(password).trim(), hashed);
}

// Middleware para proteger rutas
function isAuthenticated(req, res, next) {
  if (req.session.usuario) return next();
  return res.status(401).json({ error: 'No autenticado' }); // 🔹 Bloquea si no hay sesión
}

// Registro
// --- En tu server.js o app.js ---

app.post('/register', async (req, res) => {
  try {
    // 1) Desestructurar lo que envía el front
    const {
      cedula,
      primerNombre,
      segundoNombre = null,
      primerApellido,
      segundoApellido = null,
      correo = null,
      telefono = null,
      direccion,
      id_estado,
      id_ciudad,
      materias   = [],
      cursos     = [],
      secciones  = [],
      rol,
      contrasena = null   // si algún día la envías
    } = req.body;

    // 2) Inferir id_nivel según rol
    const niveles = { admin: 1, profesor: 2, estudiante: 3 };
    const id_nivel = niveles[rol] || niveles.estudiante;

    // 3) Validaciones mínimas
    if (!cedula || !primerNombre || !primerApellido ||
        !direccion || !id_estado || !id_ciudad || !rol) {
      return res
        .status(400)
        .json({
          error:
            'Faltan: cédula, primerNombre, primerApellido, dirección, estado, ciudad o rol.'
        });
    }
    if ((rol === 'estudiante' || rol === 'profesor') && secciones.length === 0) {
      return res
        .status(400)
        .json({ error: 'El rol requiere al menos 1 sección.' });
    }

    // 4) Comprobar que la cédula no exista
    db.query(
      'SELECT id_usuario FROM usuarios WHERE cedula = ?',
      [cedula],
      async (err, rows) => {
        if (err) {
          console.error('Error verificando cédula:', err);
          return res
            .status(500)
            .json({ error: 'Error interno al verificar cédula.' });
        }
        if (rows.length > 0) {
          return res
            .status(400)
            .json({ error: 'Esta cédula ya está registrada.' });
        }

        // 5) Insertar dirección
        db.query(
          'INSERT INTO direccion (direccion, id_ciudad, id_estado) VALUES (?, ?, ?)',
          [direccion, id_ciudad, id_estado],
          async (err, dirResult) => {
            if (err) {
              console.error('Error creando dirección:', err);
              return res
                .status(500)
                .json({ error: 'Error interno al crear dirección.' });
            }
            const id_direccion = dirResult.insertId;

            // 6) Hashear contraseña si viene
            const hashed = contrasena
              ? await hashPassword(contrasena)
              : null;

            // 7) Insertar usuario (11 columnas)
            const sqlUser = `
              INSERT INTO usuarios
                (cedula,
                 primer_nombre,
                 segundo_nombre,
                 primer_apellido,
                 segundo_apellido,
                 telefono,
                 correo,
                 contraseña,
                 rol,
                 id_direccion,
                 id_nivel)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const paramsUser = [
              cedula,
              primerNombre,
              segundoNombre,
              primerApellido,
              segundoApellido,
              telefono,
              correo,
              hashed,
              rol,
              id_direccion,
              id_nivel
            ];

            db.query(sqlUser, paramsUser, (err, userResult) => {
              if (err) {
                console.error('Error insertando usuario:', {
                  message: err.message,
                  code:    err.code,
                  sql:     err.sql
                });
                return res
                  .status(500)
                  .json({ error: 'Error interno al registrar usuario.' });
              }
              const id_usuario = userResult.insertId;

              // 8) Relaciones intermedias
              if (secciones.length) {
                const vs = secciones.map(id_sec => [id_usuario, id_sec]);
                db.query(
                  'INSERT INTO usuario_seccion (id_usuario, id_seccion) VALUES ?',
                  [vs],
                  e => e && console.error('usuario_seccion:', e)
                );
              }
              if (materias.length) {
                const vs = materias.map(id_mat => [id_usuario, id_mat]);
                db.query(
                  'INSERT INTO usuario_materias (id_usuario, id_materia) VALUES ?',
                  [vs],
                  e => e && console.error('usuario_materias:', e)
                );
              }
              if (cursos.length) {
                const vs = cursos.map(id_cur => [id_usuario, id_cur]);
                db.query(
                  'INSERT INTO usuario_cursos (id_usuario, id_curso) VALUES ?',
                  [vs],
                  e => e && console.error('usuario_cursos:', e)
                );
              }

              // 9) Respuesta final
              return res.json({
                message: 'Usuario registrado exitosamente',
                usuario: { id_usuario, cedula, rol, id_nivel }
              });
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Catch /register:', error);
    return res
      .status(500)
      .json({ error: 'Error interno del servidor.' });
  }
});


// Registrar credenciales
app.post('/registrar-credenciales', async (req, res) => {
  try {
    const { id_usuario, correo, contraseña } = req.body;

    // 1) Validaciones básicas
    if (!id_usuario || !correo || !contraseña) {
      return res
        .status(400)
        .json({ error: 'Faltan campos obligatorios: id_usuario, correo o contraseña.' });
    }

    // 2) Formato de correo + fuerza mínima de contraseña
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({ error: 'Formato de correo inválido.' });
    }
    if (contraseña.length < 6) {
      return res
        .status(400)
        .json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    // 3) Verificar que el usuario exista y que aún no tenga correo asignado
    db.query(
      'SELECT correo FROM usuarios WHERE id_usuario = ?',
      [id_usuario],
      async (err, results) => {
        if (err) {
          console.error('Error buscando usuario:', err);
          return res.status(500).json({ error: 'Error interno al buscar usuario.' });
        }
        if (results.length === 0) {
          return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        if (results[0].correo) {
          return res
            .status(400)
            .json({ error: 'Este usuario ya tiene correo asignado.' });
        }

        // 4) Verificar que el correo no esté en uso por otro usuario
        db.query(
          'SELECT id_usuario FROM usuarios WHERE correo = ?',
          [correo],
          async (err2, rows2) => {
            if (err2) {
              console.error('Error validando correo único:', err2);
              return res
                .status(500)
                .json({ error: 'Error interno al verificar correo.' });
            }
            if (rows2.length > 0) {
              return res
                .status(400)
                .json({ error: 'El correo ya está registrado.' });
            }

            // 5) Hash de la contraseña
            const hashed = await hashPassword(contraseña);

            // 6) UPDATE en la tabla usuarios
            db.query(
              'UPDATE usuarios SET correo = ?, contraseña = ? WHERE id_usuario = ?',
              [correo, hashed, id_usuario],
              (err3) => {
                if (err3) {
                  console.error('Error actualizando credenciales:', err3);
                  return res
                    .status(500)
                    .json({ error: 'Error interno al guardar credenciales.' });
                }

                // 7) Respuesta al cliente
                return res.json({
                  message: 'Credenciales registradas correctamente.',
                  usuario: { id_usuario, correo }
                });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error('Catch /registrar-credenciales:', error);
    return res
      .status(500)
      .json({ error: 'Error interno del servidor.' });
  }
  res.json({ message: 'Datos recibidos correctamente' });
});

// Obtener estados
// server.js
app.get('/api/estados', (req, res) => {
  db.query('SELECT id_estado, estados FROM estados ORDER BY estados', (err, results) => {
    if (err) {
      console.error('Error en la consulta de estados:', err);
      return res.status(500).json({ error: 'Error al obtener estados' });
    }
    res.json(results);
  });
});

// Obtener ciudades por estado
app.get('/api/estados/:id/ciudades', (req, res) => {
  const estadoId = req.params.id;
  db.query(
    'SELECT id_ciudad, ciudad FROM ciudades WHERE id_estado = ? ORDER BY ciudad',
    [estadoId],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Error al obtener ciudades' });
      res.json(results);
    }
  );
});

// Obtener materias disponibles
app.get('/api/cursos', (req, res) => {
  db.query('SELECT id_curso, curso FROM cursos WHERE activo = 1', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener cursos' });
    res.json(results);
  });
});

// Obtener cursos disponibles
app.get('/api/cursos/:id/materias', (req, res) => {
  const cursoId = req.params.id;

  const sql = `
    SELECT id_materia, materia 
    FROM materias 
    WHERE activo = 1 AND id_curso = ?
  `;

  db.query(sql, [cursoId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener materias' });
    res.json(results);
  });
});

// Obtener secciones disponibles
app.get('/api/secciones', (req, res) => {
  db.query('SELECT id_seccion, seccion FROM seccion', (err, results) => {
    if (err) {
      console.error('Error en la consulta de secciones:', err);
      return res.status(500).json({ error: 'Error al obtener secciones' });
    }
    res.json(results);
  });
});

app.get('/api/verificar-cedula', (req, res) => {
  const { cedula } = req.query;
  db.query('SELECT id_usuario FROM usuarios WHERE cedula = ?', [cedula], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error en la consulta' });

    if (results.length > 0) {
      res.json({ existe: true, id_usuario: results[0].id_usuario });
    } else {
      res.json({ existe: false });
    }
  });
});


// Obtener secciones disponibles
app.get('/api/secciones', (req, res) => {
  db.query('SELECT id_seccion, nombre FROM secciones', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener secciones' });
    res.json(results);
  });
});

app.get('/api/estudiantes', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  console.log("🔍 Ejecutando consulta SQL...");

  db.query(`
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
    LIMIT ? OFFSET ?;`, 
    [limit, offset], 
    (error, results) => {
      if (error) {
        console.error("❌ Error al obtener estudiantes:", error);
        res.status(500).json({ error: "Error al cargar estudiantes", detalle: error.message });
        return;
      }
      
      // 📌 Limpiar la estructura del JSON para que sea más legible
      const estudiantesFormateados = results.map(est => ({
        id: est.id_usuario,
        cedula: est.cedula,
        nombre: `${est.primerNombre} ${est.primerApellido}`,
        periodoAcademico: est.periodoAcademico || "Sin periodo",
        cursos: est.cursos ? est.cursos.split(" | ") : ["Sin cursos"],
        materias: est.materias ? est.materias.split(" | ") : ["Sin materias"],
        estado: est.estado,
        ultimaConexion: est.ultimaConexion,
      }));

      console.log("🛠 Datos formateados:", estudiantesFormateados);

      res.json({ estudiantes: estudiantesFormateados, currentPage: page });
    }
  );
});




// Login
app.post('/login', async (req, res) => {
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
app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Sesión cerrada' });
  });
});

// Obtener usuario logueado
app.get('/usuario', isAuthenticated, (req, res) => {
  res.json(req.session.usuario);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Servidor backend en http://localhost:${PORT}`));
