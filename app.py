# app.py
from flask import Flask, render_template, request, redirect, url_for, session
from flask_socketio import SocketIO, emit, join_room, leave_room
from collections import defaultdict
import os
import uuid # Necesario para IDs de mensajes únicos

app = Flask(__name__, static_folder='static', template_folder='templates')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
socketio = SocketIO(app)

# --- Almacenamiento en Memoria ---
# Usamos defaultdict para que al acceder a una sala nueva, se cree una lista vacía automáticamente.
room_history = defaultdict(list)
room_users = defaultdict(set)
active_rooms = {"General", "Juegos", "Tareas"}
# Diccionario para mapear SID a username y viceversa
sid_to_user = {}
user_to_sid = {}
# Almacenamiento específico para conversaciones privadas
private_conversations = defaultdict(list)

# --- Rutas HTTP ---

@app.route('/')
def inicio():
    return render_template('index.html')

@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('username', '').strip()
    if username:
        session['username'] = username
        return redirect(url_for('selector_de_salas'))
    return redirect(url_for('inicio'))

# Botón para salir completamente
@app.route('/logout')
def logout():
    """Limpia la sesión del usuario y lo redirige al inicio."""
    session.clear()
    return redirect(url_for('inicio'))

@app.route('/salas')
def selector_de_salas():
    if 'username' not in session:
        return redirect(url_for('inicio'))
    return render_template('salas.html', rooms=sorted(list(active_rooms)))

@app.route('/chat/<string:room_name>')
def chat(room_name):
    if 'username' not in session:
        return redirect(url_for('inicio'))
    active_rooms.add(room_name)
    return render_template('chat.html', username=session['username'], room=room_name)

# --- Funciones Auxiliares ---
def get_conversation_key(user1, user2):
    """Crea una clave única y consistente para cualquier par de usuarios."""
    return tuple(sorted((user1, user2)))

def update_user_list(room):
    """Función para emitir la lista de usuarios actualizada a una sala."""
    if room in room_users:
        users_list = sorted(list(room_users[room]))
        emit('update_user_list', {'users': users_list}, to=room)

# --- Eventos de Socket.IO ---

@socketio.on('join')
def on_join(data):
    username = session['username']
    room = data['room']
    sid = request.sid
    session['room'] = room
    join_room(room)

    # Guardar la relación usuario <-> sid
    sid_to_user[sid] = username
    user_to_sid[username] = sid
    
    room_users[room].add(username)
    print(f'{username} ({sid}) se ha unido a la sala: {room}')
    
    emit('history', {'messages': room_history[room]})
    emit('system', {'msg': f'{username} se unió al chat.'}, to=room)
    update_user_list(room)

@socketio.on('chat_message')
def handle_chat_message(data):
    username = session.get('username')
    room = session.get('room')
    msg = data.get('msg', '').strip()
    if not msg or not room: return

    # Añadimos un ID único a cada mensaje
    message_data = {
        'id': str(uuid.uuid4()),
        'username': username,
        'msg': msg,
        'type': 'public' # NUEVO: Tipo de mensaje
    }
    
    room_history[room].append(message_data)
    if len(room_history[room]) > 100: room_history[room].pop(0)

    emit('chat_message', message_data, to=room)

@socketio.on('private_message')
def handle_private_message(data):
    sender = session.get('username')
    recipient = data.get('recipient_username')
    msg = data.get('msg', '').strip()
    if not msg or not recipient: return
    
    recipient_sid = user_to_sid.get(recipient)
    if not recipient_sid:
        emit('system', {'msg': f'Error: {recipient} no está conectado.'})
        return

    message_data = {
        'id': str(uuid.uuid4()),
        'sender': sender,
        'recipient': recipient,
        'msg': msg,
        'seen': False
    }
    
    # Guardar en el historial de la conversación privada
    conv_key = get_conversation_key(sender, recipient)
    private_conversations[conv_key].append(message_data)
    
    emit('private_message', message_data, to=recipient_sid)
    emit('private_message', message_data, to=request.sid)

# Evento para obtener el historial de una conversación privada
@socketio.on('get_private_history')
def get_private_history(data):
    user1 = session.get('username')
    user2 = data.get('with_user')
    conv_key = get_conversation_key(user1, user2)
    history = private_conversations.get(conv_key, [])
    emit('private_history', {'with_user': user2, 'history': history})


@socketio.on('message_seen')
def handle_message_seen(data):
    message_id = data.get('id')
    user1 = session.get('username') # El que vio el mensaje (destinatario)
    user2 = data.get('sender') # El que envió el mensaje
    
    conv_key = get_conversation_key(user1, user2)
    # Marcar el mensaje como visto en el historial del servidor
    for msg in private_conversations[conv_key]:
        if msg['id'] == message_id:
            msg['seen'] = True
            break
    
    sender_sid = user_to_sid.get(user2)
    if sender_sid:
        emit('update_seen_status', {'id': message_id}, to=sender_sid)

@socketio.on('typing')
def handle_typing(data):
    """Maneja el evento de 'escribiendo...'."""
    username = session.get('username')
    room = session.get('room')
    if username and room:
        # Reenvía el evento a todos en la sala, excepto al emisor original.
        emit('user_typing', {
            'username': username,
            'is_typing': data.get('is_typing', False)
        }, to=room, include_self=False)

@socketio.on('disconnect')
def handle_disconnect():
    username = sid_to_user.pop(request.sid, None)
    if username:
        user_to_sid.pop(username, None)
   
    room = session.get('room')
    if username and room and username in room_users.get(room, set()):
        leave_room(room)
        room_users[room].remove(username)
        
        # Si la sala queda vacía, se puede eliminar la sala y su historial (opcional)
        if not room_users[room]:
            room_users.pop(room)
            room_history.pop(room)
            # No eliminamos de active_rooms para que siga apareciendo en la lista
            
        print(f'{username} se ha desconectado de la sala {room}')
        emit('system', {'msg': f'{username} salió del chat.'}, to=room)
        update_user_list(room)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)