const express = require('express');
const router = express.Router();
const { listarDonantes } = require('../controllers/usuarioController');
const { verificarToken, verificarAdmin } = require('../middleware/auth');

router.get('/donantes', verificarToken, verificarAdmin, listarDonantes);

module.exports = router;
