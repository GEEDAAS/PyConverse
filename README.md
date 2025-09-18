# PyConverse 💬

<p align="center">
  <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/comments.svg" width="100" alt="Chat Icon">
</p>

<p align="center">
  <strong>Una aplicación de chat web en tiempo real construida con Python, Flask y WebSockets.</strong>
  <br />
  <em>Un proyecto robusto que demuestra la comunicación full-duplex entre múltiples clientes y un servidor central.</em>
</p>

---

## ✨ Características Principales

Este proyecto no es solo un chat simple, sino una plataforma de comunicación completa con funcionalidades avanzadas:

-   **✅ Salas de Chat Múltiples:** Los usuarios pueden unirse a salas de chat públicas predefinidas o crear las suyas propias sobre la marcha para organizar conversaciones por temas.
-   **🤫 Mensajería Privada:** Permite a los usuarios iniciar conversaciones uno a uno directamente desde la lista de participantes, en una interfaz modal separada del chat principal.
-   **✔️ Confirmación de Lectura:** En los chats privados, el emisor puede ver cuando el destinatario ha leído el mensaje, mejorando la dinámica de la conversación.
-   **⌨️ Indicador de "Escribiendo...":** Proporciona retroalimentación visual en tiempo real cuando un usuario en la sala está redactando un mensaje.
-   **📜 Historial de Mensajes:** Al unirse a una sala, los nuevos usuarios reciben el historial reciente de la conversación para poder ponerse al día al instante.
-   **👥 Lista de Participantes en Vivo:** La barra lateral se actualiza automáticamente para mostrar quién está conectado en la sala en todo momento.
-   **🔔 Notificaciones de Mensajes:** Un indicador visual (un punto rojo) alerta a los usuarios sobre nuevos mensajes privados no leídos.
-   **📱 Diseño Totalmente Responsivo:** La interfaz se adapta perfectamente a cualquier tamaño de pantalla, desde un monitor de escritorio hasta un teléfono móvil, gracias a un diseño "mobile-first".

---

## 👨‍💻 Creado Por

Este proyecto fue desarrollado por un equipo de estudiantes de **Ingeniería en Sistemas Computacionales**:

-   **Gerardo Jorge Guerrero Frausto**
-   **Maribel Garcia Mora**
-   **Alan Leone Orlando Hinojosa Gonzalez**
-   **Carlos Antonio Aguilar Bueno**

---

## 🚀 Tecnologías Utilizadas

La aplicación se construyó utilizando un stack de tecnologías modernas y eficientes:

-   **Backend:**
    -   **Python 3:** El lenguaje principal para toda la lógica del servidor.
    -   **Flask:** Un micro-framework ligero para gestionar las rutas HTTP y servir la aplicación web.
    -   **Flask-SocketIO:** Una extensión crucial que integra WebSockets en Flask, permitiendo la comunicación bidireccional y en tiempo real.

-   **Frontend:**
    -   **HTML5:** Para la estructura semántica de la aplicación.
    -   **CSS3:** Para el diseño visual, incluyendo Flexbox, Grid y Media Queries para la responsividad.
    -   **JavaScript (Vanilla):** Para la interactividad del lado del cliente, manejando los eventos del DOM y la comunicación WebSocket con el servidor.

---

## 🔧 Guía de Despliegue y Uso Local

Sigue esta guía detallada para configurar y ejecutar la aplicación en tu entorno local y permitir que otros se conecten a través de tu red.

### **Paso 1: Obtener el Código Fuente**

Primero, necesitas una copia local del proyecto. Clona el repositorio usando Git:

```bash
    git clone [https://github.com/GEEDAAS/PyConverse.git](https://github.com/GEEDAAS/PyConverse.git)
    cd PyConverse
```
### **Paso 2: Configurar el Entorno Virtual y Activacion**

Es una buena práctica profesional aislar las dependencias del proyecto en un entorno virtual.

```bash
    # Windows
    python -m venv .venv
    .\.venv\Scripts\Activate

    # macOS / Linux
    python3 -m venv .venv
    source .venv\bin\Activate
```
Veras (.venv) al principio de la linea de tu terminal si se activó correctamente.

