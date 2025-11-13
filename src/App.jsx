import { useState, useEffect } from 'react';
import './App.css';
import apiService from './services/api';
import Dashboard from './components/Dashboard';
import AddEntryModal from './components/AddEntryModal';
import TicketModal from './components/TicketModal';

function App() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  // Time restriction removed - accessible 24/7
  // const [isWithinAccessHours, setIsWithinAccessHours] = useState(true);
  // const [currentTime, setCurrentTime] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    vertical: '',
    type: '',
    examName: '',
    subject: '',
  });

  // Categories and exams
  const [categories, setCategories] = useState({});
  const [exams, setExams] = useState({});

  // Time restriction removed - site is accessible 24/7
  // const checkAccessHours = () => {
  //   const now = new Date();
  //   const istOffset = 5.5 * 60;
  //   const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  //   const istTime = new Date(utc + (istOffset * 60000));
  //   const hours = istTime.getHours();
  //   const timeString = istTime.toLocaleTimeString('en-IN', {
  //     hour: '2-digit',
  //     minute: '2-digit',
  //     second: '2-digit',
  //     hour12: true,
  //     timeZone: 'Asia/Kolkata'
  //   });
  //   setCurrentTime(timeString);
  //   const isWithinHours = hours >= 19 && hours < 22;
  //   setIsWithinAccessHours(isWithinHours);
  //   return isWithinHours;
  // };

  // Check for saved email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('user_email');
    const loginTimestamp = localStorage.getItem('login_timestamp');

    if (savedEmail && loginTimestamp) {
      const currentTime = new Date().getTime();
      const loginTime = parseInt(loginTimestamp, 10);
      const hoursSinceLogin = (currentTime - loginTime) / (1000 * 60 * 60);

      // Session expires after 24 hours
      if (hoursSinceLogin < 24) {
        setUserEmail(savedEmail);
      } else {
        // Session expired, clear storage and show login
        localStorage.removeItem('user_email');
        localStorage.removeItem('login_timestamp');
        setShowLoginModal(true);
      }
    } else {
      setShowLoginModal(true);
    }
  }, []);

  // Time restriction removed - no need to check access hours
  // useEffect(() => {
  //   checkAccessHours();
  //   const interval = setInterval(checkAccessHours, 60000);
  //   return () => clearInterval(interval);
  // }, []);

  // Fetch initial data on mount
  useEffect(() => {
    fetchData();
    fetchCategories();
    fetchExams();
  }, []);

  // Apply filters when data or filters change
  useEffect(() => {
    applyFilters();
  }, [data, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getData();
      if (response.success) {
        setData(response.data);
        setError(null);
      } else {
        setError('Failed to fetch data');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiService.getCategories();
      console.log('📦 Categories API Response:', response);
      console.log('📦 Response type:', typeof response);
      console.log('📦 Response keys:', Object.keys(response || {}));

      // Handle different response formats
      if (response.success) {
        console.log('✅ Setting categories from response.categories');
        setCategories(response.categories || {});
      } else if (response.categories) {
        console.log('✅ Setting categories from response.categories (no success flag)');
        setCategories(response.categories);
      } else if (typeof response === 'object' && !response.success) {
        console.log('✅ Setting categories from direct response object');
        setCategories(response);
      } else {
        console.warn('⚠️ Unexpected response format for categories');
      }
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
      console.error('Error details:', err.response?.data);
    }
  };

  const fetchExams = async () => {
    try {
      const response = await apiService.getExams();
      console.log('📚 Exams API Response:', response);
      console.log('📚 Response type:', typeof response);
      console.log('📚 Response keys:', Object.keys(response || {}));

      // Handle different response formats
      if (response.success) {
        console.log('✅ Setting exams from response.exams');
        setExams(response.exams || {});
      } else if (response.exams) {
        console.log('✅ Setting exams from response.exams (no success flag)');
        setExams(response.exams);
      } else if (typeof response === 'object' && !response.success) {
        console.log('✅ Setting exams from direct response object');
        setExams(response);
      } else {
        console.warn('⚠️ Unexpected response format for exams');
      }
    } catch (err) {
      console.error('❌ Error fetching exams:', err);
      console.error('Error details:', err.response?.data);
    }
  };

  const applyFilters = () => {
    let filtered = [...data];

    if (filters.vertical) {
      filtered = filtered.filter(item => item['Vertical Name'] === filters.vertical);
    }

    if (filters.type) {
      filtered = filtered.filter(item => item['Type of Content'] === filters.type);
    }

    if (filters.examName) {
      filtered = filtered.filter(item => item['Exam Name'] === filters.examName);
    }

    if (filters.subject) {
      filtered = filtered.filter(item => item['Subject'] === filters.subject);
    }

    setFilteredData(filtered);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      vertical: '',
      type: '',
      examName: '',
      subject: '',
    });
  };

  const handleAddEntry = async (newEntry) => {
    try {
      const response = await apiService.addRow(newEntry);
      if (response.success) {
        await fetchData();
        setShowAddModal(false);
        setShowSuccessModal(true);
        // Auto-hide success modal after 3 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 3000);
      }
    } catch (err) {
      alert('Error adding entry: ' + err.message);
    }
  };

  const handleUpdateEntry = async (rowIndex, updatedData) => {
    try {
      const response = await apiService.updateRow(rowIndex, updatedData);
      if (response.success) {
        await fetchData();
      }
    } catch (err) {
      alert('Error updating entry: ' + err.message);
    }
  };

  const handleDeleteEntry = async (rowIndex) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        const response = await apiService.deleteRow(rowIndex);
        if (response.success) {
          await fetchData();
        }
      } catch (err) {
        alert('Error deleting entry: ' + err.message);
      }
    }
  };

  const handleRaiseTicket = async (ticketData) => {
    try {
      const response = await apiService.raiseTicket(ticketData);
      return response;
    } catch (err) {
      throw err;
    }
  };

  // Get unique values for filters
  const getUniqueVerticals = () => {
    return [...new Set(data.map(item => item['Vertical Name']).filter(Boolean))];
  };

  const getUniqueTypes = () => {
    return [...new Set(data.map(item => item['Type of Content']).filter(Boolean))];
  };

  const getUniqueExamNames = () => {
    return [...new Set(data.map(item => item['Exam Name']).filter(Boolean))];
  };

  const getUniqueSubjects = () => {
    return [...new Set(data.map(item => item['Subject']).filter(Boolean))];
  };

  const handleLogin = (email) => {
    setUserEmail(email);
    localStorage.setItem('user_email', email);
    localStorage.setItem('login_timestamp', new Date().getTime().toString());
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    setUserEmail('');
    localStorage.removeItem('user_email');
    localStorage.removeItem('login_timestamp');
    setShowLoginModal(true);
  };

  // Time restriction removed - site is now accessible 24/7

  return (
    <div className="app">
      {/* Login Modal */}
      {showLoginModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(239, 68, 68, 0.1) 100%)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '3rem',
            width: '90%',
            maxWidth: '450px',
            boxShadow: '0 25px 70px rgba(236, 72, 153, 0.4), 0 0 0 2px rgba(236, 72, 153, 0.1)',
            border: '2px solid rgba(236, 72, 153, 0.2)',
          }}>
            <div style={{
              fontSize: '3rem',
              textAlign: 'center',
              marginBottom: '1rem',
              filter: 'drop-shadow(0 2px 4px rgba(236, 72, 153, 0.3))'
            }}>
              🎬
            </div>
            <h2 style={{
              marginBottom: '0.5rem',
              background: 'linear-gradient(135deg, #ec4899 0%, #ef4444 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textAlign: 'center',
              fontSize: '2rem',
              fontWeight: '700'
            }}>YT Sprints</h2>
            <p style={{
              color: '#666',
              fontSize: '0.95rem',
              marginBottom: '2rem',
              textAlign: 'center',
              lineHeight: '1.6'
            }}>
              Login using your ID here to upload your shorts
            </p>
            <form onSubmit={(e) => {
              e.preventDefault();
              const email = e.target.email.value;
              if (email) {
                handleLogin(email);
              }
            }}>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.75rem',
                  fontWeight: '600',
                  color: '#333',
                  fontSize: '0.95rem'
                }}>
                  📧 Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="yourname@adda247.com"
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '2px solid #fecdd3',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#ec4899';
                    e.target.style.boxShadow = '0 0 0 3px rgba(236, 72, 153, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#fecdd3';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'linear-gradient(135deg, #ec4899 0%, #ef4444 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '1.05rem',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(236, 72, 153, 0.4)',
                  transition: 'all 0.3s ease',
                  letterSpacing: '0.5px',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 12px 28px rgba(236, 72, 153, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 8px 20px rgba(236, 72, 153, 0.4)';
                }}
              >
                🚀 Continue to Dashboard
              </button>
            </form>
          </div>
        </div>
      )}

      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="header-title">
              <span className="brand">Adda</span> <span style={{ color: '#000', background: 'none', WebkitTextFillColor: '#000' }}>Education</span> Hackathon
            </h1>
            <p className="header-subtitle">
              🎬 YouTube Shorts Challenge - Content Management Dashboard
            </p>
          </div>
          <div className="header-right">
            {userEmail && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ color: '#666', fontSize: '0.9rem' }}>{userEmail}</span>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#dc3545',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container">
        <Dashboard
          data={filteredData}
          allData={data}
          loading={loading}
          error={error}
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          onAddEntry={() => setShowAddModal(true)}
          onRaiseTicket={() => setShowTicketModal(true)}
          onUpdateEntry={handleUpdateEntry}
          onDeleteEntry={handleDeleteEntry}
          uniqueVerticals={getUniqueVerticals()}
          uniqueTypes={getUniqueTypes()}
          uniqueExamNames={getUniqueExamNames()}
          uniqueSubjects={getUniqueSubjects()}
          categories={categories}
          exams={exams}
        />

        {showAddModal && (
          <AddEntryModal
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddEntry}
            categories={categories}
            exams={exams}
            uniqueSubjects={getUniqueSubjects()}
            existingData={data}
            userEmail={userEmail}
          />
        )}

        {showTicketModal && (
          <TicketModal
            onClose={() => setShowTicketModal(false)}
            onSubmit={handleRaiseTicket}
            exams={exams}
          />
        )}

        {showSuccessModal && (
          <div className="success-modal-overlay" onClick={() => setShowSuccessModal(false)}>
            <div className="success-modal" onClick={(e) => e.stopPropagation()}>
              <div className="success-icon-container">
                <div className="success-checkmark">
                  <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                    <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                    <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                  </svg>
                </div>
              </div>
              <h2 className="success-title">Entry Submitted Successfully!</h2>
              <p className="success-message">Your new entry has been added to the database.</p>
              <button className="success-close-btn" onClick={() => setShowSuccessModal(false)}>
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
}

export default App;
