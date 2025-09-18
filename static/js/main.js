// Conexión al servidor Socket.IO
const socket = io();

// Elementos del DOM
const usernameSection = document.getElementById('username-section');
const usernameForm = document.getElementById('username-form');
const usernameInput = document.getElementById('username');
const messagesList = document.getElementById('messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message');
const sendBtn = document.getElementById('send-btn');
const participantsSpan = document.getElementById('participants');

// Helpers
function appendSystemMessage(text) {
  const li = document.createElement('li');
  li.className = 'msg system';
  li.textContent = text;
  messagesList.appendChild(li);
  messagesList.scrollTop = messagesList.scrollHeight;
}

function appendChatMessage(username, text) {
  const li = document.createElement('li');
  li.className = 'msg';
  const u = document.createElement('span');
  u.className = 'username';
  u.textContent = username + ': ';
  const t = document.createElement('span');
  t.className = 'text';
  t.textContent = text;  // Usamos textContent para evitar inyecciones
  li.appendChild(u);
  li.appendChild(t);
  messagesList.appendChild(li);
  messagesList.scrollTop = messagesList.scrollHeight;
}

// Eventos de Socket
socket.on('system', (data) => {
  appendSystemMessage(data.msg);
});

socket.on('chat_message', (data) => {
  appendChatMessage(data.username, data.msg);
});

socket.on('participants', (data) => {
  participantsSpan.textContent = data.count;
});

// Enviar username
usernameForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = usernameInput.value.trim();
  if (!name) return;
  socket.emit('set_username', { username: name });
  // Deshabilitar el formulario de username y habilitar el chat
  usernameInput.disabled = true;
  usernameSection.style.display = 'none';
  messageInput.disabled = false;
  sendBtn.disabled = false;
  messageInput.focus();
});

// Enviar mensajes
messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const msg = messageInput.value.trim();
  if (!msg) return;
  socket.emit('chat_message', { msg });
  messageInput.value = '';
  messageInput.focus();
});

// Botón salir del chat
const exitBtn = document.getElementById("exit-btn");

exitBtn.addEventListener("click", () => {
  socket.disconnect(); // Cierra la conexión con el servidor
  window.location.href = "/"; // Redirige al inicio (puedes cambiar la ruta si quieres otra página)
});