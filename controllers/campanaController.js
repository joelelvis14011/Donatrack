const Campana = require('../models/Campana');

// HU03: Crear campaña
exports.crearCampana = async (req, res) => {
  try {
    const { nombre, descripcion, meta, fechaLimite } = req.body;
    const campana = new Campana({ nombre, descripcion, meta, fechaLimite });
    await campana.save();
    res.status(201).json(campana);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear campaña', error: error.message });
  }
};

// HU05: Ver campañas activas
exports.listarActivas = async (req, res) => {
  try {
    const campanas = await Campana.find({ estado: 'activa' });
    res.json(campanas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar campañas', error: error.message });
  }
};

// HU04: Editar o cerrar campaña
exports.editarCampana = async (req, res) => {
  try {
    const campana = await Campana.findById(req.params.id);
    if (!campana) return res.status(404).json({ mensaje: 'Campaña no encontrada' });

    Object.assign(campana, req.body);
    await campana.save();
    res.json(campana);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al editar campaña', error: error.message });
  }
};