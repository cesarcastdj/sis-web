import db from '../db/db.js';

// Versión corregida del middleware
export const registrarAccion = (accion, tabla = null) => {
  return async (req, res, next) => {
    try {
      const originalJson = res.json;
      
      res.json = async (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const usuarioId = req.session?.usuario?.id || body?.usuario?.id_usuario || null;
          const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
          const fechaHora = new Date().toISOString().slice(0, 19).replace('T', ' ');
          
          let idRegistroAfectado = req.params?.id || null;
          
          if (req.method === 'POST' && body?.usuario?.id_usuario) {
            idRegistroAfectado = body.usuario.id_usuario;
          }
          
          let datosNuevos = null;
          let datosAnteriores = null;

          // Determinar qué datos guardar según el método HTTP
          if (['PUT', 'PATCH'].includes(req.method)) {
            datosAnteriores = JSON.stringify(req.datosAnteriores || {});
            datosNuevos = JSON.stringify(body);
          } else if (req.method === 'DELETE') {
            datosAnteriores = JSON.stringify(req.datosAnteriores || {});
          } else if (req.method === 'POST') {
            datosNuevos = JSON.stringify(body);
          }
          
          // Solo una inserción aquí
          try {
            await db.promise().query(
              'INSERT INTO historial_acciones (id_usuario, accion, tabla_afectada, id_registro_afectado, datos_anteriores, datos_nuevos, fecha_hora, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [usuarioId, accion, tabla, idRegistroAfectado, datosAnteriores, datosNuevos, fechaHora, ip]
            );
          } catch (dbError) {
            console.error('Error al registrar acción:', dbError);
          }
        }
        
        originalJson.call(res, body);
      };
      
      // Obtener datos anteriores para PUT/PATCH/DELETE
      if (['PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        if (tabla && req.params?.id) {
          const [rows] = await db.promise().query(`SELECT * FROM ${tabla} WHERE id_${tabla} = ?`, [req.params.id]);
          if (rows.length > 0) {
            req.datosAnteriores = rows[0];
          }
        }
      }
      
      next();
    } catch (error) {
      console.error('Error en middleware de historial:', error);
      next();
    }
  };
};