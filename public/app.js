const API = 'http://localhost:5000/api';
let token = localStorageSafe('get', 'token');
let usuario = JSON.parse(localStorageSafe('get', 'usuario') || 'null');
let campanaSeleccionada = null;

function localStorageSafe(accion, clave, valor) {
  try {
    if (accion === 'get') return localStorage.getItem(clave);
    if (accion === 'set') return localStorage.setItem(clave, valor);
    if (accion === 'remove') return localStorage.removeItem(clave);
  } catch (e) {
    return null;
  }
}

function estadoCarga(boton, cargando, textoCarga = 'Procesando...') {
  const span = boton.querySelector('.btnTexto');
  if (cargando) {
    boton.dataset.textoOriginal = span.textContent;
    span.textContent = textoCarga;
    boton.disabled = true;
  } else {
    span.textContent = boton.dataset.textoOriginal || span.textContent;
    boton.disabled = false;
  }
}

// --- Navegación entre tabs de login/registro ---
document.getElementById('tabLogin').onclick = () => cambiarTab('login');
document.getElementById('tabRegistro').onclick = () => cambiarTab('registro');

function cambiarTab(tab) {
  document.getElementById('tabLogin').classList.toggle('activo', tab === 'login');
  document.getElementById('tabRegistro').classList.toggle('activo', tab === 'registro');
  document.getElementById('formLogin').classList.toggle('oculto', tab !== 'login');
  document.getElementById('formRegistro').classList.toggle('oculto', tab !== 'registro');
}

// --- Navegación entre Campañas / Donantes (solo admin) ---
document.getElementById('subTabCampanas').onclick = () => cambiarSubTab('campanas');
document.getElementById('subTabDonantes').onclick = () => cambiarSubTab('donantes');

function cambiarSubTab(vista) {
  document.getElementById('subTabCampanas').classList.toggle('activo', vista === 'campanas');
  document.getElementById('subTabDonantes').classList.toggle('activo', vista === 'donantes');
  document.getElementById('vistaCampanas').classList.toggle('oculto', vista !== 'campanas');
  document.getElementById('vistaDonantes').classList.toggle('oculto', vista !== 'donantes');
  if (vista === 'donantes') cargarDonantes();
}

// --- Registro (HU01) ---
document.getElementById('formRegistro').addEventListener('submit', async (e) => {
  e.preventDefault();
  const boton = e.target.querySelector('button[type="submit"]');
  const nombre = document.getElementById('regNombre').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const rol = document.getElementById('regRol').value;
  const msg = document.getElementById('regMensaje');
  msg.textContent = '';

  if (password.length < 8) {
    msg.style.color = 'red';
    msg.textContent = 'La contraseña debe tener mínimo 8 caracteres';
    return;
  }

  estadoCarga(boton, true, 'Registrando...');
  try {
    const res = await fetch(`${API}/auth/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, password, rol })
    });
    const data = await res.json();
    if (res.ok) {
      msg.style.color = 'green';
      msg.textContent = 'Registro exitoso. Ahora inicia sesión.';
      e.target.reset();
      cambiarTab('login');
    } else {
      msg.style.color = 'red';
      msg.textContent = data.mensaje;
    }
  } catch (err) {
    msg.style.color = 'red';
    msg.textContent = 'Error de conexión con el servidor';
  } finally {
    estadoCarga(boton, false);
  }
});

// --- Login (HU02) ---
document.getElementById('formLogin').addEventListener('submit', async (e) => {
  e.preventDefault();
  const boton = e.target.querySelector('button[type="submit"]');
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const msg = document.getElementById('loginMensaje');
  msg.textContent = '';

  estadoCarga(boton, true, 'Entrando...');
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      token = data.token;
      usuario = data.usuario;
      localStorageSafe('set', 'token', token);
      localStorageSafe('set', 'usuario', JSON.stringify(usuario));
      mostrarApp();
    } else {
      msg.style.color = 'red';
      msg.textContent = data.mensaje;
    }
  } catch (err) {
    msg.style.color = 'red';
    msg.textContent = 'Error de conexión con el servidor';
  } finally {
    estadoCarga(boton, false);
  }
});

// --- Mostrar la app tras login (HU10: diferenciar donante/admin) ---
function mostrarApp() {
  document.getElementById('authSection').classList.add('oculto');
  document.getElementById('appSection').classList.remove('oculto');
  document.getElementById('cabeceraSesion').classList.remove('oculto');
  document.getElementById('sesionInfo').textContent = `${usuario.nombre} (${usuario.rol})`;

  if (usuario.rol === 'administrador') {
    document.getElementById('panelAdmin').classList.remove('oculto');
    document.getElementById('subTabsAdmin').classList.remove('oculto');
    document.getElementById('panelDonante').classList.add('oculto');
  } else {
    document.getElementById('panelAdmin').classList.add('oculto');
    document.getElementById('subTabsAdmin').classList.add('oculto');
    document.getElementById('panelDonante').classList.remove('oculto');
    cargarHistorial();
  }

  cargarCampanas();
}

// --- Crear campaña (HU03) ---
document.getElementById('formCampana').addEventListener('submit', async (e) => {
  e.preventDefault();
  const boton = e.target.querySelector('button[type="submit"]');
  const nombre = document.getElementById('campNombre').value.trim();
  const descripcion = document.getElementById('campDescripcion').value.trim();
  const meta = document.getElementById('campMeta').value;
  const fechaLimite = document.getElementById('campFecha').value;
  const msg = document.getElementById('campMensaje');
  msg.textContent = '';

  if (Number(meta) <= 0) {
    msg.style.color = 'red';
    msg.textContent = 'La meta debe ser mayor a 0';
    return;
  }

  estadoCarga(boton, true, 'Creando...');
  try {
    const res = await fetch(`${API}/campanas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ nombre, descripcion, meta, fechaLimite })
    });
    const data = await res.json();
    if (res.ok) {
      msg.style.color = 'green';
      msg.textContent = 'Campaña creada exitosamente';
      e.target.reset();
      cargarCampanas();
    } else {
      msg.style.color = 'red';
      msg.textContent = data.mensaje;
    }
  } catch (err) {
    msg.style.color = 'red';
    msg.textContent = 'Error de conexión con el servidor';
  } finally {
    estadoCarga(boton, false);
  }
});

