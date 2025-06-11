// src/f(x)/relaciones.js

/**
 * Sincroniza relaciones en una tabla de relación muchos a muchos.
 * Elimina las relaciones existentes para el primaryId y añade las nuevas.
 *
 * @param {object} connection - La conexión activa a la base de datos (requiere db.promise().getConnection() y transacciones).
 * @param {string} relationTable - El nombre de la tabla de relación (ej. 'usuario_materias').
 * @param {string} primaryForeignKeyField - El campo de la clave foránea del ID principal en la tabla de relación (ej. 'id_materia' si estás sincronizando usuarios para una materia).
 * @param {string} relatedIdField - El campo del ID relacionado en la tabla de relación (ej. 'id_usuario').
 * @param {number} primaryId - El ID del registro principal (ej. id_materia).
 * @param {Array<number>} newRelatedIds - Un array de IDs relacionados a sincronizar (ej. [id_usuario1, id_usuario2]).
 * @param {string} [roleFilter=null] - Opcional. El rol a filtrar si la tabla de relación también contiene roles (ej. 'estudiante' o 'profesor'). Requiere un JOIN a la tabla de usuarios.
 */
export async function syncRelationships(connection, relationTable, primaryForeignKeyField, relatedIdField, primaryId, newRelatedIds, roleFilter = null) {
  console.log(`\n--- DEBUG: Inicia sincronización (Muchos a Muchos) para ${relationTable} ---`);
  console.log(`DEBUG: Primary ID (${primaryForeignKeyField}): ${primaryId}`);
  console.log(`DEBUG: New Related IDs (incoming from frontend):`, newRelatedIds);
  console.log(`DEBUG: Role Filter:`, roleFilter);

  // 1. Obtener los IDs relacionados actuales para el primaryId, filtrando por rol si aplica
  let selectSql = `SELECT um.${relatedIdField} FROM ${relationTable} um`;
  let selectParams = [primaryId];
  if (roleFilter) {
      selectSql += ` JOIN usuarios u ON um.${relatedIdField} = u.id_usuario WHERE um.${primaryForeignKeyField} = ? AND u.rol = ?`;
      selectParams.push(roleFilter);
  } else {
      selectSql += ` WHERE um.${primaryForeignKeyField} = ?`;
  }
  
  const [currentRelations] = await connection.query(selectSql, selectParams);
  const currentIds = new Set(currentRelations.map(row => String(row[relatedIdField]))); // Convertir a string para comparación consistente
  const incomingIds = new Set(newRelatedIds.map(String)); // Asegurar que los IDs entrantes también sean strings

  console.log(`DEBUG: Current IDs in DB (Set):`, [...currentIds]);
  console.log(`DEBUG: Incoming IDs from request (Set):`, [...incomingIds]);

  const toAdd = [...incomingIds].filter(id => !currentIds.has(id));
  const toRemove = [...currentIds].filter(id => !incomingIds.has(id));

  console.log(`DEBUG: Elements to ADD:`, toAdd);
  console.log(`DEBUG: Elements to REMOVE:`, toRemove);

  // 2. Eliminar relaciones que ya no están presentes
  if (toRemove.length > 0) {
      let deleteSql = `DELETE FROM ${relationTable} WHERE ${primaryForeignKeyField} = ? AND ${relatedIdField} IN (?)`;
      let deleteParams = [primaryId, toRemove];

      if (roleFilter) {
          // Si hay filtro por rol, la eliminación debe ser más específica para no borrar otros roles
          deleteSql = `
              DELETE um FROM ${relationTable} um
              JOIN usuarios u ON um.${relatedIdField} = u.id_usuario
              WHERE um.${primaryForeignKeyField} = ? AND um.${relatedIdField} IN (?) AND u.rol = ?;
          `;
          deleteParams = [primaryId, toRemove, roleFilter];
      }
      
      await connection.query(deleteSql, deleteParams);
      console.log(`DEBUG: ✅ Deleted from ${relationTable}:`, toRemove);
  } else {
      console.log(`DEBUG: ℹ️ No elements to REMOVE from ${relationTable}.`);
  }

  // 3. Insertar nuevas relaciones
  if (toAdd.length > 0) {
      // La tabla usuario_materias tiene (id_usuario, id_materia).
      // Si primaryForeignKeyField es 'id_materia', entonces primaryId es el ID de la materia.
      // Los newRelatedIds son los ID de los usuarios.
      // Así que la tupla a insertar siempre será [id_usuario, id_materia].
      const valuesToInsert = toAdd.map(relatedId => [relatedId, primaryId]);

      const insertSql = `INSERT INTO ${relationTable} (${relatedIdField}, ${primaryForeignKeyField}) VALUES ?`;
      await connection.query(insertSql, [valuesToInsert]);
      console.log(`DEBUG: ✅ Added to ${relationTable}:`, toAdd);
  } else {
      console.log(`DEBUG: ℹ️ No elements to ADD to ${relationTable}.`);
  }
  console.log(`--- DEBUG: Finaliza sincronización (Muchos a Muchos) para ${relationTable} ---\n`);
}


