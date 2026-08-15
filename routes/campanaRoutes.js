const express = require('express');
const router = express.Router();
const { crearCampana, listarActivas, editarCampana } = require('../controllers/campanaController');
const { verificarToken, verificarAdmin } = require('../middleware/auth');

router.get('/', listarActivas);
router.post('/', verificarToken, verificarAdmin, crearCampana);
router.put('/:id', verificarToken, verificarAdmin, editarCampana);

module.exports = router;