import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración para obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importaciones de base de datos y funciones
import db from './db/db.js';
import { hashPassword, comparePassword } from './f(x)/contrasenias.js';
import { syncRelationships, syncSingleRelationship } from './f(x)/relaciones.js';

// Middlewares
import { isAuthenticated } from './middleware/protegerRutas.js';

// Rutas
import rutaLogin from './ruta 5/ruta-login.js';
import rutaComunes from './ruta 5/ruta-comunes.js'; 
import rutaEstudiantes from './ruta 5/ruta-estudiantes.js';
import rutaProfesores from './ruta 5/ruta-profesores.js';
import rutaAcademica from './ruta 5/ruta-academica.js';
import rutaNotas from './ruta 5/ruta-notas.js';

dotenv.config();

const app = express();

// --- Configuración para producción/desarrollo ---
const isProduction = process.env.NODE_ENV === 'production';

// --- Middlewares Globales ---
app.use(cors({
    origin: isProduction
        ? ['TU_DOMINIO_PRODUCCION'] // Cambiar por tu dominio real
        : ['http://localhost:4321', 'http://127.0.0.1:4321'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'gllr_sistema_secreto',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: isProduction, // En producción debe ser true (requiere HTTPS)
        httpOnly: true,
        maxAge: 60 * 60 * 1000 // 60 minutos
    }
}));

// Middleware para debugging de sesión (solo en desarrollo)
if (!isProduction) {
    app.use((req, res, next) => {
        console.log('Sesión actual:', req.session);
        next();
    });
}

// --- Configuración de rutas API ---
app.use('/', rutaLogin); 
app.use('/api', rutaComunes); 
app.use('/api', rutaEstudiantes); 
app.use('/api', rutaProfesores); 
app.use('/api', rutaAcademica); 
app.use('/api', rutaNotas);

// --- Configuración para producción (servir frontend) ---
if (isProduction) {
    // 1. Sirve archivos estáticos de Astro
    app.use(express.static(path.join(__dirname, '../dist')));
    
    // 2. Maneja rutas del frontend (SPA Fallback)
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../dist', 'index.html'));
    });
}

// --- Manejo de errores ---
process.on('uncaughtException', function (err) {
    console.error('UNCAUGHT EXCEPTION:', err);
    // En producción podrías reiniciar el proceso aquí
});

process.on('unhandledRejection', function (reason, promise) {
    console.error('UNHANDLED REJECTION:', reason);
});

// --- Inicio del Servidor ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Servidor ${isProduction ? 'PRODUCCIÓN' : 'desarrollo'} en http://localhost:${PORT}`);
    if (!isProduction) {
        console.log('Frontend corriendo en: http://localhost:4321');
    }
});