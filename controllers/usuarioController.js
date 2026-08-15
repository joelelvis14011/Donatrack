const Usuario = require('../models/Usuario');
const Donacion = require('../models/Donacion');

// HU09: Listar donantes registrados con su total donado
exports.listarDonantes = async (req, res) => {
  try {
    const donantes = await Usuario.find({ rol: 'donante' }).select('nombre email fechaRegistro');

    const donantesConTotal = await Promise.all(
      donantes.map(async (donante) => {
        const donaciones = await Donacion.find({ donante: donante._id });
        const totalDonado = donaciones.reduce((sum, d) => sum + d.monto, 0);
        return {
          _id: donante._id,
          nombre: donante.nombre,
          email: donante.email,
          fechaRegistro: donante.fechaRegistro,
          totalDonado
        };
      })
    );

    res.json(donantesConTotal);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar donantes', error: error.message });
  }
};
