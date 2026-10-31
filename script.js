/* ============================================================
   ATENA — script.js
   Navegación · Animaciones · Acordeón · Chat Widget
   ============================================================ */

/* La URL es pública; nunca incluir aquí claves o tokens. */
const ATENA_API_URL = window.ATENA_CONFIG?.url?.trim() || '';

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
let sesionId      = '';

// Inicializar al cargar
window.addEventListener('DOMContentLoaded', () => {
  inicializarChat();
});

function inicializarChat() {
  sesionId = sessionStorage.getItem('atena_sesion');
  if (!sesionId) {
    sesionId = window.crypto?.randomUUID?.() || `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem('atena_sesion', sesionId);
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
    if (!ATENA_API_URL) {
      mostrarTyping(false);
      agregarMensaje(
        'El chat web aún no está conectado. Puedes escribirnos por WhatsApp.',
        'bot'
      );
      return;
    } else {
      const response = await fetch(`${ATENA_API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texto: texto,
          sesion_id: sesionId,
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