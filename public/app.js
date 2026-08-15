const API = 'http://localhost:5000/api';
let token = localStorageSafe('get', 'token');
let usuario = JSON.parse(localStorageSafe('get', 'usuario') || 'null');
let campanaSeleccionada = null;

// Nota: usamos variables en memoria como respaldo por si el navegador bloquea localStorage
function localStorageSafe(accion, clave, valor) {
  try {
    if (accion === 'get') return localStorage.getItem(clave);
    if (accion === 'set') return localStorage.setItem(clave, valor);
    if (accion === 'remove') return localStorage.removeItem(clave);
  } catch (e) {
    return null;
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

// --- Registro (HU01) ---
document.getElementById('formRegistro').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nombre = document.getElementById('regNombre').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const rol = document.getElementById('regRol').value;
  const msg = document.getElementById('regMensaje');

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
      cambiarTab('login');
    } else {
      msg.style.color = 'red';
      msg.textContent = data.mensaje;
    }
  } catch (err) {
    msg.style.color = 'red';
    msg.textContent = 'Error de conexión con el servidor';
  }
});

// --- Login (HU02) ---
document.getElementById('formLogin').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const msg = document.getElementById('loginMensaje');

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
    document.getElementById('panelDonante').classList.add('oculto');
  } else {
    document.getElementById('panelAdmin').classList.add('oculto');
    document.getElementById('panelDonante').classList.remove('oculto');
    cargarHistorial();
  }

  cargarCampanas();
}

// --- Crear campaña (HU03) ---
document.getElementById('formCampana').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nombre = document.getElementById('campNombre').value;
  const descripcion = document.getElementById('campDescripcion').value;
  const meta = document.getElementById('campMeta').value;
  const fechaLimite = document.getElementById('campFecha').value;
  const msg = document.getElementById('campMensaje');

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
      document.getElementById('formCampana').reset();
      cargarCampanas();
    } else {
      msg.style.color = 'red';
      msg.textContent = data.mensaje;
    }
  } catch (err) {
    msg.style.color = 'red';
    msg.textContent = 'Error de conexión con el servidor';
  }
});

// --- Listar campañas activas (HU05) ---
async function cargarCampanas() {
  const cont = document.getElementById('listaCampanas');
  cont.innerHTML = 'Cargando...';
  try {
    const res = await fetch(`${API}/campanas`);
    const campanas = await res.json();
    cont.innerHTML = '';
    campanas.forEach(c => {
      const pct = Math.min(100, ((c.totalRecaudado / c.meta) * 100).toFixed(1));
      const div = document.createElement('div');
      div.className = 'campana-card';
      div.innerHTML = `
        <h3>${c.nombre}</h3>
        <p>${c.descripcion || ''}</p>
        <div class="progreso"><div class="progreso-barra" style="width:${pct}%"></div></div>
        <p>$${c.totalRecaudado} recaudados de $${c.meta} (${pct}%)</p>
        <p>Fecha límite: ${new Date(c.fechaLimite).toLocaleDateString()}</p>
        ${usuario.rol === 'donante' ? `<button onclick="abrirModalDonar('${c._id}','${c.nombre}')">Donar</button>` : ''}
      `;
      cont.appendChild(div);
    });
  } catch (err) {
    cont.innerHTML = 'Error al cargar campañas';
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
};

document.getElementById('btnConfirmarDonar').onclick = async () => {
  const monto = document.getElementById('montoDonar').value;
  const msg = document.getElementById('donarMensaje');

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
  }
};

// --- Historial de donaciones (HU07) ---
async function cargarHistorial() {
  const cont = document.getElementById('listaHistorial');
  cont.innerHTML = 'Cargando...';
  try {
    const res = await fetch(`${API}/donaciones/mi-historial`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const donaciones = await res.json();
    cont.innerHTML = '';
    if (donaciones.length === 0) {
      cont.innerHTML = '<p>Aún no has realizado donaciones.</p>';
      return;
    }
    donaciones.forEach(d => {
      const div = document.createElement('div');
      div.className = 'historial-item';
      div.innerHTML = `<span>${d.campana?.nombre || 'Campaña'}</span><span>$${d.monto} - ${new Date(d.fecha).toLocaleDateString()}</span>`;
      cont.appendChild(div);
    });
  } catch (err) {
    cont.innerHTML = 'Error al cargar historial';
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
