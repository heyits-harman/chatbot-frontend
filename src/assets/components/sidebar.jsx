import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://chatbot-backend-uj6p.onrender.com/api';

function Sidebar({ 
  currentConversationId, 
  onSelectConversation, 
  onNewConversation,
  onDeleteConversation 
}) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API_URL}/conversations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, conversationId) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/conversations/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      fetchConversations();
      onDeleteConversation(conversationId);
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div style={styles.sidebar}>
      <button onClick={onNewConversation} style={styles.newChatButton}>
        + New Chat
      </button>

      <div style={styles.conversationList}>
        {loading ? (
          <p style={styles.loadingText}>Loading...</p>
        ) : conversations.length === 0 ? (
          <p style={styles.emptyText}>No conversations yet</p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv._id}
              onClick={() => onSelectConversation(conv._id)}
              style={{
                ...styles.conversationItem,
                ...(currentConversationId === conv._id ? styles.activeConversation : {})
              }}
            >
              <div style={styles.conversationInfo}>
                <p style={styles.conversationTitle}>{conv.title}</p>
                <p style={styles.conversationDate}>{formatDate(conv.updatedAt)}</p>
              </div>
              <button
                onClick={(e) => handleDelete(e, conv._id)}
                style={styles.deleteButton}
                title="Delete conversation"
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: '280px',
    background: '#f8f9fa',
    borderRight: '1px solid #ddd',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  newChatButton: {
    margin: '20px',
    padding: '12px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  conversationList: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 10px',
  },
  loadingText: {
    textAlign: 'center',
    color: '#999',
    padding: '20px',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: '20px',
    fontSize: '14px',
  },
  conversationItem: {
    padding: '12px',
    marginBottom: '8px',
    borderRadius: '8px',
    cursor: 'pointer',
    background: 'white',
    border: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.2s',
  },
  activeConversation: {
    background: '#667eea',
    color: 'white',
    border: '1px solid #667eea',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '4px',
  },
  conversationDate: {
    margin: 0,
    fontSize: '12px',
    opacity: 0.7,
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px 8px',
    opacity: 0.6,
  },
};

export default Sidebar;