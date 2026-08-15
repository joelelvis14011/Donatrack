const Donacion = require('../models/Donacion');
const Campana = require('../models/Campana');

// HU06: Registrar donación
exports.registrarDonacion = async (req, res) => {
  try {
    const { campana, monto } = req.body;
    const donante = req.usuario.id;

    if (monto <= 0) {
      return res.status(400).json({ mensaje: 'El monto debe ser mayor a 0' });
    }

    const campanaEncontrada = await Campana.findById(campana);
    if (!campanaEncontrada || campanaEncontrada.estado !== 'activa') {
      return res.status(400).json({ mensaje: 'La campaña no está activa o no existe' });
    }

    const donacion = new Donacion({ donante, campana, monto });
    await donacion.save();

    campanaEncontrada.totalRecaudado += monto;
    await campanaEncontrada.save();

    res.status(201).json(donacion);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al registrar donación', error: error.message });
  }
};

// HU07: Historial de donaciones del usuario autenticado
exports.miHistorial = async (req, res) => {
  try {
    const donaciones = await Donacion.find({ donante: req.usuario.id }).populate('campana', 'nombre');
    res.json(donaciones);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener historial', error: error.message });
  }
};

// HU08: Reporte de donaciones por campaña
exports.reportePorCampana = async (req, res) => {
  try {
    const campana = await Campana.findById(req.params.id);
    if (!campana) return res.status(404).json({ mensaje: 'Campaña no encontrada' });

    const donaciones = await Donacion.find({ campana: req.params.id });
    const numDonantes = new Set(donaciones.map(d => d.donante.toString())).size;
    const porcentaje = ((campana.totalRecaudado / campana.meta) * 100).toFixed(2);

    res.json({
      campana: campana.nombre,
      totalRecaudado: campana.totalRecaudado,
      numeroDonantes: numDonantes,
      porcentajeMeta: `${porcentaje}%`
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al generar reporte', error: error.message });
  }
};