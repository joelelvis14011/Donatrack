const mongoose = require('mongoose');
require('dotenv').config();
const request = require('supertest');
const app = require('../app');
const Usuario = require('../models/Usuario');
const Campana = require('../models/Campana');
const Donacion = require('../models/Donacion');

const TEST_DB = process.env.MONGO_URI.replace(/\/[^/]+$/, '/donatrack_test');
let tokenDonante, campanaId;

beforeAll(async () => {
  await mongoose.connect(TEST_DB);

  await request(app).post('/api/auth/registro').send({
    nombre: 'Admin D', email: 'admind@donatrack.com', password: '12345678', rol: 'administrador'
  });
  await request(app).post('/api/auth/registro').send({
    nombre: 'Donante D', email: 'donanted@donatrack.com', password: '12345678'
  });

  const resAdmin = await request(app).post('/api/auth/login').send({ email: 'admind@donatrack.com', password: '12345678' });
  const resDonante = await request(app).post('/api/auth/login').send({ email: 'donanted@donatrack.com', password: '12345678' });
  tokenDonante = resDonante.body.token;

  const campana = await request(app).post('/api/campanas')
    .set('Authorization', `Bearer ${resAdmin.body.token}`)
    .send({ nombre: 'Campaña Donaciones', meta: 1000, fechaLimite: '2026-12-31' });
  campanaId = campana.body._id;
});

afterEach(async () => {
  await Donacion.deleteMany({});
  await Campana.updateOne({ _id: campanaId }, { totalRecaudado: 0 });
});

afterAll(async () => {
  await Usuario.deleteMany({});
  await Campana.deleteMany({});
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('HU06 - Registrar donación', () => {
  test('donante registra una donación válida', async () => {
    const res = await request(app)
      .post('/api/donaciones')
      .set('Authorization', `Bearer ${tokenDonante}`)
      .send({ campana: campanaId, monto: 150 });

    expect(res.statusCode).toBe(201);
    expect(res.body.monto).toBe(150);
  });

  test('rechaza monto menor o igual a 0', async () => {
    const res = await request(app)
      .post('/api/donaciones')
      .set('Authorization', `Bearer ${tokenDonante}`)
      .send({ campana: campanaId, monto: 0 });

    expect(res.statusCode).toBe(400);
    expect(res.body.mensaje).toMatch(/mayor a 0/i);
  });

  test('actualiza el totalRecaudado de la campaña', async () => {
    await request(app).post('/api/donaciones').set('Authorization', `Bearer ${tokenDonante}`)
      .send({ campana: campanaId, monto: 200 });

    const res = await request(app).get('/api/campanas');
    const campana = res.body.find(c => c._id === campanaId);
    expect(campana.totalRecaudado).toBe(200);
  });
});

describe('HU07 - Historial de donaciones', () => {
  test('devuelve solo las donaciones del donante autenticado', async () => {
    await request(app).post('/api/donaciones').set('Authorization', `Bearer ${tokenDonante}`)
      .send({ campana: campanaId, monto: 75 });

    const res = await request(app)
      .get('/api/donaciones/mi-historial')
      .set('Authorization', `Bearer ${tokenDonante}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].monto).toBe(75);
  });

  test('rechaza consulta sin token', async () => {
    const res = await request(app).get('/api/donaciones/mi-historial');
    expect(res.statusCode).toBe(401);
  });
});
