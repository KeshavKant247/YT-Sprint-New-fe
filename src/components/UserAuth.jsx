import { useState, useEffect } from 'react';
import apiService from '../services/api';

// MongoDB Atlas Login Component (No Google OAuth)
function UserAuth({ onLoginSuccess, onLogout, currentUser }) {
  const [user, setUser] = useState(currentUser || null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  const allowedDomains = ['adda247.com', 'addaeducation.com', 'studyiq.com'];

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user_data');
    const token = localStorage.getItem('auth_token');

    if (savedUser && token) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        if (onLoginSuccess) {
          onLoginSuccess(userData);
        }
      } catch (err) {
        console.error('Error loading saved user:', err);
        localStorage.removeItem('user_data');
        localStorage.removeItem('auth_token');
      }
    } else {
      // Auto-open login modal if not logged in
      setShowLoginModal(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      console.log('🔐 Attempting domain-based login...');
      
      if (!email.trim()) {
        setLoginError('Email is required');
        setLoading(false);
        return;
      }

      // Validate email format
      if (!email.includes('@')) {
        setLoginError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      // Check domain client-side
      const emailDomain = email.split('@')[1]?.toLowerCase();
      if (!allowedDomains.includes(emailDomain)) {
        setLoginError(`Only emails from ${allowedDomains.join(', ')} are allowed`);
        setLoading(false);
        return;
      }

      // Call domain-based login endpoint
      const response = await apiService.loginWithEmail(email);

      if (response.success) {
        const userData = {
          username: response.user.username,
          email: response.user.email,
          provider: 'domain',
          auth_source: response.auth_source || 'Domain-based',
          loginTime: new Date().toISOString(),
        };

        // Save token and user data
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user_data', JSON.stringify(userData));
        setUser(userData);
        setShowLoginModal(false);
        setEmail('');
        
        // Call parent callback
        if (onLoginSuccess) {
          onLoginSuccess(userData);
        }

        console.log('✅ Login successful via', response.auth_source);
      } else {
        setLoginError(response.message || 'Login failed');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Login failed. Please try again.';
      setLoginError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setUser(null);
    setShowDropdown(false);
    
    if (onLogout) {
      onLogout();
    }
    
    console.log('✅ Logged out successfully');
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return '?';
    const name = user.username || user.email || '?';
    return name.charAt(0).toUpperCase();
  };

  // Get user domain
  const getUserDomain = () => {
    if (!user || !user.email) return '';
    const domain = user.email.split('@')[1];
    return domain || '';
  };

  if (loading && !showLoginModal) {
    return (
      <div className="user-auth">
        <div className="user-auth-loading" style={{
            padding: '0.75rem 1.5rem', 
            background: 'white', 
            borderRadius: '50px',
            border: '2px solid #e0e0e0',
            fontSize: '0.9rem',
            color: '#6c757d'
          }}>
            🔄 Loading...
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="user-auth">
        <div className="user-profile" onClick={() => setShowDropdown(!showDropdown)}>
          <div
            className="user-avatar"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            {getUserInitials()}
          </div>
          <span className="user-name">{user.username}</span>
          <svg
            className={`dropdown-arrow ${showDropdown ? 'open' : ''}`}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M4.427 6.427l3.573 3.572 3.572-3.572.928.928-4.5 4.5-4.5-4.5z" />
          </svg>
        </div>

        {showDropdown && (
          <div className="user-dropdown">
            <div className="user-dropdown-header">
              <div
                className="dropdown-avatar"
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '20px'
                }}
              >
                {getUserInitials()}
              </div>
              <div className="dropdown-user-info">
                <div className="dropdown-user-name">{user.username}</div>
                <div className="dropdown-user-email">{user.email}</div>
                <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '4px' }}>
                  🔐 {user.auth_source || 'MongoDB Atlas'}
                </div>
              </div>
            </div>
            <div className="user-dropdown-divider"></div>
            <button className="user-dropdown-item logout-btn" onClick={handleLogoutClick}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M11 8a.5.5 0 01-.5.5H5.707l2.147 2.146a.5.5 0 01-.708.708l-3-3a.5.5 0 010-.708l3-3a.5.5 0 11.708.708L5.707 7.5H10.5A.5.5 0 0111 8z" />
                <path fillRule="evenodd" d="M1 8a7 7 0 1014 0A7 7 0 001 8zm15 0A8 8 0 110 8a8 8 0 0116 0z" />
              </svg>
              Logout
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {showLoginModal && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(102, 126, 234, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(4px)',
          }}
          onClick={(e) => {
            if (e.target.className === 'modal-overlay') {
              setShowLoginModal(false);
              setLoginError('');
            }
          }}
        >
          <div
            className="login-modal"
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2.5rem',
              width: '90%',
              maxWidth: '420px',
              boxShadow: '0 20px 60px rgba(102, 126, 234, 0.3), 0 0 0 1px rgba(102, 126, 234, 0.1)',
              position: 'relative',
            }}
          >
            <button
              onClick={() => {
                setShowLoginModal(false);
                setLoginError('');
              }}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                border: 'none',
                background: 'transparent',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#999',
                padding: '4px',
                lineHeight: '1',
              }}
            >
              ×
            </button>

            <h2 style={{ marginBottom: '0.5rem', color: '#333' }}>🔐 Login</h2>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Sign in with your company email - no password needed!
            </p>

            {loginError && (
              <div style={{
                padding: '0.75rem',
                background: '#fee',
                border: '1px solid #fcc',
                borderRadius: '8px',
                color: '#c33',
                marginBottom: '1.5rem',
                fontSize: '0.9rem'
              }}>
                ❌ {loginError}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  color: '#555',
                  fontSize: '0.9rem'
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@adda247.com"
                  required
                  autoComplete="email"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    transition: 'border-color 0.3s',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: '#888', 
                  marginTop: '0.5rem' 
                }}>
                  ✅ Only {allowedDomains.join(', ')} emails are allowed
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '1rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: loading ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)',
                }}
              >
                {loading ? '🔄 Logging in...' : '🚀 Login'}
      </button>
            </form>

            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: '#f8f9fa',
              borderRadius: '8px',
              fontSize: '0.85rem',
              color: '#666'
            }}>
              <strong style={{ color: '#333' }}>🔒 Allowed Domains:</strong>
              <div style={{ marginTop: '0.5rem' }}>
                {allowedDomains.map((domain, index) => (
                  <div key={index} style={{ padding: '0.25rem 0' }}>
                    ✅ {domain}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default UserAuth;
