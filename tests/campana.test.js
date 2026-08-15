const mongoose = require('mongoose');
require('dotenv').config();
const request = require('supertest');
const app = require('../app');
const Usuario = require('../models/Usuario');
const Campana = require('../models/Campana');

const TEST_DB = process.env.MONGO_URI.replace(/\/[^/]+$/, '/donatrack_test');
let tokenAdmin, tokenDonante;

beforeAll(async () => {
  await mongoose.connect(TEST_DB);

  await request(app).post('/api/auth/registro').send({
    nombre: 'Admin Test', email: 'admin@donatrack.com', password: '12345678', rol: 'administrador'
  });
  await request(app).post('/api/auth/registro').send({
    nombre: 'Donante Test', email: 'donante@donatrack.com', password: '12345678'
  });

  const resAdmin = await request(app).post('/api/auth/login').send({ email: 'admin@donatrack.com', password: '12345678' });
  tokenAdmin = resAdmin.body.token;

  const resDonante = await request(app).post('/api/auth/login').send({ email: 'donante@donatrack.com', password: '12345678' });
  tokenDonante = resDonante.body.token;
});

afterEach(async () => {
  await Campana.deleteMany({});
});

afterAll(async () => {
  await Usuario.deleteMany({});
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('HU03 - Crear campaña', () => {
  test('administrador puede crear una campaña', async () => {
    const res = await request(app)
      .post('/api/campanas')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Campaña Test', meta: 1000, fechaLimite: '2026-12-31' });

    expect(res.statusCode).toBe(201);
    expect(res.body.estado).toBe('activa');
    expect(res.body.totalRecaudado).toBe(0);
  });

  test('donante NO puede crear campaña (restricción de rol - HU10)', async () => {
    const res = await request(app)
      .post('/api/campanas')
      .set('Authorization', `Bearer ${tokenDonante}`)
      .send({ nombre: 'Campaña No Autorizada', meta: 1000, fechaLimite: '2026-12-31' });

    expect(res.statusCode).toBe(403);
  });

  test('rechaza crear campaña sin token', async () => {
    const res = await request(app)
      .post('/api/campanas')
      .send({ nombre: 'Sin token', meta: 1000, fechaLimite: '2026-12-31' });

    expect(res.statusCode).toBe(401);
  });
});

describe('HU05 - Listar campañas activas', () => {
  test('devuelve solo campañas con estado activa', async () => {
    await request(app).post('/api/campanas').set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Activa 1', meta: 500, fechaLimite: '2026-12-31' });

    const res = await request(app).get('/api/campanas');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.every(c => c.estado === 'activa')).toBe(true);
  });
});

describe('HU04 - Cerrar campaña', () => {
  test('administrador puede cerrar una campaña', async () => {
    const crear = await request(app).post('/api/campanas').set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Para cerrar', meta: 500, fechaLimite: '2026-12-31' });

    const res = await request(app)
      .put(`/api/campanas/${crear.body._id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'cerrada' });

    expect(res.statusCode).toBe(200);
    expect(res.body.estado).toBe('cerrada');
  });
});
