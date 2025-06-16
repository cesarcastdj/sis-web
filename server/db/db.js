// server/db.js
import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sistema_escolar'
});

/*
CREATE TABLE IF NOT EXISTS comentarios (
  id_comentario INT AUTO_INCREMENT PRIMARY KEY,
  id_estudiante INT NOT NULL,
  id_actividad INT NOT NULL,
  comentario TEXT NOT NULL,
  fecha_comentario TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_estudiante) REFERENCES usuarios(id_usuario),
  FOREIGN KEY (id_actividad) REFERENCES actividades(id_actividad)
);
*/

db.connect((err) => {
  if (err) {
    console.error('❌ Error al conectar a MySQL:', err);
    return;
  }
  console.log('✅ Conexión exitosa a la base de datos');
});

export default db;
