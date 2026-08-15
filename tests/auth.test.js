const mongoose = require('mongoose');
require('dotenv').config();
const request = require('supertest');
const app = require('../app');
const Usuario = require('../models/Usuario');

const TEST_DB = process.env.MONGO_URI.replace(/\/[^/]+$/, '/donatrack_test');

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
});

afterEach(async () => {
  await Usuario.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('HU01 - Registro de donante', () => {
  test('registra un usuario nuevo correctamente', async () => {
    const res = await request(app).post('/api/auth/registro').send({
      nombre: 'Test Usuario',
      email: 'test1@donatrack.com',
      password: '12345678',
      rol: 'donante'
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.mensaje).toMatch(/registrado/i);
  });

  test('rechaza email duplicado', async () => {
    await request(app).post('/api/auth/registro').send({
      nombre: 'Usuario Uno',
      email: 'duplicado@donatrack.com',
      password: '12345678'
    });
    const res = await request(app).post('/api/auth/registro').send({
      nombre: 'Usuario Dos',
      email: 'duplicado@donatrack.com',
      password: '12345678'
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.mensaje).toMatch(/ya está registrado/i);
  });

  test('rechaza contraseña menor a 8 caracteres', async () => {
    const res = await request(app).post('/api/auth/registro').send({
      nombre: 'Usuario Corto',
      email: 'corto@donatrack.com',
      password: '123'
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.mensaje).toMatch(/8 caracteres/i);
  });
});

describe('HU02 - Inicio de sesión', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/registro').send({
      nombre: 'Login Test',
      email: 'login@donatrack.com',
      password: '12345678'
    });
  });

  test('inicia sesión con credenciales válidas y devuelve token', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@donatrack.com',
      password: '12345678'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('rechaza contraseña incorrecta', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@donatrack.com',
      password: 'incorrecta'
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.mensaje).toMatch(/inválidas/i);
  });

  test('rechaza email no registrado', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'noexiste@donatrack.com',
      password: '12345678'
    });
    expect(res.statusCode).toBe(400);
  });
});
