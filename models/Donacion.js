const mongoose = require('mongoose');

const donacionSchema = new mongoose.Schema({
  donante: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  campana: { type: mongoose.Schema.Types.ObjectId, ref: 'Campana', required: true },
  monto: { type: Number, required: true, min: 0.01 },
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Donacion', donacionSchema);