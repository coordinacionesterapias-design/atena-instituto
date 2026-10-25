/* ============================================================
   ATENA — script.js
   Navegación · Animaciones · Acordeón · Chat Widget
   ============================================================ */

/* ── CONFIGURACIÓN ──
   Reemplaza TU_URL_NGROK con tu URL de ngrok fija.
   Ejemplo: https://abc123.ngrok-free.app
   ─────────────────────────────────────────────── */
const ATENA_API_URL = 'https://uncourteously-nongenetical-aniya.ngrok-free.dev' || 'TU_URL_NGROK';
const ATENA_SECRET  = window.ATENA_CONFIG?.secret || 'sin-configurar'; // 
const MAX_CONSULTAS = 5;               // ← Número de consultas gratuitas

/* ══════════════════════════════════════
   NAVEGACIÓN STICKY + HAMBURGUESA
══════════════════════════════════════ */
const nav        = document.getElementById('nav');
const hamburger  = document.getElementById('hamburger');
const navMenu    = document.getElementById('navMenu');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
});

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navMenu.classList.toggle('open');
});

// Cerrar menú al hacer clic en un enlace
navMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navMenu.classList.remove('open');
  });
});

// Scroll suave para anclas
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80;
      window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
    }
  });
});

/* ══════════════════════════════════════
   ANIMACIONES AL APARECER (Intersection Observer)
══════════════════════════════════════ */
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

/* ══════════════════════════════════════
   ACORDEÓN DE SERVICIOS
══════════════════════════════════════ */
function toggleServicio(header) {
  const card = header.closest('.servicio-card');
  const isOpen = card.classList.contains('open');

  // Cerrar todos
  document.querySelectorAll('.servicio-card.open').forEach(c => c.classList.remove('open'));

  // Abrir el clickeado si estaba cerrado
  if (!isOpen) card.classList.add('open');
}

/* ══════════════════════════════════════
   CHAT WIDGET — ATENA Conversa
══════════════════════════════════════ */

// Estado del chat
let chatAbierto   = false;
let consultasUsadas = 0;
let fingerprint   = '';
let userIP        = '';

// Inicializar al cargar
window.addEventListener('DOMContentLoaded', () => {
  inicializarChat();
});

function inicializarChat() {
  // Generar fingerprint del navegador
  fingerprint = generarFingerprint();

  // Recuperar consultas usadas del localStorage
  const stored = localStorage.getItem('atena_consultas_' + fingerprint);
  if (stored) {
    consultasUsadas = parseInt(stored, 10) || 0;
  }

  // Obtener IP del visitante (para registro en servidor)
  fetch('https://api.ipify.org?format=json')
    .then(r => r.json())
    .then(d => { userIP = d.ip; })
    .catch(() => { userIP = 'desconocida'; });

  actualizarIndicadorLimite();
}

function generarFingerprint() {
  const datos = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
  ].join('|');

  // Hash simple
  let hash = 0;
  for (let i = 0; i < datos.length; i++) {
    hash = ((hash << 5) - hash) + datos.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function actualizarIndicadorLimite() {
  const restantes = Math.max(0, MAX_CONSULTAS - consultasUsadas);
  const texto = document.getElementById('limitText');
  const dots  = document.getElementById('limitDots');

  if (texto) {
    texto.textContent = restantes > 0
      ? `${restantes} consulta${restantes !== 1 ? 's' : ''} gratuita${restantes !== 1 ? 's' : ''} disponible${restantes !== 1 ? 's' : ''}`
      : 'Límite alcanzado — Contáctanos por WhatsApp';
  }

  if (dots) {
    const dotEls = dots.querySelectorAll('.chat-dot');
    dotEls.forEach((dot, i) => {
      dot.classList.toggle('used', i < consultasUsadas);
    });
  }
}

function toggleChat() {
  chatAbierto = !chatAbierto;
  const box    = document.getElementById('chatBox');
  const toggle = document.getElementById('chatToggle');
  box.classList.toggle('visible', chatAbierto);
  toggle.classList.toggle('open', chatAbierto);
  toggle.textContent = chatAbierto ? '✕' : '✦';

  if (chatAbierto) {
    setTimeout(() => {
      const input = document.getElementById('chatInput');
      if (input) input.focus();
    }, 200);
  }
}

function abrirChat() {
  if (!chatAbierto) toggleChat();
  const widget = document.getElementById('chatWidget');
  if (widget) widget.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

// Enviar con Enter
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('chatInput');
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviarMensaje();
      }
    });
  }
});

