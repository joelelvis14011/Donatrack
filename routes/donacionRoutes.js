const express = require('express');
const router = express.Router();
const { registrarDonacion, miHistorial, reportePorCampana } = require('../controllers/donacionController');
const { verificarToken, verificarAdmin } = require('../middleware/auth');

router.post('/', verificarToken, registrarDonacion);
router.get('/mi-historial', verificarToken, miHistorial);
router.get('/reporte/:id', verificarToken, verificarAdmin, reportePorCampana);

module.exports = router;