// --- Listar campañas activas (HU05) ---
async function cargarCampanas() {
  const cont = document.getElementById('listaCampanas');
  cont.innerHTML = '<p class="cargando">Cargando campañas...</p>';
  try {
    const res = await fetch(`${API}/campanas`);
    const campanas = await res.json();
    cont.innerHTML = '';

    if (campanas.length === 0) {
      cont.innerHTML = '<p class="vacio">No hay campañas activas por el momento.</p>';
      return;
    }

    campanas.forEach(c => {
      const pct = Math.min(100, ((c.totalRecaudado / c.meta) * 100).toFixed(1));
      const div = document.createElement('div');
      div.className = 'campana-card';
      div.innerHTML = `
        <h3>${c.nombre}</h3>
        <p>${c.descripcion || ''}</p>
        <div class="progreso"><div class="progreso-barra" style="width:${pct}%"></div></div>
        <p>$${c.totalRecaudado} recaudados de $${c.meta} (${pct}%)</p>
        <p class="fechaLimite">Fecha límite: ${new Date(c.fechaLimite).toLocaleDateString()}</p>
        <div class="acciones">
          ${usuario.rol === 'donante' ? `<button onclick="abrirModalDonar('${c._id}','${c.nombre}')">Donar</button>` : ''}
          ${usuario.rol === 'administrador' ? `
            <button class="secundario" onclick="verReporte('${c._id}')">Ver reporte</button>
            <button class="peligro" onclick="cerrarCampana('${c._id}')">Cerrar campaña</button>
          ` : ''}
        </div>
      `;
      cont.appendChild(div);
    });
  } catch (err) {
    cont.innerHTML = '<p class="error">Error al cargar campañas. Verifica que el servidor esté corriendo.</p>';
  }
}

// --- HU04: Cerrar campaña ---
async function cerrarCampana(id) {
  if (!confirm('¿Seguro que deseas cerrar esta campaña? Ya no aceptará más donaciones.')) return;
  try {
    const res = await fetch(`${API}/campanas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ estado: 'cerrada' })
    });
    if (res.ok) {
      cargarCampanas();
    } else {
      const data = await res.json();
      alert(data.mensaje || 'Error al cerrar la campaña');
    }
  } catch (err) {
    alert('Error de conexión con el servidor');
  }
}

// --- HU08: Ver reporte de campaña ---
async function verReporte(id) {
  const modal = document.getElementById('modalReporte');
  const cont = document.getElementById('contenidoReporte');
  cont.innerHTML = 'Cargando reporte...';
  modal.classList.remove('oculto');

  try {
    const res = await fetch(`${API}/donaciones/reporte/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      cont.innerHTML = `
        <p><strong>Campaña:</strong> ${data.campana}</p>
        <p><strong>Total recaudado:</strong> $${data.totalRecaudado}</p>
        <p><strong>Número de donantes:</strong> ${data.numeroDonantes}</p>
        <p><strong>Porcentaje de la meta:</strong> ${data.porcentajeMeta}</p>
      `;
    } else {
      cont.innerHTML = `<p class="error">${data.mensaje}</p>`;
    }
  } catch (err) {
    cont.innerHTML = '<p class="error">Error al cargar el reporte</p>';
  }
}