async function enviarMensaje() {
  const input = document.getElementById('chatInput');
  const texto = input ? input.value.trim() : '';
  if (!texto) return;

  // Verificar límite
  if (consultasUsadas >= MAX_CONSULTAS) {
    agregarMensajeLimite();
    return;
  }

  // Mostrar mensaje del usuario
  input.value = '';
  agregarMensaje(texto, 'user');

  // Deshabilitar input mientras espera
  const sendBtn = document.getElementById('chatSendBtn');
  if (input) input.disabled = true;
  if (sendBtn) sendBtn.disabled = true;

  // Mostrar typing
  mostrarTyping(true);

  try {
    // Verificar si hay URL de ngrok configurada
    if (ATENA_API_URL === 'TU_URL_NGROK') {
      // Modo demo sin backend
      await new Promise(r => setTimeout(r, 1200));
      mostrarTyping(false);
      agregarMensaje(
        'Hola 👋 Soy ATENA Conversa. Para activar el asistente completo, el administrador debe configurar la URL del servidor. Por ahora puedes contactarnos directamente por WhatsApp.',
        'bot'
      );
    } else {
      // Llamada real al backend
      const response = await fetch(`${ATENA_API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Atena-Key': ATENA_SECRET,
          'X-Fingerprint': fingerprint,
          'X-IP': userIP,
        },
        body: JSON.stringify({
          texto: texto,
          sesion_id: 'web-' + fingerprint,
          sujeto: 'visitante',
          modo: 'normal',
        }),
      });

      mostrarTyping(false);

      if (!response.ok) {
        throw new Error('Error del servidor: ' + response.status);
      }

      const data = await response.json();
      const respuesta = data.respuesta || 'No se pudo obtener respuesta.';
      agregarMensaje(respuesta, 'bot');
    }

    // Incrementar contador
    consultasUsadas++;
    localStorage.setItem('atena_consultas_' + fingerprint, consultasUsadas.toString());
    actualizarIndicadorLimite();

    // Mostrar mensaje de límite si se alcanzó
    if (consultasUsadas >= MAX_CONSULTAS) {
      setTimeout(() => agregarMensajeLimite(), 800);
    }

  } catch (err) {
    mostrarTyping(false);
    agregarMensaje(
      'Hubo un problema al conectar con el asistente. Por favor contáctanos por WhatsApp.',
      'bot'
    );
    console.error('Error ATENA Conversa:', err);
  } finally {
    if (input) input.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
    if (input) input.focus();
  }
}

function agregarMensaje(texto, tipo) {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  const div = document.createElement('div');
  div.className = 'msg ' + tipo;
  div.textContent = texto;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function agregarMensajeLimite() {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  // Evitar duplicar el mensaje de límite
  if (container.querySelector('.msg.limit')) return;

  const div = document.createElement('div');
  div.className = 'msg limit';
  div.innerHTML = `Has usado tus ${MAX_CONSULTAS} consultas gratuitas.<br>
    <a href="https://wa.me/51916471316" target="_blank" rel="noopener"
       style="color:#E85A5A;font-weight:700;text-decoration:underline">
      💬 Contactar por WhatsApp para acceso completo
    </a>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;

  // Deshabilitar input
  const input   = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSendBtn');
  if (input)   { input.disabled = true; input.placeholder = 'Límite alcanzado'; }
  if (sendBtn) sendBtn.disabled = true;
}

function mostrarTyping(visible) {
  const typing = document.getElementById('chatTyping');
  const msgs   = document.getElementById('chatMessages');
  if (!typing || !msgs) return;

  typing.style.display = visible ? 'flex' : 'none';
  if (visible) {
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;
  }
}

/* ══════════════════════════════════════
   UTILIDADES
══════════════════════════════════════ */

// Marcar enlace activo en el menú según scroll
const sections = document.querySelectorAll('section[id], div[id="inicio"]');
const navLinks  = document.querySelectorAll('.nav-menu a');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    if (window.scrollY >= section.offsetTop - 120) {
      current = section.getAttribute('id');
    }
  });
  navLinks.forEach(link => {
    link.style.color = '';
    if (link.getAttribute('href') === '#' + current) {
      link.style.color = '#E85A5A';
    }
  });
}, { passive: true });
