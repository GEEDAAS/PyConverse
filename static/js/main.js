document.addEventListener('DOMContentLoaded', () => {
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
    const typingIndicator = document.getElementById('typing-indicator');

    // Elementos de la Modal de Mensajes Privados
    const pmModal = document.getElementById('conversation-modal');
    const pmForm = document.getElementById('private-message-form');
    const pmRecipientSpan = document.getElementById('pm-recipient');
    const pmInput = document.getElementById('pm-input');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const pmMessagesList = document.getElementById('pm-messages');

    let localUsername = document.body.dataset.username;
    let currentPrivateChatUser = null;
    let typingTimer;
    const TYPING_TIMER_LENGTH = 2000;
    let usersTyping = {};

    // --- FUNCIONES AUXILIARES ---

    function appendSystemMessage(text) {
        const li = document.createElement('li');
        li.className = 'msg system';
        li.textContent = text;
        messagesList.appendChild(li);
        messagesList.scrollTop = messagesList.scrollHeight;
    }
    
    function appendPublicMessage(data) {
        const { username, msg } = data;
        const li = document.createElement('li');
        li.className = 'msg';
        li.innerHTML = `<span class="username">${username}:</span> <span class="text">${msg}</span>`;
        messagesList.appendChild(li);
        messagesList.scrollTop = messagesList.scrollHeight;
    }

    function appendPrivateMessage(data) {
        const { id, sender, msg, seen } = data;
        const li = document.createElement('li');
        li.className = 'msg private';
        li.dataset.id = id;

        const direction = sender === localUsername ? 'Tú' : sender;
        const seenStatus = sender === localUsername && seen ? ' (Visto)' : '';
        
        li.innerHTML = `
            <div><span class="username">${direction}:</span> ${msg}</div>
            <div class="meta"><span class="seen-status">${seenStatus}</span></div>
        `;
        pmMessagesList.appendChild(li);
        pmMessagesList.scrollTop = pmMessagesList.scrollHeight;
        
        if (data.recipient === localUsername && !seen) {
            socket.emit('message_seen', { id, sender });
        }
    }

    function updateUserList(users) {
        userList.innerHTML = '';
        users.forEach(user => {
            const li = document.createElement('li');
            if (user === localUsername) {
                li.innerHTML = `${user} (Tú)`;
                li.style.color = 'var(--accent)';
            } else {
                li.innerHTML = `${user}<span class="notification-dot" id="notif-${user}"></span>`;
                li.addEventListener('click', () => openPrivateMessageModal(user));
            }
            userList.appendChild(li);
        });
        userCount.textContent = users.length;
    }

    function updateTypingIndicator() {
        const typingUsernames = Object.keys(usersTyping);
        if (typingUsernames.length === 0) {
            typingIndicator.textContent = '';
            typingIndicator.style.visibility = 'hidden';
        } else if (typingUsernames.length === 1) {
            typingIndicator.textContent = `${typingUsernames[0]} está escribiendo...`;
            typingIndicator.style.visibility = 'visible';
        } else {
            typingIndicator.textContent = 'Varios usuarios están escribiendo...';
            typingIndicator.style.visibility = 'visible';
        }
    }

    function openPrivateMessageModal(recipientUsername) {
        currentPrivateChatUser = recipientUsername;
        pmRecipientSpan.textContent = recipientUsername;
        pmMessagesList.innerHTML = '';
        socket.emit('get_private_history', { 'with_user': recipientUsername });
        const notifDot = document.getElementById(`notif-${recipientUsername}`);
        if (notifDot) notifDot.style.display = 'none';
        pmModal.style.display = 'flex';
        pmInput.focus();
    }
    
    function closePrivateMessageModal() {
        pmModal.style.display = 'none';
        pmInput.value = '';
        currentPrivateChatUser = null;
    }

    // --- MANEJADORES DE EVENTOS DE SOCKET.IO ---
    
    socket.on('connect', () => {
        const room = document.body.dataset.room;
        if (room) {
            socket.emit('join', { room: room });
        }
    });

    socket.on('history', (data) => {
        messagesList.innerHTML = '';
        data.messages.forEach(msg => appendPublicMessage(msg));
    });

    socket.on('update_user_list', (data) => updateUserList(data.users));
    socket.on('system', (data) => appendSystemMessage(data.msg));
    socket.on('chat_message', (data) => appendPublicMessage(data));
    
    socket.on('private_message', (data) => {
        const otherUser = data.sender === localUsername ? data.recipient : data.sender;
        if (currentPrivateChatUser === otherUser) {
            appendPrivateMessage(data);
        } else {
            if (data.recipient === localUsername) {
                const notifDot = document.getElementById(`notif-${data.sender}`);
                if (notifDot) notifDot.style.display = 'block';
            }
        }
    });

    socket.on('private_history', (data) => {
        if (data.with_user === currentPrivateChatUser) {
            data.history.forEach(msg => appendPrivateMessage(msg));
        }
    });

    socket.on('update_seen_status', (data) => {
        const msgElement = document.querySelector(`#pm-messages .msg[data-id="${data.id}"] .seen-status`);
        if (msgElement) {
            msgElement.textContent = ' (Visto)';
        }
    });
    
    socket.on('user_typing', (data) => {
        if (data.is_typing) {
            usersTyping[data.username] = true;
        } else {
            delete usersTyping[data.username];
        }
        updateTypingIndicator();
    });
    
    // --- MANEJADORES DE EVENTOS DEL USUARIO ---
    
    if (messageForm) {
        messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const msg = messageInput.value.trim();
            if (!msg) return;
            socket.emit('chat_message', { msg });
            messageInput.value = '';
            messageInput.focus();
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

    if (pmForm) {
        pmForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const msg = pmInput.value.trim();
            if (!msg || !currentPrivateChatUser) return;
            socket.emit('private_message', {
                recipient_username: currentPrivateChatUser,
                msg: msg
            });
            pmInput.value = '';
        });
    }

    if (closeModalBtn) closeModalBtn.addEventListener('click', closePrivateMessageModal);
    if (pmModal) pmModal.addEventListener('click', (e) => {
        if (e.target === pmModal) closePrivateMessageModal();
    });
});