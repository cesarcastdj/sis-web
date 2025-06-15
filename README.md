# Ejecución

Para hacer que el proyecto se ejecute es necesario tener lo siguiente:

- Node.js
- NPM
- Git

---

## Hala Madrid

## Instalar dependencias y astro

npm i (colocar i es igual que colocar install) astro bcrypt boostrap boxicons cors dotenv express express-session mysql mysql2 node react react-dom

## Inicializar el fronted del proyecto en la terminal

- npm run dev

## Iniciar el servidor para el proyecto

-Ten 2 terminales abiertas para correr el servidor y la parte del fronted
-Ingresar a la carpeta server para eso debes de colocar en la consola cd server
-Luego de eso colocar node server.js

## Inicializar TypeScript

tsc

tsc --watch

Control + C: para detener el servidor local

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## Actualizaciones recientes

### Funcionalidad de descarga de notas en PDF

Se implementó una nueva funcionalidad en el archivo `Estudiantes-notas.astro` que permite a los usuarios descargar las notas como un archivo PDF. Esto se logró utilizando la biblioteca `jsPDF`. Los pasos realizados incluyen:

1. **Integración de jsPDF**:

   - Se cargó la biblioteca `jsPDF` desde un CDN para garantizar su disponibilidad en el navegador.
   - Se configuró el código para generar un archivo PDF con los datos de las notas mostradas en la tabla.

2. **Generación de PDF**:

   - Se agregó un encabezado al PDF con el título "Reporte de Notas".
   - Se iteraron las filas de la tabla para incluir los datos en el archivo PDF.

3. **Manejo de errores**:
   - Se implementó manejo de errores para garantizar que el PDF se genere correctamente incluso si hay problemas con los datos o la biblioteca.

### Cómo probar la funcionalidad

- Navega a la sección de notas del estudiante.
- Haz clic en el botón "Descargar Notas".
- Verifica que el archivo PDF generado incluya los datos de la tabla de notas.

### Dependencias

- Se utilizó la biblioteca `jsPDF` para la generación de PDF.
- No se requiere instalación adicional, ya que la biblioteca se carga desde un CDN.
