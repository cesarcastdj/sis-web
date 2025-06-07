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

// Registro de usuarios con notificación
app.post('/register', async (req, res) => {
  try {
    const {
      cedula, primerNombre, segundoNombre = null,
      primerApellido, segundoApellido = null,
      correo = null, telefono = null, direccion,
      id_estado, id_ciudad, contraseña, ultima_conexion = null
    } = req.body;

    // 📌 Validar campos obligatorios
    if (!cedula || !primerNombre || !primerApellido || !direccion || !id_estado || !id_ciudad) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
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
          const hashed = contraseña ? await hashPassword(contraseña) : null;

          // 📌 Asignar valores por defecto
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

// Esta es una api para terminar el registro de un usuario
app.post('/asignar-usuario', async (req, res) => {
  try {
    const { id_usuario, rol, secciones, cursos, materias } = req.body;

    // 📌 Asignar nivel según el rol
    const niveles = { admin: 1, profesor: 2, estudiante: 3 };
    const id_nivel = niveles[rol];

    db.query('UPDATE usuarios SET rol = ?, id_nivel = ? WHERE id_usuario = ?', 
      [rol, id_nivel, id_usuario], (err) => {
        if (err) return res.status(500).json({ error: 'Error asignando usuario.' });

        // 📌 Guardar relaciones en usuario_seccion, usuario_cursos, usuario_materias
        if (secciones.length) {
          db.query('INSERT INTO usuario_seccion (id_usuario_seccion, id_usuario, id_seccion) VALUES ?', 
            [secciones.map(id_sec => [id_usuario_seccion, id_usuario, id_sec])]);
        }
        if (materias.length) {
          db.query('INSERT INTO usuario_materias (id_usuario_materia, id_usuario, id_materia) VALUES ?', 
            [materias.map(id_mat => [id_usuario_materia, id_usuario, id_mat])]);
        }
        if (cursos.length) {
          db.query('INSERT INTO usuario_cursos (id_usuario_curso, id_usuario  , id_curso, fecha_inscripcion) VALUES ?', 
            [cursos.map(id_cur => [id_usuario_curso, id_usuario, id_cur, fecha_inscripcion])]);
        }

        // 📌 Marcar la notificación como "procesada"
        db.query('UPDATE notificaciones SET estado = "procesado" WHERE id_usuario = ?', [id_usuario]);

        res.json({ message: 'Usuario asignado correctamente.' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Obtener notificaciones pendientes
app.get('/api/notificaciones', (req, res) => {
  db.query(`
    SELECT 
      n.id_notificacion,
      n.id_usuario,
      u.primer_nombre,
      u.primer_apellido,
      u.cedula,
      n.mensaje,
      n.fecha,
      n.estado
    FROM notificaciones n
    JOIN usuarios u ON n.id_usuario = u.id_usuario
    WHERE n.estado = 'pendiente'
    ORDER BY n.fecha DESC;
  `, (err, results) => {
    if (err) {
      console.error("Error obteniendo notificaciones:", err);
      return res.status(500).json({ error: "Error al obtener notificaciones" });
    }
    res.json({ notificaciones: results });
  });
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

app.get('/api/verificar-correo', (req, res) => {
  const { email } = req.query;
  db.query('SELECT id_usuario FROM usuarios WHERE correo = ?', [email], (err, results) => {
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
