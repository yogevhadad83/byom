import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { io, Socket } from 'socket.io-client';
import { Header } from '../components/Header';
import { JoinBar } from '../components/JoinBar';
import { ChatWindow } from '../components/ChatWindow';
import { Composer } from '../components/Composer';
import {
  addMessage,
  getMessages,
  setMessages,
  useMessages,
  type StoredMessage,
} from '../store/chatStore';
import type { Message } from '../types';
import { useAuth } from '../store/auth';
import { bootstrapProvider } from '../store/provider';

function InnerApp() {
  const auth = useAuth();
  const [userId, setUserId] = useState(() => {
    return (
      localStorage.getItem('userId') ||
      `user-${Math.random().toString(16).slice(2, 6)}`
    );
  });
  const [convId, setConvId] = useState(() => {
    return localStorage.getItem('conversationId') || 'demo';
  });
  const [joined, setJoined] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    localStorage.setItem('userId', userId);
  }, [userId]);
  useEffect(() => {
    localStorage.setItem('conversationId', convId);
  }, [convId]);

  const messages = useMessages(convId);

  // Bootstrap provider after a valid session is detected
  useEffect(() => {
    if (auth.session) {
      void bootstrapProvider();
    }
  }, [auth.session]);

  // When the user logs out or the session ends, leave the chat and reset UI
  useEffect(() => {
    if (!auth.session) {
      // Disconnect socket and reset joined state
      socketRef.current?.disconnect();
      socketRef.current = null;
      setJoined(false);
      // Clear local message cache for current conversation
      setMessages(convId, []);
    }
  }, [auth.session, convId]);

  const handleJoin = () => {
    // Allow overriding socket endpoint in dev via VITE_SOCKET_URL; default to same-origin
    const socketUrl = (import.meta as any).env?.VITE_SOCKET_URL || undefined;
    const s = io(socketUrl);
    socketRef.current?.disconnect();
    socketRef.current = s;
    s.emit('join', { conversationId: convId, userId });
    s.on('history', (msgs: StoredMessage[]) => {
      const participants = new Set(
        msgs.filter((m) => m.role === 'user').map((m) => m.author)
      );
      if (!participants.has(userId) && participants.size >= 2) {
        alert('Conversation already has two participants');
        s.disconnect();
        return;
      }
      setMessages(convId, msgs);
      setJoined(true);
    });
    s.on('message', (msg: StoredMessage) => {
      addMessage(convId, msg);
    });
    s.on('assistant', (msg: StoredMessage) => {
      addMessage(convId, msg);
    });
  };

  const handleSend = (text: string) => {
    const ts = Date.now();
    const msg: StoredMessage = { author: userId, role: 'user', text, ts };
    addMessage(convId, msg);
    socketRef.current?.emit('message', {
      conversationId: convId,
      author: userId,
      text,
      ts,
    });
  };

  const handleAssistantMessage = (m: { text: string; meta?: { modelId?: string } }) => {
    // Add as ephemeral first; only broadcast when user clicks "Show in chat".
    const ts = Date.now();
    const msg: StoredMessage = {
      author: 'assistant',
      role: 'assistant',
      text: m.text,
      ts,
      meta: m.meta,
      ephemeral: true,
    };
    addMessage(convId, msg);
  };

  const handleUserPrompt = (text: string) => {
    const ts = Date.now();
    const msg: StoredMessage = {
      author: userId,
      role: 'user',
      text,
      ts,
      ephemeral: true,
      meta: { sentToAI: true },
    };
    addMessage(convId, msg);
  };
  const publishMessage = (m: StoredMessage) => {
    const published: StoredMessage = { ...m, ephemeral: false };
    addMessage(convId, published);
    if (m.role === 'assistant') {
      socketRef.current?.emit('assistant', {
        conversationId: convId,
        author: 'assistant',
        text: m.text,
        ts: m.ts,
        meta: m.meta,
      });
    } else if (m.role === 'user') {
      socketRef.current?.emit('message', {
        conversationId: convId,
        author: userId,
        text: m.text,
        ts: m.ts,
        meta: m.meta,
      });
    }
  };

  const getSnapshot = (): Message[] =>
    getMessages(convId)
      .slice(-50)
  .map(({ author, role, text, ts }) => ({ author, role, text, ts }));

  return (
    <div className="flex flex-col h-screen">
      <Header conversationId={convId} connected={joined} />
      {!joined && (
        <JoinBar
          userId={userId}
          convId={convId}
          setUserId={setUserId}
          setConvId={setConvId}
          onJoin={handleJoin}
        />
      )}
      {joined && (
        <>
          <ChatWindow userId={userId} messages={messages} onPublish={publishMessage} />
          <Composer
            userId={userId}
            conversationId={convId}
            onSend={handleSend}
            getSnapshot={getSnapshot}
            onAssistantMessage={handleAssistantMessage}
            onUserPrompt={handleUserPrompt}
          />
        </>
      )}
    </div>
  );
}

export default function App() {
  return <InnerApp />;
}
