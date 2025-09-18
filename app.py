from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
import os

# Flask básico
app = Flask(__name__, static_folder='static', template_folder='templates')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')

# Inicializar SocketIO (eventlet recomendado para WebSockets reales)
socketio = SocketIO(app, cors_allowed_origins="*")

# Mapa de usuarios conectados: sid -> username
users = {}

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    # Al conectarse, solo avisamos al cliente y mandamos el conteo actual
    emit('system', {'msg': 'Conectado al servidor. Ingresa tu usuario para empezar.'})
    emit('participants', {'count': len(users)})

@socketio.on('set_username')
def handle_set_username(data):
    username = (data.get('username') or '').strip()
    if not username:
        username = f'Usuario_{request.sid[:5]}'
    users[request.sid] = username
    emit('system', {'msg': f'{username} se unió al chat.'}, broadcast=True)
    emit('participants', {'count': len(users)}, broadcast=True)

@socketio.on('chat_message')
def handle_chat_message(data):
    msg = (data.get('msg') or '').strip()
    if not msg:
        return  # ignorar mensajes vacíos
    username = users.get(request.sid, f'Usuario_{request.sid[:5]}')
    # Reenviar a todos los clientes (broadcast)
    emit('chat_message', {'username': username, 'msg': msg}, broadcast=True)

@socketio.on('disconnect')
def handle_disconnect():
    username = users.pop(request.sid, None)
    if username:
        emit('system', {'msg': f'{username} salió del chat.'}, broadcast=True)
    emit('participants', {'count': len(users)}, broadcast=True)

if __name__ == '__main__':
    # host=0.0.0.0 para permitir acceso desde otras PCs de la red
    socketio.run(app, host='0.0.0.0', port=5000)