/**
* Sincroniza una única relación. Útil para campos que son FK directos (1 a 1, o 1 a Muchos),
* donde un registro principal solo puede tener UNA relación específica con otro ID.
* Ejemplo: un usuario tiene UNA sección principal.
*
* @param {object} connection - La conexión activa a la base de datos (requiere db.promise().getConnection() y transacciones).
* @param {number} primaryId - El ID del registro principal (ej. id_usuario).
* @param {Array<number>} newIdArray - Un array que contiene el nuevo ID relacionado (ej. [id_seccion]). Puede ser vacío o null para desasignar.
* @param {string} tableName - El nombre de la tabla de relación (ej. 'usuario_seccion').
* @param {string} primaryForeignKeyField - El campo de la clave foránea del ID principal en la tabla de relación (ej. 'id_usuario').
* @param {string} relatedIdField - El campo del ID relacionado en la tabla de relación (ej. 'id_seccion').
*/
export async function syncSingleRelationship(connection, primaryId, newIdArray, tableName, primaryForeignKeyField, relatedIdField) {
  // newIdArray puede ser [], [id], o null. Lo convertimos a un único ID o null.
  const newId = (newIdArray && newIdArray.length > 0) ? String(newIdArray[0]) : null;

  console.log(`\n--- DEBUG: Inicia sincronización (Uno a Uno) para ${tableName} ---`);
  console.log(`DEBUG: Primary ID (${primaryForeignKeyField}): ${primaryId}`);
  console.log(`DEBUG: New ID (incoming from frontend array):`, newId);

  // Obtener la relación existente para el primaryId
  const [currentRelations] = await connection.query(
      `SELECT ${relatedIdField} FROM ${tableName} WHERE ${primaryForeignKeyField} = ?`,
      [primaryId]
  );
  const currentAssignedId = currentRelations.length > 0 ? String(currentRelations[0][relatedIdField]) : null;

  console.log(`DEBUG: Current assigned ID in DB:`, currentAssignedId);

  if (newId) { // Hay un nuevo ID para asignar
      if (currentAssignedId) { // Ya existe una relación
          if (currentAssignedId !== newId) { // La relación ha cambiado
              await connection.query(
                  `UPDATE ${tableName} SET ${relatedIdField} = ? WHERE ${primaryForeignKeyField} = ?`,
                  [newId, primaryId]
              );
              console.log(`DEBUG: ✅ Updated ${tableName} for ${primaryForeignKeyField} ${primaryId} from ${currentAssignedId} to ${newId}.`);
          } else {
              console.log(`DEBUG: ℹ️ ${tableName} for ${primaryForeignKeyField} ${primaryId} already set to ${newId}. No change needed.`);
          }
      } else { // No existe relación, insertar una nueva
          await connection.query(
              `INSERT INTO ${tableName} (${primaryForeignKeyField}, ${relatedIdField}) VALUES (?, ?)`,
              [primaryId, newId]
          );
          console.log(`DEBUG: ✅ Inserted new entry in ${tableName} for ${primaryForeignKeyField} ${primaryId} with ID ${newId}.`);
      }
  } else { // newId es null, lo que significa que la relación debe ser eliminada
      if (currentAssignedId) { // Existe una relación que debe ser eliminada
          await connection.query(
              `DELETE FROM ${tableName} WHERE ${primaryForeignKeyField} = ?`,
              [primaryId]
          );
          console.log(`DEBUG: ✅ Deleted existing entry in ${tableName} for ${primaryForeignKeyField} ${primaryId}.`);
      } else {
          console.log(`DEBUG: ℹ️ No existing entry in ${tableName} to delete for ${primaryForeignKeyField} ${primaryId}.`);
      }
  }
  console.log(`--- DEBUG: Finaliza sincronización (Uno a Uno) para ${tableName} ---\n`);
}

