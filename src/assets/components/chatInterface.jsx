import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Sidebar from './sidebar.jsx';

const API_URL = 'https://chatbot-backend-uj6p.onrender.com/api';

function ChatInterface({ onLogout }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        // First, fetch existing conversations
        const response = await axios.get(`${API_URL}/conversations`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const conversations = response.data.conversations;
        
        if (conversations.length > 0) {
          // Load the most recent conversation
          const mostRecent = conversations[0];
          await loadConversation(mostRecent._id);
        } else {
          // No conversations exist, create a new one
          await createNewConversation();
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
      }
    };
    initializeChat();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async () => {
    if (!input.trim() && !selectedImage) return;

    setLoading(true);

    try {
      if (selectedImage) {
        const userMessage = { 
          text: input || 'Analyze this image', 
          sender: 'user',
          image: imagePreview,
          timeStamp: new Date()
        };
        setMessages((m) => [...m, userMessage]);

        const formData = new FormData();
        formData.append('image', selectedImage);
        formData.append('prompt', input || 'Describe this image');
        formData.append('conversationId', currentConversationId);

        const response = await axios.post(`${API_URL}/image/analyze`, formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
        });

        const botMessage = { text: response.data.reply, sender: 'bot', timeStamp: new Date() };
        setMessages((m) => [...m, botMessage]);

        clearImage();
      } else {
        const userMessage = { text: input, sender: 'user', timeStamp: new Date() };
        setMessages((m) => [...m, userMessage]);

        const response = await axios.post(`${API_URL}/chat`, 
          { message: input, conversationId: currentConversationId },
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        const botMessage = { text: response.data.reply, sender: 'bot', timeStamp: new Date() };
        setMessages((m) => [...m, botMessage]);
      }

      setInput('');
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = { 
        text: 'Sorry, something went wrong. Please try again.', 
        sender: 'bot' 
      };
      setMessages((m) => [...m, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      // Today - show time only
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 48) {
      // Yesterday
      return 'Yesterday, ' + date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      // Older - show date and time
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }) + ', ' + date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    }
  };

  const createNewConversation = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/conversations`,
        { title: 'New Conversation' },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      setCurrentConversationId(response.data.conversation._id);
      setMessages([]);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const loadConversation = async (conversationId) => {
    try {
      const response = await axios.get(`${API_URL}/conversations/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setCurrentConversationId(conversationId);
      setMessages(response.data.conversation.messages || []);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const handleDeleteConversation = (deletedId) => {
    if (currentConversationId === deletedId) {
      setCurrentConversationId(null);
      setMessages([]);
    }
  };

  const clearCurrentChat = async () => {
    if (!currentConversationId) return;
    
    try {
      await axios.delete(`${API_URL}/conversations/${currentConversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setMessages([]);
      setShowClearConfirm(false);
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar
        currentConversationId={currentConversationId}
        onSelectConversation={loadConversation}
        onNewConversation={createNewConversation}
        onDeleteConversation={handleDeleteConversation}
      />
      
      <div style={styles.mainContent}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>AI Chatbot</h1>
          <div style={styles.headerButtons}>
            {messages.length > 0 && (
              <button 
                onClick={() => setShowClearConfirm(true)} 
                style={styles.clearButton}
              >
                Clear Chat
              </button>
            )}
            <button onClick={onLogout} style={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>

        {/* Clear confirmation modal */}
        {showClearConfirm && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <p style={styles.modalText}>Are you sure you want to clear this chat?</p>
              <div style={styles.modalButtons}>
                <button onClick={clearCurrentChat} style={styles.confirmButton}>
                  Yes, Clear
                </button>
                <button onClick={() => setShowClearConfirm(false)} style={styles.cancelButton}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={styles.messagesArea}>
          {messages.length === 0 && (
            <div style={styles.emptyState}>
              <p style={styles.emptyTitle}>👋 Start a conversation</p>
              <p style={styles.emptySubtitle}>Send a message or upload an image to begin</p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                ...styles.messageWrapper,
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div
                style={{
                  ...styles.message,
                  ...(msg.sender === 'user' ? styles.userMessage : styles.botMessage)
                }}
              >
                {msg.image && (
                  <img src={msg.image} alt="uploaded" style={styles.messageImage} />
                )}
                <p style={styles.messageText}>{msg.text}</p>
                {msg.timeStamp && (
                  <span style={styles.timestamp}>
                    {formatTime(msg.timeStamp)}
                  </span>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{...styles.messageWrapper, justifyContent: 'flex-start'}}>
              <div style={{...styles.message, ...styles.botMessage}}>
                <div style={styles.loadingDots}>
                  <div style={styles.dot}></div>
                  <div style={styles.dot}></div>
                  <div style={styles.dot}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {imagePreview && (
          <div style={styles.imagePreviewContainer}>
            <img src={imagePreview} alt="preview" style={styles.previewImage} />
            <span style={styles.previewText}>Image selected</span>
            <button onClick={clearImage} style={styles.removeButton}>
              Remove
            </button>
          </div>
        )}

        <div style={styles.inputArea}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            style={{display: 'none'}}
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            style={styles.imageButton}
            title="Upload image"
          >
            📷
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            style={styles.input}
          />

          <button
            onClick={sendMessage}
            disabled={loading || (!input.trim() && !selectedImage)}
            style={{
              ...styles.sendButton,
              ...(loading || (!input.trim() && !selectedImage) ? styles.disabledButton : {})
            }}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'row', 
    height: '100vh',
    background: '#f5f5f5',
  },
  header: {
    background: 'white',
    borderBottom: '1px solid #ddd',
    padding: '20px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0,
  },
  logoutButton: {
    padding: '10px 20px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  headerButtons: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  clearButton: {
    padding: '10px 20px',
    background: '#ff9800',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    background: 'white',
    padding: '30px',
    borderRadius: '12px',
    textAlign: 'center',
    maxWidth: '400px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
  },
  modalText: {
    fontSize: '16px',
    color: '#333',
    marginBottom: '20px',
  },
  modalButtons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
  },
  confirmButton: {
    padding: '10px 20px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: '10px 20px',
    background: '#e0e0e0',
    color: '#333',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
  },
  emptyState: {
    textAlign: 'center',
    marginTop: '100px',
    color: '#999',
  },
  emptyTitle: {
    fontSize: '20px',
    marginBottom: '10px',
  },
  emptySubtitle: {
    fontSize: '14px',
  },
  messageWrapper: {
    display: 'flex',
    marginBottom: '15px',
  },
  message: {
    maxWidth: '70%',
    padding: '12px 18px',
    borderRadius: '18px',
    wordWrap: 'break-word',
  },
  userMessage: {
    background: '#667eea',
    color: 'white',
  },
  botMessage: {
    background: 'white',
    color: '#333',
    border: '1px solid #e0e0e0',
  },
  timestamp: {
    fontSize: '11px',
    color: '#999',
    marginTop: '4px',
    display: 'block',
  },
  messageImage: {
    maxWidth: '300px',
    borderRadius: '12px',
    marginBottom: '8px',
  },
  messageText: {
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
  loadingDots: {
    display: 'flex',
    gap: '4px',
  },
  dot: {
    width: '8px',
    height: '8px',
    background: '#999',
    borderRadius: '50%',
    animation: 'bounce 1.4s infinite ease-in-out',
  },
  imagePreviewContainer: {
    padding: '15px 30px',
    background: 'white',
    borderTop: '1px solid #ddd',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  previewImage: {
    width: '60px',
    height: '60px',
    borderRadius: '8px',
    objectFit: 'cover',
  },
  previewText: {
    flex: 1,
    color: '#666',
  },
  removeButton: {
    color: '#ef4444',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  inputArea: {
    background: 'white',
    borderTop: '1px solid #ddd',
    padding: '20px 30px',
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  imageButton: {
    padding: '12px 16px',
    background: '#f0f0f0',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '20px',
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontSize: '16px',
  },
  sendButton: {
    padding: '12px 24px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  disabledButton: {
    background: '#ccc',
    cursor: 'not-allowed',
  },
};

export default ChatInterface;