const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json');

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Store online users and their push tokens
const onlineUsers = {};
const userTokens = {};

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  // User joins a room
  socket.on('join_room', ({ roomId, userId, username, pushToken }) => {
    socket.join(roomId);
    onlineUsers[socket.id] = { userId, username, roomId };

    // Save push token
    if (pushToken) {
      userTokens[userId] = pushToken;
    }

    console.log(`${username} joined room: ${roomId}`);
  });

  // User sends a message
  socket.on('send_message', async (message) => {
    // Send to everyone in room
    io.to(message.roomId).emit('new_message', message);

    // Send push notification to offline users
    await sendPushNotification(message);
  });

  // User is typing
  socket.on('typing_start', ({ roomId, userId }) => {
    socket.to(roomId).emit('user_typing', { userId });
  });

  // User stopped typing
  socket.on('typing_stop', ({ roomId, userId }) => {
    socket.to(roomId).emit('user_stop_typing', { userId });
  });

  // User disconnects
  socket.on('disconnect', () => {
    const user = onlineUsers[socket.id];
    if (user) {
      io.emit('user_offline', { userId: user.userId });
      delete onlineUsers[socket.id];
    }
    console.log('❌ User disconnected:', socket.id);
  });
});

// Send push notification via Firebase
async function sendPushNotification(message) {
  // Get all tokens except the sender
  const tokens = Object.entries(userTokens)
    .filter(([userId]) => userId !== message.userId)
    .map(([_, token]) => token);

  if (tokens.length === 0) return;

  const payload = {
    notification: {
      title: message.username,
      body: message.text,
    },
    data: {
      roomId: message.roomId,
      userId: message.userId,
      username: message.username,
    },
  };

  for (const token of tokens) {
    try {
      await admin.messaging().send({
        token,
        ...payload,
      });
      console.log('🔔 Notification sent!');
    } catch (error) {
      console.error('Notification error:', error.message);
    }
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});