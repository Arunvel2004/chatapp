import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useChatStore } from '../store/chatStore';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('');
  const setCurrentUser = useChatStore((s) => s.setCurrentUser);
  const setCurrentRoom = useChatStore((s) => s.setCurrentRoom);

  const handleJoin = () => {
    if (!username.trim() || !room.trim()) {
      Alert.alert('Error', 'Please enter username and room name');
      return;
    }

    setCurrentUser({ id: Date.now().toString(), username });
    setCurrentRoom(room);
    navigation.navigate('Chat');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💬 ChatApp</Text>
      <Text style={styles.subtitle}>Enter your details to join</Text>

      <TextInput
        style={styles.input}
        placeholder="Your Username"
        placeholderTextColor="#94A3B8"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Room Name"
        placeholderTextColor="#94A3B8"
        value={room}
        onChangeText={setRoom}
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.btn} onPress={handleJoin}>
        <Text style={styles.btnText}>Join Chat →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F1F5F9',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#F1F5F9',
    fontSize: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  btn: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
