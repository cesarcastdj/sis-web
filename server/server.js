import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';

import db from './db/db.js'; // Conexión a la base de datos
import { hashPassword, comparePassword } from './f(x)/contrasenias.js'; // Funciones de contraseñas y eso
import { syncRelationships, syncSingleRelationship } from './f(x)/relaciones.js'; // Relaciones pa

// Middlewares
import { isAuthenticated } from './middleware/protegerRutas.js'; // Middleware de autenticación

// Rutas
import rutaLogin from './ruta 5/ruta-login.js';
import rutaComunes from './ruta 5/ruta-comunes.js'; 
import rutaEstudiantes from './ruta 5/ruta-estudiantes.js';
import rutaProfesores from './ruta 5/ruta-profesores.js';
import rutaAcademica from './ruta 5/ruta-academica.js';
import rutaNotas from './ruta 5/ruta-notas.js';

dotenv.config();

const app = express(); 

// --- Middlewares Globales ---
app.use(cors({
    origin: ['http://localhost:4321', 'http://127.0.0.1:4321'], // Permitir ambos localhost y 127.0.0.1
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json()); // Para parsear JSON en el cuerpo de las peticiones
app.use(session({
    secret: 'gllr_sistema_secreto',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // set to true if using https
        httpOnly: true,
        maxAge: 60 * 60 * 1000 // 60 minutos
    }
}));

// Middleware para debugging de sesión
app.use((req, res, next) => {
    console.log('Sesión actual:', req.session);
    next();
});

app.use('/', rutaLogin); 
app.use('/api', rutaComunes); 
app.use('/api', rutaEstudiantes); 
app.use('/api', rutaProfesores); 
app.use('/api', rutaAcademica); 
app.use('/api', rutaNotas); 

// --- Inicio del Servidor ---
const PORT = process.env.PORT || 3001; 
app.listen(PORT, () => console.log(`🚀 Servidor backend en http://localhost:${PORT}`));

process.on('uncaughtException', function (err) {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', function (reason, promise) {
  console.error('UNHANDLED REJECTION:', reason);
});

//hala madrid