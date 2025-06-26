# Documentación del Backend (`/server`)

## 1. Descripción General

El backend de este proyecto está construido con **Node.js** y **Express**. Su función principal es gestionar la lógica de negocio, la autenticación, la gestión de usuarios (estudiantes, profesores, etc.), y la comunicación con una base de datos **MySQL**. Expone una API REST que es consumida por el frontend.

---

## 2. Estructura de Carpetas y Archivos

```
/server
│
├── server.js                # Archivo principal del servidor Express
├── db/
│   └── db.js                # Configuración y conexión a la base de datos MySQL
├── f(x)/
│   ├── contrasenias.js      # Funciones para hashear y comparar contraseñas
│   └── relaciones.js        # Funciones para sincronizar relaciones en la base de datos
├── middleware/
│   └── protegerRutas.js     # Middleware para proteger rutas (autenticación)
├── ruta 5/
│   ├── ruta-login.js        # Rutas relacionadas con login y autenticación
│   ├── ruta-comunes.js      # Rutas comunes para la aplicación
│   ├── ruta-estudiantes.js  # Rutas específicas para estudiantes
│   ├── ruta-profesores.js   # Rutas específicas para profesores
│   ├── ruta-academica.js    # Rutas relacionadas con la gestión académica
│   └── ruta-notas.js        # Rutas para la gestión de notas
```

---

## 3. Dependencias

Principales dependencias utilizadas en el backend:

- **express**: Framework para crear el servidor y definir rutas.
- **cors**: Middleware para habilitar CORS.
- **dotenv**: Manejo de variables de entorno.
- **express-session**: Manejo de sesiones de usuario.
- **mysql2**: Cliente para conectarse a bases de datos MySQL.
- **bcrypt**: Para hashear y comparar contraseñas.

---

## 4. Requisitos Previos

- **Node.js** (versión recomendada: 14.x o superior)
- **NPM** (gestor de paquetes de Node.js)
- **MySQL** (servidor de base de datos)
- **Git** (opcional, para clonar el repositorio)

---

## 5. Instalación y Ejecución

> **Nota:** Este backend está diseñado para ejecutarse en un entorno local utilizando **saxapp** como servidor local. Debes tener saxapp instalado y configurado si tu flujo de trabajo lo requiere.

1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Configura las variables de entorno (ver sección siguiente).
3. Inicia el servidor backend:
   ```bash
   cd server
   node server.js
   ```
   El servidor se ejecutará por defecto en `http://localhost:3001` (o el puerto definido en la variable de entorno `PORT`).

---

## 6. Variables de Entorno

El backend utiliza variables de entorno para la configuración de la base de datos y el puerto del servidor. Debes crear un archivo `.env` en la carpeta `/server` con el siguiente contenido de ejemplo:

```env
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=sistema_escolar
```

---

## 7. Conexión a la Base de Datos

La conexión a la base de datos se realiza en `db/db.js` usando el paquete `mysql2`. Los parámetros de conexión (host, usuario, contraseña, nombre de la base) se obtienen de las variables de entorno.

Ejemplo de conexión:
```js
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sistema_escolar'
});
```

---

## 8. Endpoints Principales

Las rutas del backend están organizadas en diferentes archivos dentro de la carpeta `ruta 5/`. Se agrupan por funcionalidad:

- **/ (ruta-login.js):** Maneja el login y autenticación de usuarios.
- **/api (ruta-comunes.js):** Rutas comunes para la aplicación.
- **/api (ruta-estudiantes.js):** Funcionalidades específicas para estudiantes.
- **/api (ruta-profesores.js):** Funcionalidades específicas para profesores.
- **/api (ruta-academica.js):** Gestión académica (materias, secciones, etc.).
- **/api (ruta-notas.js):** Gestión de notas y calificaciones.

> Para detalles de cada endpoint, consulta los archivos correspondientes en `server/ruta 5/`.

---

## 9. Middlewares y Utilidades

- **protegerRutas.js:** Middleware que verifica si el usuario está autenticado antes de permitir el acceso a ciertas rutas.
  ```js
  function isAuthenticated(req, res, next) {
      if (req.session.usuario) return next();
      return res.status(401).json({ error: 'No autenticado' });
  }
  ```
- **contrasenias.js:** Funciones para hashear y comparar contraseñas usando bcrypt.
- **relaciones.js:** Funciones para sincronizar relaciones muchos-a-muchos y uno-a-uno en la base de datos.

---

## 10. Otros Detalles Útiles

- El servidor utiliza sesiones para manejar la autenticación.
- El middleware de CORS permite el acceso desde `http://localhost:4321` y `http://127.0.0.1:4321` (útil para desarrollo local).
- Hay middlewares para parsear JSON y para debug de sesión.
- El servidor maneja errores globales con `process.on('uncaughtException')` y `process.on('unhandledRejection')`.

--- 

> ⚠️ Este proyecto esta en constante cambio aún