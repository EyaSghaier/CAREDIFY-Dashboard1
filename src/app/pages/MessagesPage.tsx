import React, { useState, useRef, useEffect } from 'react';
import { Send, Search, Phone, Video, MoreVertical, Paperclip, Smile, AlertTriangle } from 'lucide-react';
import { Message } from '../data/mockData';
import { useLang } from '../context/LanguageContext';
import { useConversations } from '../context/ConversationsContext';

const repliesFR = [
  'Merci Docteur, je comprends.',
  "D'accord, je vais suivre vos instructions.",
  'Je me sens un peu mieux maintenant.',
  'Est-ce que je dois prendre mes médicaments maintenant?',
  'Je vous remercie pour votre suivi.',
  'Je note ces symptômes.',
];
const repliesEN = [
  'Thank you Doctor, I understand.',
  "Alright, I'll follow your instructions.",
  'I feel a little better now.',
  'Should I take my medication now?',
  'Thank you for your follow-up.',
  'I\'ll note these symptoms.',
];

export const MessagesPage: React.FC = () => {
  const { lang } = useLang();
  const { conversations: convos, setConversations: setConvos } = useConversations();
  const [selectedId, setSelectedId] = useState<string>(convos[0]?.id ?? '');
  const [inputText, setInputText] = useState('');
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConvo = convos.find((c) => c.id === selectedId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConvo?.messages.length]);

  const sendMessage = () => {
    if (!inputText.trim() || !selectedId) return;
    const newMsg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      senderId: 'doctor',
      senderName: 'Dr. Moreau',
      content: inputText.trim(),
      timestamp: new Date().toLocaleTimeString(lang === 'FR' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
      isFromDoctor: true,
    };
    setConvos((prev) => prev.map((c) => c.id === selectedId ? { ...c, messages: [...c.messages, newMsg], lastMessage: newMsg.content, lastTime: newMsg.timestamp, unread: 0 } : c));
    setInputText('');

    const convo = convos.find((c) => c.id === selectedId);
    if (convo && Math.random() > 0.4) {
      const replies = lang === 'FR' ? repliesFR : repliesEN;
      setTimeout(() => {
        const reply: Message = {
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          senderId: convo.patientId,
          senderName: convo.patientName,
          content: replies[Math.floor(Math.random() * replies.length)],
          timestamp: new Date().toLocaleTimeString(lang === 'FR' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
          isFromDoctor: false,
        };
        setConvos((prev) => prev.map((c) => c.id === selectedId ? { ...c, messages: [...c.messages, reply], lastMessage: reply.content, lastTime: reply.timestamp } : c));
      }, 2000 + Math.random() * 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const filteredConvos = convos.filter((c) => c.patientName.toLowerCase().includes(search.toLowerCase()));
  const markAsRead = (id: string) => setConvos((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));

  return (
    <div className="flex h-full" style={{ backgroundColor: 'var(--cd-bg1)' }}>
      {/* Conversation List */}
      <div
        className={`${selectedId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 lg:w-80 flex-shrink-0`}
        style={{ backgroundColor: 'var(--cd-bg2)', borderRight: '1px solid var(--cd-bd)' }}
      >
        <div className="p-4" style={{ borderBottom: '1px solid var(--cd-bd)' }}>
          <h2 className="font-bold text-base mb-3" style={{ color: 'var(--cd-t1)' }}>Messages</h2>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--cd-bg3)', border: '1px solid var(--cd-bd)' }}>
            <Search className="w-3.5 h-3.5" style={{ color: 'var(--cd-t5)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'FR' ? 'Rechercher...' : 'Search...'}
              className="bg-transparent text-xs outline-none w-full"
              style={{ color: 'var(--cd-t3)' }}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConvos.map((convo) => (
            <button
              key={convo.id}
              onClick={() => { setSelectedId(convo.id); markAsRead(convo.id); }}
              className="w-full text-left px-4 py-3 flex items-start gap-3 transition-colors"
              style={{ backgroundColor: selectedId === convo.id ? 'var(--cd-bg3)' : 'transparent', borderBottom: '1px solid var(--cd-bd2)', borderLeft: selectedId === convo.id ? '2px solid #0EA5E9' : '2px solid transparent' }}
              onMouseEnter={(e) => { if (selectedId !== convo.id) e.currentTarget.style.backgroundColor = 'var(--cd-hv)'; }}
              onMouseLeave={(e) => { if (selectedId !== convo.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#0284c7] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{convo.patientAvatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--cd-t1)' }}>{convo.patientName}</span>
                  <span className="text-[10px] flex-shrink-0 ml-1" style={{ color: 'var(--cd-t5)' }}>{convo.lastTime}</span>
                </div>
                <p className="text-xs truncate" style={{ color: 'var(--cd-t4)' }}>{convo.lastMessage}</p>
              </div>
              {convo.unread > 0 && <span className="w-4 h-4 bg-[#0EA5E9] text-white text-[10px] rounded-full flex items-center justify-center font-bold flex-shrink-0">{convo.unread}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      {selectedConvo ? (
        <div className={`${selectedId ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
          <div className="flex items-center justify-between px-5 py-3.5" style={{ backgroundColor: 'var(--cd-bg2)', borderBottom: '1px solid var(--cd-bd)' }}>
            <div className="flex items-center gap-3">
              <button className="md:hidden mr-1 transition-colors" style={{ color: 'var(--cd-t4)' }} onClick={() => setSelectedId('')}>←</button>
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#0284c7] flex items-center justify-center text-white text-xs font-bold">{selectedConvo.patientAvatar}</div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#10B981] rounded-full border-2" style={{ borderColor: 'var(--cd-bg2)' }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--cd-t1)' }}>{selectedConvo.patientName}</p>
                <p className="text-[#10B981] text-xs">{lang === 'FR' ? 'En ligne' : 'Online'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {[Phone, Video, MoreVertical].map((Icon, i) => (
                <button key={i} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--cd-t4)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--cd-hv)'; e.currentTarget.style.color = 'var(--cd-t1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--cd-t4)'; }}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--cd-bd)' }} />
              <span className="text-xs px-2" style={{ color: 'var(--cd-t5)' }}>{lang === 'FR' ? "Aujourd'hui" : 'Today'}</span>
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--cd-bd)' }} />
            </div>
            {selectedConvo.messages.map((msg) => {
              const isUrgent = (msg as Message & { isUrgent?: boolean }).isUrgent;
              return (
                <div key={msg.id} className={`flex ${msg.isFromDoctor ? 'justify-end' : 'justify-start'}`}>
                  {!msg.isFromDoctor && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#0284c7] flex items-center justify-center text-white text-[10px] font-bold mr-2 flex-shrink-0 self-end">
                      {selectedConvo.patientAvatar.slice(0, 1)}
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5 max-w-[70%]">
                    {isUrgent && (
                      <div className="flex items-center gap-1 self-end mb-0.5">
                        <AlertTriangle className="w-3 h-3 text-[#EF4444]" />
                        <span className="text-[10px] font-bold text-[#EF4444] uppercase tracking-wide">
                          {lang === 'FR' ? 'URGENCE' : 'URGENT'}
                        </span>
                      </div>
                    )}
                    <div
                      className={`px-4 py-2.5 rounded-2xl ${msg.isFromDoctor ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                      style={
                        isUrgent
                          ? { background: 'linear-gradient(135deg, #EF4444, #dc2626)', boxShadow: '0 0 12px rgba(239,68,68,0.3)' }
                          : { background: msg.isFromDoctor ? 'linear-gradient(135deg, #0EA5E9, #0284c7)' : 'var(--cd-hv)' }
                      }
                    >
                      <p
                        className={`text-sm leading-relaxed whitespace-pre-line ${msg.isFromDoctor ? 'text-white' : ''}`}
                        style={!msg.isFromDoctor ? { color: 'var(--cd-t1)' } : undefined}
                      >
                        {msg.content}
                      </p>
                      <p
                        className={`text-[10px] mt-1 text-right ${msg.isFromDoctor ? 'text-blue-200/70' : ''}`}
                        style={!msg.isFromDoctor ? { color: 'var(--cd-t4)' } : undefined}
                      >
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                  {msg.isFromDoctor && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white text-[10px] font-bold ml-2 flex-shrink-0 self-end">
                      Dr
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-4 py-3" style={{ backgroundColor: 'var(--cd-bg2)', borderTop: '1px solid var(--cd-bd)' }}>
            <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: 'var(--cd-bg3)', border: '1px solid var(--cd-bd)' }}>
              <button className="p-1 transition-colors" style={{ color: 'var(--cd-t4)' }} onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--cd-t1)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--cd-t4)'; }}>
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={lang === 'FR' ? 'Écrire un message...' : 'Write a message...'}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: 'var(--cd-t1)' }}
              />
              <button className="p-1 transition-colors" style={{ color: 'var(--cd-t4)' }} onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--cd-t1)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--cd-t4)'; }}>
                <Smile className="w-4 h-4" />
              </button>
              <button onClick={sendMessage} disabled={!inputText.trim()} className="p-1.5 rounded-lg transition-all disabled:opacity-40" style={{ background: inputText.trim() ? 'linear-gradient(135deg, #0EA5E9, #0284c7)' : 'var(--cd-hv)' }}>
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <p className="text-[10px] text-center mt-1.5" style={{ color: 'var(--cd-t5)' }}>
              {lang === 'FR' ? 'Entrée pour envoyer · Shift+Entrée pour nouvelle ligne' : 'Enter to send · Shift+Enter for new line'}
            </p>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center" style={{ color: 'var(--cd-t4)' }}>
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--cd-bg3)' }}>
              <Send className="w-7 h-7" style={{ color: 'var(--cd-t5)' }} />
            </div>
            <p>{lang === 'FR' ? 'Sélectionnez une conversation' : 'Select a conversation'}</p>
          </div>
        </div>
      )}
    </div>
  );
};