### **Paso 3: Instalar las Dependencias**

Asegurate de tener un archivo **requirements.txt** en la carpeta del proyecto con el siguiente contenido:
- Flask
- Flask-SocketIO
- python-engineio
- python-socketio
- Werkzeug

Luego instala las librerias con un solo comando:

```bash
    pip install -r requirements.txt
```

### **Paso 4: Iniciar el Sevridor del Chat**

Ejecuta el script prinicpal de la aplicación. El servidor se iniciara y estara listo para aceptar conexiones.

```bash
    python app.py
```

La terminarl te msotrara que el servidor esta corriendo en **http://0.0.0.0:5000**, lo que significa que es accesible desde otras computadoras en tu red.

### **Paso 5: Conectarse al Chat**

- Para conectarse desde la misma computadora (el "servdiro"), abre tu navegador web y ve a la direccion **http://0.0.0.0:5000** o **http://127.0.0.1:5000**.

- Para que otras computadoras se conecten (los "clientes"), deven estar **comecyadas a la misma red Wi-Fi o Ethernet** que la computadora servidor, como tambien se nececita encontrar la **dirección IP local** de la computadora servidor. Para ello, abra una terminal en la computadora servidor y escribe:

    ```bash
    # Windows / macOS / Linux
    ipconfig
    ```

- Busca la direccion **IPv4 Addres (Direccion IPv4)**.

- En las otras computadoras, abre el navegador web y ve a la direccion ip del servidor seguida del puerto **:5000**

    ```bash
    http://LA_IP:5000
    ```

---

## 📡 Protocolo de Comunicación (WebSockets)

La comunicación en tiempo real entre el cliente y el servidor se gestiona a través de un protocolo de eventos definido sobre Socket.IO.

### Cliente → Servidor

| Evento                | Payload (Datos JSON)                                | Descripción                                                                   |
| --------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| `join`                | `{ "room": "NombreDeLaSala" }`                      | Se emite al conectarse para unirse a una sala específica.                     |
| `chat_message`        | `{ "msg": "Hola a todos" }`                         | Envía un mensaje público a la sala actual.                                    |
| `private_message`     | `{ "recipient_username": "Pato", "msg": "Hola!" }`  | Envía un mensaje privado a un usuario específico.                             |
| `get_private_history` | `{ "with_user": "Pato" }`                           | Solicita el historial de la conversación privada con otro usuario.            |
| `typing`              | `{ "is_typing": true/false }`                       | Notifica al servidor que el cliente ha empezado o dejado de escribir.          |
| `message_seen`        | `{ "id": "uuid_del_msg", "sender": "Pato" }`        | Informa al servidor que un mensaje privado ha sido visto por el destinatario. |

### Servidor → Cliente

| Evento               | Payload (Datos JSON)                                                                | Descripción                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `history`            | `{ "messages": [...] }`                                                             | Envía el historial de mensajes públicos de una sala al cliente que recién se une.                          |
| `private_history`    | `{ "with_user": "Pato", "history": [...] }`                                         | Envía el historial de una conversación privada a un cliente tras su solicitud.                             |
| `update_user_list`   | `{ "users": ["Gerardo", "Pato"] }`                                                  | Envía la lista actualizada de usuarios en una sala. Se emite cuando alguien se une o se va.                |
| `system`             | `{ "msg": "Pato se unió al chat." }`                                                | Emite mensajes de sistema (uniones, salidas) a todos en una sala.                                          |
| `chat_message`       | `{ "id": "uuid", "username": "Pato", "msg": "Hola" }`                               | Reenvía un mensaje público a todos los clientes en la sala.                                                |
| `private_message`    | `{ "id": "uuid", "sender": "Gerardo", "recipient": "Pato", "msg": "Hola", "seen": false }` | Entrega un mensaje privado al emisor y al destinatario.                                                    |
| `update_seen_status` | `{ "id": "uuid_del_msg" }`                                                          | Informa al emisor original que su mensaje privado ha sido marcado como visto.                              |
| `user_typing`        | `{ "username": "Pato", "is_typing": true/false }`                                   | Informa a los clientes de una sala que otro usuario está (o ya no está) escribiendo.                       |

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.