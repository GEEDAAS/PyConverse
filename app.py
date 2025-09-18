# app.py
from flask import Flask, render_template, request, redirect, url_for, session
from flask_socketio import SocketIO, emit, join_room, leave_room
from collections import defaultdict
import os

app = Flask(__name__, static_folder='static', template_folder='templates')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
socketio = SocketIO(app)

# --- Almacenamiento en Memoria ---
# Usamos defaultdict para que al acceder a una sala nueva, se cree una lista vacía automáticamente.
room_history = defaultdict(list)
room_users = defaultdict(set)
active_rooms = {"General", "Juegos", "Tareas"}

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

# NUEVA RUTA: Botón para salir completamente
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
    session['room'] = room
    join_room(room)

    # Añadir usuario a la lista de la sala
    room_users[room].add(username)
    
    print(f'{username} se ha unido a la sala: {room}')
    
    # 1. Enviar historial de mensajes al usuario que acaba de unirse
    emit('history', {'messages': room_history[room]})
    
    # 2. Notificar a todos en la sala que un nuevo usuario ha entrado
    emit('system', {'msg': f'{username} se unió al chat.'}, to=room)
    
    # 3. Actualizar la lista de participantes para todos en la sala
    update_user_list(room)

@socketio.on('chat_message')
def handle_chat_message(data):
    username = session.get('username', 'Anónimo')
    room = session.get('room')
    msg = data.get('msg', '').strip()

    if not msg or not room:
        return

    message_data = {'username': username, 'msg': msg}
    
    # Guardar mensaje en el historial de la sala
    room_history[room].append(message_data)
    # Opcional: Limitar el historial para no consumir mucha memoria
    if len(room_history[room]) > 100:
        room_history[room].pop(0)

    emit('chat_message', message_data, to=room)

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
    username = session.get('username')
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