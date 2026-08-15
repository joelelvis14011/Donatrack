const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const campanaRoutes = require('./routes/campanaRoutes');
const donacionRoutes = require('./routes/donacionRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/api/auth', authRoutes);
app.use('/api/campanas', campanaRoutes);
app.use('/api/donaciones', donacionRoutes);
app.use('/api/usuarios', usuarioRoutes);

module.exports = app;
