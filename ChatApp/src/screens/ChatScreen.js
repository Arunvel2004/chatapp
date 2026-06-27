import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useChatStore } from '../store/chatStore';
import socketService from '../services/socketService';
import notificationService from '../services/notificationService';

export default function ChatScreen() {
  const [text, setText] = useState('');
  const flatListRef = useRef(null);

  const currentUser = useChatStore((s) => s.currentUser);
  const currentRoom = useChatStore((s) => s.currentRoom);
  const messages = useChatStore((s) => s.messages);
  const addMessage = useChatStore((s) => s.addMessage);
  const isTyping = useChatStore((s) => s.isTyping);
  const setIsTyping = useChatStore((s) => s.setIsTyping);

  useEffect(() => {
    const setupRoom = async () => {
      // Connect to socket
      socketService.connect();

      // Join the room
      const pushToken = await notificationService.registerForPushNotifications();
      socketService.joinRoom(currentRoom, currentUser.id, currentUser.username, pushToken);
      
      // Listen for new messages
      socketService.onNewMessage((message) => {
        addMessage(message);
      });

      // Listen for typing
      socketService.onTyping(() => setIsTyping(true));
      socketService.onStopTyping(() => setIsTyping(false));
    };

    setupRoom();

    return () => {
      socketService.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (!text.trim()) return;

    const message = {
      id: Date.now().toString(),
      text: text.trim(),
      roomId: currentRoom,
      userId: currentUser.id,
      username: currentUser.username,
      createdAt: new Date().toISOString(),
    };

    socketService.sendMessage(message);
    setText('');
  };

  const handleTyping = (value) => {
    setText(value);
    if (value.length > 0) {
      socketService.startTyping(currentRoom, currentUser.id);
    } else {
      socketService.stopTyping(currentRoom, currentUser.id);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.userId === currentUser.id;
    return (
      <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
        {!isMe && (
          <Text style={styles.username}>{item.username}</Text>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          <Text style={styles.messageText}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 60}>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {isTyping && (
        <Text style={styles.typingText}>Someone is typing...</Text>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#94A3B8"
          value={text}
          onChangeText={handleTyping}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={styles.sendText}>➤</Text>
        </TouchableOpacity>
      </View>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageRow: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  messageRowMe: {
    alignItems: 'flex-end',
  },
  username: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 4,
    marginLeft: 4,
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMe: {
    backgroundColor: '#6366F1',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#1E293B',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: '#F1F5F9',
    fontSize: 15,
  },
  typingText: {
    color: '#64748B',
    fontSize: 13,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    marginBottom: 24,
  },
  input: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#F1F5F9',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#6366F1',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  sendText: {
    color: '#fff',
    fontSize: 18,
  },
});