document.getElementById('btnCerrarReporte').onclick = () => {
  document.getElementById('modalReporte').classList.add('oculto');
};

// --- HU09: Listar donantes ---
async function cargarDonantes() {
  const cont = document.getElementById('listaDonantes');
  cont.innerHTML = '<p class="cargando">Cargando donantes...</p>';
  try {
    const res = await fetch(`${API}/usuarios/donantes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const donantes = await res.json();
    cont.innerHTML = '';

    if (donantes.length === 0) {
      cont.innerHTML = '<p class="vacio">Aún no hay donantes registrados.</p>';
      return;
    }

    donantes.forEach(d => {
      const div = document.createElement('div');
      div.className = 'historial-item';
      div.innerHTML = `<span>${d.nombre} — ${d.email}</span><span>$${d.totalDonado} donados</span>`;
      cont.appendChild(div);
    });
  } catch (err) {
    cont.innerHTML = '<p class="error">Error al cargar donantes</p>';
  }
}

// --- Modal de donación (HU06) ---
function abrirModalDonar(id, nombre) {
  campanaSeleccionada = id;
  document.getElementById('modalTitulo').textContent = `Donar a: ${nombre}`;
  document.getElementById('modalDonar').classList.remove('oculto');
}

document.getElementById('btnCerrarModal').onclick = () => {
  document.getElementById('modalDonar').classList.add('oculto');
  document.getElementById('donarMensaje').textContent = '';
  document.getElementById('montoDonar').value = '';
};

document.getElementById('btnConfirmarDonar').addEventListener('click', async () => {
  const boton = document.getElementById('btnConfirmarDonar');
  const monto = document.getElementById('montoDonar').value;
  const msg = document.getElementById('donarMensaje');
  msg.textContent = '';

  if (!monto || Number(monto) <= 0) {
    msg.style.color = 'red';
    msg.textContent = 'El monto debe ser mayor a 0';
    return;
  }

  estadoCarga(boton, true, 'Donando...');
  try {
    const res = await fetch(`${API}/donaciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ campana: campanaSeleccionada, monto: Number(monto) })
    });
    const data = await res.json();
    if (res.ok) {
      msg.style.color = 'green';
      msg.textContent = 'Donación registrada. ¡Gracias!';
      setTimeout(() => {
        document.getElementById('modalDonar').classList.add('oculto');
        document.getElementById('montoDonar').value = '';
        msg.textContent = '';
        cargarCampanas();
        cargarHistorial();
      }, 1200);
    } else {
      msg.style.color = 'red';
      msg.textContent = data.mensaje;
    }
  } catch (err) {
    msg.style.color = 'red';
    msg.textContent = 'Error de conexión con el servidor';
  } finally {
    estadoCarga(boton, false);
  }
});

// --- Historial de donaciones (HU07) ---
async function cargarHistorial() {
  const cont = document.getElementById('listaHistorial');
  cont.innerHTML = '<p class="cargando">Cargando historial...</p>';
  try {
    const res = await fetch(`${API}/donaciones/mi-historial`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const donaciones = await res.json();
    cont.innerHTML = '';
    if (donaciones.length === 0) {
      cont.innerHTML = '<p class="vacio">Aún no has realizado donaciones.</p>';
      return;
    }
    donaciones.forEach(d => {
      const div = document.createElement('div');
      div.className = 'historial-item';
      div.innerHTML = `<span>${d.campana?.nombre || 'Campaña'}</span><span>$${d.monto} - ${new Date(d.fecha).toLocaleDateString()}</span>`;
      cont.appendChild(div);
    });
  } catch (err) {
    cont.innerHTML = '<p class="error">Error al cargar historial</p>';
  }
}

// --- Cerrar sesión ---
document.getElementById('btnLogout').onclick = () => {
  token = null;
  usuario = null;
  localStorageSafe('remove', 'token');
  localStorageSafe('remove', 'usuario');

  document.getElementById('cabeceraSesion').classList.add('oculto');
  document.getElementById('appSection').classList.add('oculto');
  document.getElementById('authSection').classList.remove('oculto');
  document.getElementById('formLogin').reset();
  cambiarTab('login');
};

// --- Si ya había sesión guardada, entrar directo ---
if (token && usuario) {
  mostrarApp();
}
