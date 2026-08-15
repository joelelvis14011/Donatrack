const mongoose = require('mongoose');

const campanaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String },
  meta: { type: Number, required: true },
  totalRecaudado: { type: Number, default: 0 },
  fechaLimite: { type: Date, required: true },
  estado: { type: String, enum: ['activa', 'cerrada'], default: 'activa' },
  fechaCreacion: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Campana', campanaSchema);