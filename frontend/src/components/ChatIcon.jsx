import React, { useState, useEffect, useRef } from 'react';
import { useMainContext } from '../mainContext';
import api from '../api';
import socket from '../utils/socket';
import './ChatIcon.css';

const ChatIcon = () => {
  const { isAuthorized, tokenType, user } = useMainContext();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('list'); // 'list' or 'chat'
  const [chatList, setChatList] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [unreadCounts, setUnreadCounts] = useState({});
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Functions used in useEffect

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChatList = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/user/chat-list');
      setChatList(data.chatList || []);
      const counts = {};
      data.chatList?.forEach(chat => {
        counts[chat.appointmentId] = chat.unreadCount || 0;
      });
      setUnreadCounts(counts);
    } catch (err) {
      console.error('Error fetching chat list:', err);
      setError('Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsSeen = async (appointmentId) => {
    try {
      await api.put(`/user/chat/${appointmentId}/mark-seen`);
      setUnreadCounts(prev => ({ ...prev, [appointmentId]: 0 }));
    } catch (err) {
      console.error('Error marking messages as seen:', err);
    }
  };

  // Socket event listeners

  useEffect(() => {
    if (!isAuthorized || tokenType !== 'user' || !user) return;

    fetchChatList();

    // Socket event listeners
    const handleNewMessage = (message) => {
      if (selectedChat && message.appointment.toString() === selectedChat.appointmentId.toString()) {
        setMessages(prev => [...prev, message]);
        markMessagesAsSeen(selectedChat.appointmentId);
      } else {
        // Update unread count for other chats
        setUnreadCounts(prev => ({
          ...prev,
          [message.appointment]: (prev[message.appointment] || 0) + 1
        }));
      }
      scrollToBottom();
    };

    const handleChatHistory = (history) => {
      setMessages(history || []);
      if (selectedChat) {
        markMessagesAsSeen(selectedChat.appointmentId);
      }
      scrollToBottom();
    };

    const handleUserTyping = (data) => {
      if (user && selectedChat && data.userId !== user._id) {
        setTypingUsers(prev => new Set([...prev, data.userId]));
      }
    };

    const handleUserStoppedTyping = (data) => {
      if (user && data.userId !== user._id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }
    };

    const handleMessageNotification = (data) => {
      // Show browser notification if chat is not open
      if (!isOpen || (selectedChat && selectedChat.appointmentId !== data.appointmentId)) {
        if (Notification.permission === 'granted') {
          new Notification(`New message from ${data.from}`, {
            body: data.message.message,
            icon: '/skillconnect.png'
          });
        }
      }
    };

    const handleError = (error) => {
      console.error('Socket error:', error);
      setError(error);
    };

    socket.on('new-message', handleNewMessage);
    socket.on('chat-history', handleChatHistory);
    socket.on('user-typing', handleUserTyping);
    socket.on('user-stopped-typing', handleUserStoppedTyping);
    socket.on('message-notification', handleMessageNotification);
    socket.on('error', handleError);

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('chat-history', handleChatHistory);
      socket.off('user-typing', handleUserTyping);
      socket.off('user-stopped-typing', handleUserStoppedTyping);
      socket.off('message-notification', handleMessageNotification);
      socket.off('error', handleError);
    };
  }, [selectedChat, user, isOpen, isAuthorized, tokenType]);

  useEffect(() => {
    if (!isAuthorized || tokenType !== 'user' || !user) return;
    scrollToBottom();
  }, [messages, isAuthorized, tokenType, user]);

  // Only show for authenticated users
  if (!isAuthorized || tokenType !== 'user' || !user) {
    return null;
  }

  // Remaining functions

  const fetchMessages = async (appointmentId) => {
    try {
      socket.emit('join-chat', appointmentId);
    } catch (err) {
      console.error('Error joining chat:', err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      await api.post('/user/send-message', {
        appointmentId: selectedChat.appointmentId,
        message: newMessage.trim()
      });

      // Clear input and stop typing indicator
      setNewMessage('');
      socket.emit('stop-typing', selectedChat.appointmentId);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  const handleTyping = () => {
    if (!selectedChat) return;

    socket.emit('typing', selectedChat.appointmentId);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', selectedChat.appointmentId);
    }, 1000);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageStatusIcon = (status) => {
    switch (status) {
      case 'sent': return '✓';
      case 'delivered': return '✓✓';
      case 'seen': return '✓✓';
      default: return '';
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setView('list');
      setSelectedChat(null);
      setMessages([]);
      setError(null);
    }
  };

  const openChat = (chat) => {
    setSelectedChat(chat);
    setView('chat');
    setError(null);
    fetchMessages(chat.appointmentId);
  };

  const backToList = () => {
    setView('list');
    setSelectedChat(null);
    setMessages([]);
    setTypingUsers(new Set());
  };

  const totalUnreadCount = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  return (
    <>
      {/* Chat Icon */}
      <div className="chat-icon" onClick={toggleChat}>
        <span className="chat-icon-text">💬</span>
        {totalUnreadCount > 0 && (
          <span className="chat-badge">{totalUnreadCount}</span>
        )}
      </div>

      {/* Chat Panel */}
      {isOpen && (
        <div className="chat-panel">
          <div className="chat-header">
            {view === 'chat' ? (
              <>
                <button className="back-btn" onClick={backToList}>←</button>
                <h3>
                  {selectedChat?.otherUser?.firstName} {selectedChat?.otherUser?.lastName}
                </h3>
                <span className={`status-indicator ${selectedChat?.status?.toLowerCase()}`}>
                  {selectedChat?.status}
                </span>
              </>
            ) : (
              <>
                <h3>Messages</h3>
                <button className="close-btn" onClick={toggleChat}>×</button>
              </>
            )}
          </div>

          <div className="chat-body">
            {view === 'list' ? (
              loading ? (
                <p>Loading...</p>
              ) : error ? (
                <p className="error">{error}</p>
              ) : chatList.length === 0 ? (
                <p>No chats available.</p>
              ) : (
                <div className="chat-list">
                  {chatList.map((chat) => (
                    <div
                      key={chat.appointmentId}
                      className="chat-item"
                      onClick={() => openChat(chat)}
                    >
                      <div className="chat-item-header">
                        <h4>
                          {chat.otherUser?.firstName} {chat.otherUser?.lastName}
                        </h4>
                        {chat.lastMessage && (
                          <small>{formatTime(chat.lastMessage.timestamp)}</small>
                        )}
                      </div>
                      <div className="chat-item-content">
                        <p className="service-name">{chat.serviceRequest?.name}</p>
                        {chat.lastMessage ? (
                          <p className="last-message">
                            <strong>{chat.lastMessage.sender?.firstName}:</strong> {chat.lastMessage.message}
                          </p>
                        ) : (
                          <p className="no-messages">No messages yet</p>
                        )}
                      </div>
                      {unreadCounts[chat.appointmentId] > 0 && (
                        <span className="unread-badge">{unreadCounts[chat.appointmentId]}</span>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="chat-messages">
                {error && <p className="error">{error}</p>}

                <div className="messages-container">
                  {messages.map((msg) => (
                    <div
                      key={msg.id || msg._id}
                      className={`message-wrapper ${msg.sender._id === user._id ? 'own' : 'other'}`}
                    >
                      <div className="message-timestamp">
                        <small>{formatTime(msg.timestamp)}</small>
                      </div>
                      <div className={`message ${msg.sender._id === user._id ? 'own' : 'other'}`}>
                        {msg.sender._id !== user._id && (
                          <img
                            src={msg.sender.profileImage || 'https://via.placeholder.com/35?text=👤'}
                            alt={`${msg.sender.firstName} ${msg.sender.lastName}`}
                            className="message-avatar"
                          />
                        )}
                        <div className="message-content">
                          <span>{msg.message}</span>
                        </div>
                        {msg.sender._id === user._id && (
                          <span className={`message-status ${msg.status}`}>
                            {getMessageStatusIcon(msg.status)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {typingUsers.size > 0 && (
                    <div className="typing-indicator">
                      <span>Someone is typing...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                <div className="message-input">
                  <div className="input-icons">
                    <button className="icon-btn">🎤</button>
                    <button className="icon-btn">📷</button>
                    <button className="icon-btn">📎</button>
                  </div>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    disabled={loading}
                  />
                  <button
                    className="send-btn"
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || loading}
                  >
                    📤
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ChatIcon;
