// static/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // ---------------------------------------------------
    // 1. CONEXIÓN E INICIALIZACIÓN
    // ---------------------------------------------------
    const socket = io();

    // Elementos del DOM
    const messagesList = document.getElementById('messages');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message');
    const userList = document.getElementById('user-list');
    const userCount = document.getElementById('user-count');
    const sidebar = document.getElementById('sidebar');
    const openBtn = document.getElementById('open-sidebar-btn');
    const closeBtn = document.getElementById('close-sidebar-btn');
    
    // Elementos y variables para el Typing Indicator
    const typingIndicator = document.getElementById('typing-indicator');
    let typingTimer;
    const TYPING_TIMER_LENGTH = 2000; // 2 segundos
    let usersTyping = {};

    // ---------------------------------------------------
    // 2. FUNCIONES AUXILIARES
    // ---------------------------------------------------

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
        t.textContent = text;
        li.appendChild(u);
        li.appendChild(t);
        messagesList.appendChild(li);
        messagesList.scrollTop = messagesList.scrollHeight;
    }

    function updateUserList(users) {
        if (!userList) return; // Salvaguarda por si el elemento no existe
        userList.innerHTML = ''; // Limpiar la lista actual
        users.forEach(user => {
            const li = document.createElement('li');
            li.textContent = user;
            userList.appendChild(li);
        });
        userCount.textContent = users.length; // Actualizar el contador
    }

    function updateTypingIndicator() {
        const typingUsernames = Object.keys(usersTyping);
        if (typingUsernames.length === 0) {
            typingIndicator.textContent = '';
            typingIndicator.style.visibility = 'hidden';
        } else if (typingUsernames.length === 1) {
            typingIndicator.textContent = `${typingUsernames[0]} está escribiendo...`;
            typingIndicator.style.visibility = 'visible';
        } else if (typingUsernames.length <= 3) {
            typingIndicator.textContent = `${typingUsernames.join(', ')} están escribiendo...`;
            typingIndicator.style.visibility = 'visible';
        } else {
            typingIndicator.textContent = 'Varios usuarios están escribiendo...';
            typingIndicator.style.visibility = 'visible';
        }
    }

    // ---------------------------------------------------
    // 3. MANEJADORES DE EVENTOS DE SOCKET.IO
    // ---------------------------------------------------

    socket.on('connect', () => {
        console.log('✅ Conectado al servidor');
        const room = document.body.dataset.room;
        if (room) {
            socket.emit('join', { room: room });
        }
    });

    socket.on('history', (data) => {
        messagesList.innerHTML = ''; // Limpiar mensajes
        data.messages.forEach(msg => {
            appendChatMessage(msg.username, msg.msg);
        });
    });

    socket.on('update_user_list', (data) => {
        updateUserList(data.users);
    });

    socket.on('system', (data) => {
        appendSystemMessage(data.msg);
    });

    socket.on('chat_message', (data) => {
        appendChatMessage(data.username, data.msg);
    });
    
    socket.on('user_typing', (data) => {
        if (data.is_typing) {
            usersTyping[data.username] = true;
        } else {
            delete usersTyping[data.username];
        }
        updateTypingIndicator();
    });
    
    // ---------------------------------------------------
    // 4. MANEJADORES DE EVENTOS DEL USUARIO
    // ---------------------------------------------------

    if (messageForm) {
        messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const msg = messageInput.value.trim();
            if (!msg) return;
            socket.emit('chat_message', { msg });
            messageInput.value = '';
            messageInput.focus();
            // Notifica que ha dejado de escribir al enviar el mensaje
            clearTimeout(typingTimer);
            socket.emit('typing', { 'is_typing': false });
        });
    }

    if (sidebar && openBtn && closeBtn) {
        openBtn.addEventListener('click', () => {
            sidebar.classList.add('is-open');
        });

        closeBtn.addEventListener('click', () => {
            sidebar.classList.remove('is-open');
        });
    }

    if (messageInput) {
        messageInput.addEventListener('input', () => {
            clearTimeout(typingTimer);
            socket.emit('typing', { 'is_typing': true });
            
            typingTimer = setTimeout(() => {
                socket.emit('typing', { 'is_typing': false });
            }, TYPING_TIMER_LENGTH);
        });
    }
});