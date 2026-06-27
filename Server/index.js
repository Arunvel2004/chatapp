const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const admin = require('firebase-admin');
// Try to load serviceAccount from file (local), otherwise use Environment Variables (Render)
let credential;
try {
  const serviceAccount = require('./serviceAccount.json');
  credential = admin.credential.cert(serviceAccount);
} catch (error) {
  credential = admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
  });
}

// Initialize Firebase
admin.initializeApp({
  credential,
});

const db = admin.firestore();

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
  socket.on('join_room', async ({ roomId, userId, username, pushToken }) => {
    socket.join(roomId);
    onlineUsers[socket.id] = { userId, username, roomId };

    // Save push token
    if (pushToken) {
      userTokens[userId] = pushToken;
    }

    console.log(`${username} joined room: ${roomId}`);

    // Fetch chat history from Firestore
    try {
      const messagesSnapshot = await db
        .collection('rooms')
        .doc(roomId)
        .collection('messages')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      const messages = [];
      messagesSnapshot.forEach((doc) => {
        messages.push(doc.data());
      });

      // Send the history back to the user who just joined, in chronological order
      socket.emit('chat_history', messages.reverse());
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  });

  // User sends a message
  socket.on('send_message', async (message) => {
    // Send to everyone in room
    io.to(message.roomId).emit('new_message', message);

    // Save to Firestore
    try {
      await db
        .collection('rooms')
        .doc(message.roomId)
        .collection('messages')
        .doc(message.id)
        .set(message);
    } catch (error) {
      console.error('Error saving message to Firestore:', error);
    }

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