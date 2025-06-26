# Documentación del Frontend

> ## Hala Madrid

## 1. Descripción General

El frontend de este proyecto está construido con **Astro**. Su objetivo es proveer una interfaz moderna y responsiva para la gestión escolar, consumiendo la API REST del backend.

---

## 2. Estructura de Carpetas y Archivos

```
/src
│
├── pages/                # Páginas principales del sitio (rutas)
│   ├── index.astro
│   ├── Admin-Control/
│   ├── Profesor-Control/
│   └── Students-Control/
├── components/           # Componentes reutilizables de la UI
│   ├── Sidebar.astro
│   ├── NavigationBar.astro
│   ├── Welcome.astro
│   ├── components-admin/
│   ├── components-profesor/
│   └── components-students/
├── layouts/              # Layouts base para las páginas
│   ├── LayoutWelcome.astro
│   ├── Admin/
│   ├── Profesor/
│   └── Students/
├── style/                # Archivos de estilos CSS
│   ├── global.css
│   ├── Sidebar.css
│   ├── NavigationBar.css
│   ├── welcome.css
│   ├── variables.css
│   ├── style-admin/
│   ├── style-profesor/
│   └── style-students/
├── js/                   # Scripts JavaScript adicionales
│   └── SidebarFuntion.js
├── ts/                   # Scripts TypeScript adicionales
│   └── SidebarFuntion.ts
├── types/                # Definiciones de tipos TypeScript
│   ├── product.d.ts
│   └── user.d.ts
```

---

## 3. Dependencias y Tecnologías

- **Astro**: Framework principal para el desarrollo del frontend.
- **React**: Para componentes interactivos.
- **Bootstrap** y **Boxicons**: Para estilos y uso de iconos.
- **TypeScript**: Soporte para tipado estático.
- **CSS**: Estilos personalizados y globales.

---

## 4. Requisitos Previos

- **Node.js** (recomendado 14.x o superior)
- **NPM**
- **Git** (opcional, para clonar el repositorio)

---

## 5. Instalación y Ejecución

1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Inicia tanto el frontend como el backend con un solo comando:
   ```bash
   npm run dev
   ```
   Esto ejecutará el frontend en `http://localhost:4321` y el backend en `http://localhost:3001` (por defecto).

   > ⚠️ **NOTA** Si el backend no inicia con `npm run dev`, puedes iniciarlo manualmente con:
   > ```bash
   > cd server
   > node server.js
   > ```

   - Control + C: para detener el servidor local

3. Otros comandos útiles:

| Comando                | Acción                                               |
|------------------------|-----------------------------------------------------|
| `npm run build`        | Compila el sitio para producción en `./dist/`       |
| `npm run preview`      | Previsualiza el sitio compilado localmente          |
| `npm run astro ...`    | Ejecuta comandos de la CLI de Astro                 |

---

## 6. Organización de Rutas y Páginas

- Las páginas principales están en `/src/pages/`.
- Hay subcarpetas para cada tipo de usuario o panel:
  - **Admin-Control**: Panel de administración.
  - **Profesor-Control**: Panel de profesores.
  - **Students-Control**: Panel de estudiantes.
- El archivo `index.astro` es la página de inicio.

---

## 7. Componentes y Layouts

- Los componentes reutilizables están en `/src/components/`.
- Hay componentes específicos para cada tipo de usuario.
- Los layouts base están en `/src/layouts/` y definen la estructura general de las páginas.

---

## 8. Estilos

- Los estilos globales están en `/src/style/global.css`.
- Hay archivos CSS específicos para componentes y vistas.
- Se utilizan variables CSS para mantener la consistencia visual.

---

## 9. Integración con el Backend

- El frontend consume la API REST expuesta por el backend (por defecto en `http://localhost:3001`).
- Asegúrate de tener ambos servidores (frontend y backend) corriendo para el funcionamiento completo.

---

## 10. Otros Detalles Útiles

- El proyecto soporta TypeScript, aunque su uso es opcional.
- Puedes agregar nuevos componentes, páginas o estilos siguiendo la estructura existente.
- Para más información sobre Astro: [Astro Docs](https://docs.astro.build/)

---
