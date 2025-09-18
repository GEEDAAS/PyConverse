// Conexión al servidor Socket.IO
const socket = io();

// Elementos del DOM
const messagesList = document.getElementById('messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message');
const userList = document.getElementById('user-list'); // Nuevo
const userCount = document.getElementById('user-count'); // Nuevo

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

// NUEVA FUNCIÓN: Actualizar la lista de usuarios en la barra lateral
function updateUserList(users) {
  userList.innerHTML = ''; // Limpiar la lista actual
  users.forEach(user => {
    const li = document.createElement('li');
    li.textContent = user;
    userList.appendChild(li);
  });
  userCount.textContent = users.length; // Actualizar el contador
}

// Eventos de Socket

// AHORA LO MÁS IMPORTANTE:
// Cuando el socket se conecta, le decimos al servidor a qué sala nos queremos unir.
socket.on('connect', () => {
    const room = document.body.dataset.room; // Leemos el nombre de la sala desde el atributo data-room
    if (room) {
        socket.emit('join', { room: room });
    }
});

// NUEVO EVENTO: Recibir el historial de mensajes al unirse
socket.on('history', (data) => {
  messagesList.innerHTML = ''; // Limpiar mensajes de bienvenida
  data.messages.forEach(msg => {
    appendChatMessage(msg.username, msg.msg);
  });
});

// NUEVO EVENTO: Recibir la lista de usuarios actualizada
socket.on('update_user_list', (data) => {
  updateUserList(data.users);
});

socket.on('system', (data) => {
  appendSystemMessage(data.msg);
});

socket.on('chat_message', (data) => {
  appendChatMessage(data.username, data.msg);
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