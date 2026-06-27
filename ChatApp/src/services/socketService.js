import { io } from 'socket.io-client';

const SOCKET_URL = 'https://chatapp-6-ejr7.onrender.com';

class SocketService {
  socket = null;

  connect(userId, username) {
    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected!');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected!');
    });

    return this.socket;
  }

  onConnect(callback) {
    this.socket.on('connect', callback);
  }

  joinRoom(roomId, userId, username, pushToken) {
    this.socket.emit('join_room', { roomId, userId, username, pushToken });
  }

  sendMessage(message) {
    this.socket.emit('send_message', message);
  }

  onNewMessage(callback) {
    this.socket.on('new_message', callback);
  }

  onChatHistory(callback) {
    this.socket.on('chat_history', callback);
  }

  startTyping(roomId, userId) {
    this.socket.emit('typing_start', { roomId, userId });
  }

  stopTyping(roomId, userId) {
    this.socket.emit('typing_stop', { roomId, userId });
  }

  onTyping(callback) {
    this.socket.on('user_typing', callback);
  }

  onStopTyping(callback) {
    this.socket.on('user_stop_typing', callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new SocketService();
