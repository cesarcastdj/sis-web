import db from '../db/db.js';

export const registrarAccion = (accion, tabla = null) => {
  return async (req, res, next) => {
    try {
      // Guardamos la referencia a la función original de res.json
      const originalJson = res.json;
      
      // Sobrescribimos res.json para interceptar la respuesta
      res.json = async (body) => {
        // Solo registrar si la acción fue exitosa (código 2xx)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const usuarioId = req.session?.usuario?.id || null;
          const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
          const fechaHora = new Date().toISOString().slice(0, 19).replace('T', ' ');
          
          // Determinar el ID del registro afectado
          const idRegistroAfectado = req.params?.id || null;
          
          // Datos para el historial
          let datosAnteriores = null;
          let datosNuevos = null;
          
          // Para PUT/PATCH, capturamos cambios
          if (['PUT', 'PATCH'].includes(req.method)) {
            datosAnteriores = JSON.stringify(req.datosAnteriores || {});
            datosNuevos = JSON.stringify(body);
          }
          // Para DELETE, solo datos anteriores
          else if (req.method === 'DELETE') {
            datosAnteriores = JSON.stringify(req.datosAnteriores || {});
          }
          // Para POST, solo datos nuevos
          else if (req.method === 'POST') {
            datosNuevos = JSON.stringify(body);
          }
          
          // Insertar en el historial
          await db.promise().query(
            'INSERT INTO historial_acciones (id_usuario, accion, tabla_afectada, id_registro_afectado, datos_anteriores, datos_nuevos, fecha_hora, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [usuarioId, accion, tabla, idRegistroAfectado, datosAnteriores, datosNuevos, fechaHora, ip]
          );
        }
        
        // Llamar a la función original
        originalJson.call(res, body);
      };
      
      // Para PUT/PATCH/DELETE, obtener datos anteriores
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