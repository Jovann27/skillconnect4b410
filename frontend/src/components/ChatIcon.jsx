import { useState, useEffect, useRef } from 'react';
import { useMainContext } from '../mainContext';
import api from '../api';
import socket from '../utils/socket';
import './ChatIcon.css';
import { FaFacebookMessenger, FaLocationArrow  } from 'react-icons/fa';

const ChatIcon = () => {
  const { isAuthorized, tokenType, user } = useMainContext();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('list'); // 'list' or 'chat' or 'help'
  const [chatList, setChatList] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [unreadCounts, setUnreadCounts] = useState({});
  const [supportMessages, setSupportMessages] = useState([]);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportLoading, setSupportLoading] = useState(false);
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

  const fetchHelpTopics = async () => {
    setHelpLoading(true);
    setHelpError(null);
    try {
      const response = await api.get("/help/help");
      setHelpTopics(response.data.topics);
    } catch (error) {
      console.error("Error fetching help topics:", error);
      setHelpError("Failed to load help topics");
    } finally {
      setHelpLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHelpTopics();
    }
  }, [isOpen]);

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
    setExpandedTopic(null);
    setSupportMessages([]);
  };

  const sendSupportMessage = () => {
    if (!supportMessage.trim()) return;

    const userMsg = { sender: 'user', message: supportMessage.trim(), timestamp: new Date() };
    setSupportMessages(prev => [...prev, userMsg]);
    setSupportMessage('');

    // Simulate support typing
    setSupportLoading(true);
    setTimeout(() => {
      const supportResponse = getSupportResponse(userMsg.message);
      const supportMsg = { sender: 'support', message: supportResponse, timestamp: new Date() };
      setSupportMessages(prev => [...prev, supportMsg]);
      setSupportLoading(false);
    }, 1000); // 1 second delay
  };

  const getSupportResponse = (userMessage) => {
    const lowerMsg = userMessage.toLowerCase();
    if (lowerMsg.includes('password')) {
      return "For password issues, please visit the Account Settings page or contact us at skillconnect4b410@gmail.com.";
    }
    if (lowerMsg.includes('booking')) {
      return "To book a service, navigate to the skilled users list and select a service. If you need help, check our help center.";
    }
    if (lowerMsg.includes('account')) {
      return "For account-related issues, please check your profile settings or contact us at skillconnect4b410@gmail.com.";
    }
    if (lowerMsg.includes('technical') || lowerMsg.includes('bug') || lowerMsg.includes('report')) {
      return "For technical issues or bugs, please provide details about what happened and your device/browser info. We'll investigate and get back to you.";
    }
    if (lowerMsg.includes('help') || lowerMsg.includes('support') || lowerMsg.includes('other') || lowerMsg.includes('contact')) {
      return "I'm here to help! Please describe your issue in detail.";
    }
    return "Thank you for contacting support. Our team will respond shortly. For urgent issues, email skillconnect4b410@gmail.com.";
  };

  const handleSupportOption = (option) => {
    const messageMap = {
      password: 'I need help with password reset',
      booking: 'I need help with booking a service',
      account: 'I have account issues',
      technical: 'I have a technical issue or found a bug',
      other: 'I have another support request'
    };
    const userMsg = { sender: 'user', message: messageMap[option], timestamp: new Date() };
    setSupportMessages([userMsg]);
    setSupportLoading(true);
    setTimeout(() => {
      const supportMsg = { sender: 'support', message: getSupportResponse(userMsg.message), timestamp: new Date() };
      setSupportMessages([userMsg, supportMsg]);
      setSupportLoading(false);
    }, 1000);
  };

  const totalUnreadCount = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  return (
    <>
      {/* Chat Icon */}
      <button className="navbar-icon-btn" onClick={toggleChat}>
        <span className="chat-icon-text"><FaFacebookMessenger /></span>
        {totalUnreadCount > 0 && (
          <span className="chat-badge">{totalUnreadCount}</span>
        )}
      </button>

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
            ) : view === 'help' ? (
              <>
                <button className="back-btn" onClick={() => setView('list')}>←</button>
                <h3>Help Center</h3>
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
                  <div className="chat-item" onClick={() => setView('help')}>
                    <div className="chat-item-header">
                      <h4>Help Center</h4>
                      <small>Support</small>
                    </div>
                    <p className="last-message">Get help with your questions</p>
                  </div>
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
            ) : view === 'chat' ? (
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
                            src={msg.sender.profileImage}
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
                    <FaLocationArrow />
                  </button>
                </div>
              </div>
            ) : (
              <div className="chat-messages">
                <div className="messages-container">
                  {supportMessages.map((msg, index) => (
                    <div key={index} className={`message-wrapper ${msg.sender === 'user' ? 'own' : 'other'}`}>
                      <div className={`message ${msg.sender === 'user' ? 'own' : 'other'}`}>
                        <div className="message-content">
                          <span>{msg.message}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {supportLoading && (
                    <div className="typing-indicator">
                      <span>Support is typing...</span>
                    </div>
                  )}

                  {supportMessages.length === 0 && !supportLoading && (
                    <div className="message-wrapper other">
                      <div className="message other">
                        <div className="message-content">
                          <span>Welcome to Help Center! How can we assist you today?</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                            <button onClick={() => handleSupportOption('password')} style={{ padding: '8px 12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Password Reset</button>
                            <button onClick={() => handleSupportOption('booking')} style={{ padding: '8px 12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Booking Help</button>
                            <button onClick={() => handleSupportOption('account')} style={{ padding: '8px 12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Account Issues</button>
                            <button onClick={() => handleSupportOption('technical')} style={{ padding: '8px 12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Technical Issues</button>
                            <button onClick={() => handleSupportOption('other')} style={{ padding: '8px 12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Other</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {supportMessages.length > 0 && supportMessages[supportMessages.length - 1].sender === 'support' && !supportLoading && (
                    <div className="message-wrapper other">
                      <div className="message other">
                        <div className="message-content">
                          <span>Is there anything else I can help you with?</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                            <button onClick={() => handleSupportOption('password')} style={{ padding: '8px 12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Password Reset</button>
                            <button onClick={() => handleSupportOption('booking')} style={{ padding: '8px 12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Booking Help</button>
                            <button onClick={() => handleSupportOption('account')} style={{ padding: '8px 12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Account Issues</button>
                            <button onClick={() => handleSupportOption('technical')} style={{ padding: '8px 12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Technical Issues</button>
                            <button onClick={() => handleSupportOption('other')} style={{ padding: '8px 12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Other</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                <div className="message-input">
                  <input
                    type="text"
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendSupportMessage()}
                    placeholder="Type your message to support..."
                    disabled={supportLoading}
                  />
                  <button
                    className="send-btn"
                    onClick={sendSupportMessage}
                    disabled={!supportMessage.trim() || supportLoading}
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
