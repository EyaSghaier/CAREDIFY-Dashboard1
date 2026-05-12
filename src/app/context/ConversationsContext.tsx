import React, { createContext, useContext, useState, useCallback } from 'react';
import { conversations as initialConversations, Conversation, Message } from '../data/mockData';

interface ConversationsContextValue {
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  sendToPatient: (
    patientId: string,
    patientName: string,
    patientAvatar: string,
    content: string,
    isUrgent?: boolean
  ) => void;
}

const ConversationsContext = createContext<ConversationsContextValue | null>(null);

export const ConversationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>(
    initialConversations.map((c) => ({ ...c, messages: [...c.messages] }))
  );

  const sendToPatient = useCallback(
    (patientId: string, patientName: string, patientAvatar: string, content: string, isUrgent = false) => {
      const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const newMsg: Message & { isUrgent?: boolean } = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        senderId: 'doctor',
        senderName: 'Dr. Moreau',
        content,
        timestamp: now,
        isFromDoctor: true,
        isUrgent,
      };

      setConversations((prev) => {
        const existing = prev.find((c) => c.patientId === patientId);
        if (existing) {
          return prev.map((c) =>
            c.patientId === patientId
              ? { ...c, messages: [...c.messages, newMsg], lastMessage: content, lastTime: now, unread: 0 }
              : c
          );
        }
        // Create new conversation for patient who had no previous chat
        const newConvo: Conversation = {
          id: `c_${Date.now()}`,
          patientId,
          patientName,
          patientAvatar,
          lastMessage: content,
          lastTime: now,
          unread: 0,
          messages: [newMsg],
        };
        return [newConvo, ...prev];
      });
    },
    []
  );

  return (
    <ConversationsContext.Provider value={{ conversations, setConversations, sendToPatient }}>
      {children}
    </ConversationsContext.Provider>
  );
};

export const useConversations = () => {
  const ctx = useContext(ConversationsContext);
  if (!ctx) throw new Error('useConversations must be used within ConversationsProvider');
  return ctx;
};