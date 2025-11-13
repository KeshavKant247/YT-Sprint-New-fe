import { useState, useEffect } from 'react';
import apiService from '../services/api';

function AddEntryModal({ onClose, onAdd, categories, exams, uniqueSubjects, existingData, userEmail }) {
  // Extract YouTube video ID from various URL formats
  const extractYouTubeVideoId = (url) => {
    if (!url) return '';

    // Regex patterns for different YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/shorts\/|youtu\.be\/shorts\/)([a-zA-Z0-9_-]{11})/,  // Shorts
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,         // Regular videos
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,                        // Embed
      /^([a-zA-Z0-9_-]{11})$/                                                // Just the ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return '';
  };

  // Check if video URL already exists
  const checkDuplicateVideoUrl = (url) => {
    if (!url || !existingData || existingData.length === 0) return null;

    // Extract video ID from the input URL
    const inputVideoId = extractYouTubeVideoId(url);
    if (!inputVideoId) return null;

    // Check if this video ID exists in any existing entry
    for (const item of existingData) {
      const existingUrl = item['Video Link'] || '';
      const existingVideoId = extractYouTubeVideoId(existingUrl);

      if (existingVideoId && existingVideoId === inputVideoId) {
        return item;
      }
    }

    return null;
  };

  // Handle link checker button click
  const handleCheckLink = () => {
    if (!checkLinkUrl.trim()) {
      setLinkCheckResult({ error: 'Please enter a video link' });
      return;
    }

    setIsChecking(true);

    // Extract video ID
    const videoId = extractYouTubeVideoId(checkLinkUrl);

    if (!videoId) {
      setLinkCheckResult({
        error: 'Invalid YouTube link. Please enter a valid YouTube URL.'
      });
      setIsChecking(false);
      return;
    }

    // Check for duplicate
    const duplicate = checkDuplicateVideoUrl(checkLinkUrl);

    setTimeout(() => {
      if (duplicate) {
        setLinkCheckResult({
          exists: true,
          videoId: videoId,
          data: duplicate
        });
      } else {
        setLinkCheckResult({
          exists: false,
          videoId: videoId
        });
        // Automatically populate the Video Link field when video is not found
        handleChange('Video Link', checkLinkUrl);
      }
      setIsChecking(false);
    }, 300);
  };

  // Calculate next Sr. No.
  const getNextSrNo = () => {
    if (!existingData || existingData.length === 0) return '1';

    // Get all numeric Sr. No. values
    const srNos = existingData
      .map(item => {
        const srNo = item['Sr no.'] || item['Sr No.'] || item['Sr. No.'] || '';
        return parseInt(srNo, 10);
      })
      .filter(num => !isNaN(num));

    // Return max + 1, or 1 if no valid numbers found
    const maxSrNo = srNos.length > 0 ? Math.max(...srNos) : 0;
    return String(maxSrNo + 1);
  };

  const [formData, setFormData] = useState({
    'Sr no.': getNextSrNo(),
    'Email': userEmail || '',
    'Vertical Name': '',
    'Exam Name': '',
    'Subject': '',
    'Type of Content': '',
    'Sub category': '',
    'Video Link': '',
    'Edit': '',
    'Editor Brief': '',
    'Final Edited Link': '',
    'VideoId': '',
  });

  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [isDuplicate, setIsDuplicate] = useState(false);

  // Link checker states
  const [checkLinkUrl, setCheckLinkUrl] = useState('');
  const [linkCheckResult, setLinkCheckResult] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  
  // Subject search states
  const [subjectSearch, setSubjectSearch] = useState('');
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  
  // Allowed email domains
  const allowedDomains = ['adda247.com', 'addaeducation.com', 'studyiq.com'];
  const [emailError, setEmailError] = useState('');
  
  // Note: YouTube videos are NO LONGER downloaded for new entries
  // We just save the YouTube URL directly to save storage and time

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Validate email domain in real-time
    if (field === 'Email') {
      if (value.includes('@')) {
        const emailDomain = value.split('@')[1]?.toLowerCase();
        if (emailDomain && !allowedDomains.includes(emailDomain)) {
          setEmailError(`Only emails from ${allowedDomains.join(', ')} are allowed`);
        } else {
          setEmailError('');
        }
      } else {
        setEmailError('');
      }
    }

    // Check for duplicate video URL and extract VideoId when Video Link changes
    if (field === 'Video Link') {
      const duplicate = checkDuplicateVideoUrl(value);
      if (duplicate) {
        setDuplicateWarning(
          `This video already exists in Sr. No. ${duplicate['Sr no.'] || 'N/A'} - ${duplicate['Exam Name'] || 'N/A'}`
        );
        setIsDuplicate(true);
      } else {
        setDuplicateWarning(null);
        setIsDuplicate(false);
      }

      // Extract and set VideoId from the URL
      const videoId = extractYouTubeVideoId(value);
      setFormData((prev) => ({
        ...prev,
        'VideoId': videoId,
      }));
    }

    // Reset Exam Name and Subject when Vertical Name changes
    if (field === 'Vertical Name') {
      setFormData((prev) => ({
        ...prev,
        'Exam Name': '',
        'Subject': '',
      }));
    }

    // Reset subcategory and subject when content type changes
    if (field === 'Type of Content') {
      setFormData((prev) => ({
        ...prev,
        'Sub category': '',
        // Clear Subject if switching to non-Content type
        ...(value !== 'Content' ? { 'Subject': '' } : {})
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation - All fields are mandatory
    if (!formData['Email']) {
      alert('Please enter your Email');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData['Email'])) {
      alert('Please enter a valid email address');
      return;
    }

    // Validate email domain
    const emailDomain = formData['Email'].split('@')[1]?.toLowerCase();
    if (!allowedDomains.includes(emailDomain)) {
      alert(`Only emails from ${allowedDomains.join(', ')} are allowed`);
      return;
    }

    if (!formData['Type of Content']) {
      alert('Please select Type of Content');
      return;
    }
    
    // Sub category is only required for "Content" type
    if (formData['Type of Content'] === 'Content' && !formData['Sub category']) {
      alert('Please select Sub category');
      return;
    }

    if (!formData['Vertical Name']) {
      alert('Please select Vertical Name');
      return;
    }

    if (!formData['Exam Name']) {
      alert('Please select Exam Name');
      return;
    }

    // Subject is only required for "Content" type
    if (formData['Type of Content'] === 'Content' && !formData['Subject']) {
      alert('Please select Subject');
      return;
    }

    if (!formData['Edit']) {
      alert('Please select Status');
      return;
    }

    // Validate based on status
    if (formData['Edit'] === 'Final' && !formData['Video Link']) {
      alert('Please provide YouTube Video Link');
      return;
    }

    if (formData['Edit'] === 'Re-edit' && !formData['Re-edit Drive Link']) {
      alert('Please provide Google Drive Link');
      return;
    }

    // Check for duplicate video
    if (isDuplicate) {
      const confirmSubmit = window.confirm(
        'This video URL already exists in the sheet. Do you still want to add it?'
      );
      if (!confirmSubmit) {
        return;
      }
    }

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://yt-sprint-new-fe-uzhk.vercel.app';

    // For Re-edit entries with Google Drive link, just submit directly
    if (formData['Edit'] === 'Re-edit' && formData['Re-edit Drive Link']) {
      // Extract file ID from Google Drive link if possible
      const driveUrl = formData['Re-edit Drive Link'].trim();
      const fileIdMatch = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      const videoId = fileIdMatch ? fileIdMatch[1] : '';

      const updatedFormData = {
        ...formData,
        'VideoId': videoId,
        'Video Link': driveUrl, // Store Drive link in Video Link field
      };
      onAdd(updatedFormData);
    }
    // For new entries with YouTube links, just save the YouTube URL directly
    // No need to download/store the video - saves storage and speeds up submission
    else if (formData['Video Link'] && formData['Edit'] === 'Final') {
      const youtubeUrl = formData['Video Link'].trim();
      
      // Check if it's a YouTube URL
      const isYouTubeUrl = /(?:youtube\.com|youtu\.be)/.test(youtubeUrl);
      
      if (isYouTubeUrl) {
        // NEW BEHAVIOR: Just save the YouTube URL, don't download the video
        // This saves storage space and submission time
        console.log('✅ Saving YouTube link directly (no download needed):', youtubeUrl);
        onAdd(formData);
      } else {
        // Not a YouTube URL, just submit normally
        onAdd(formData);
      }
    } else {
      onAdd(formData);
    }
  };

  // Helper function to normalize vertical names
  const normalizeVerticalName = (vertical) => {
    // Special cases for all-caps names
    const specialCases = {
      'ugc': 'UGC',
      'ssc': 'SSC'
    };

    const lowerVertical = vertical.toLowerCase();

    if (specialCases[lowerVertical]) {
      return specialCases[lowerVertical];
    }

    // Default: capitalize first letter
    return vertical.charAt(0).toUpperCase() + vertical.slice(1);
  };

  // Vertical to Exam mapping - Now using API data from exams prop
  // exams prop comes from backend API endpoint /api/exams
  const getVerticalExamMapping = () => {
    if (!exams || Object.keys(exams).length === 0) {
      // Fallback to empty mapping if API data not loaded
      return {};
    }

    const mapping = {};

    // Convert exams object to mapping format
    // Backend returns: { "Bank": { "exams": [...], "subjects": [...] }, ... }
    Object.keys(exams).forEach(vertical => {
      const normalizedVertical = normalizeVerticalName(vertical);

      if (exams[vertical].exams && exams[vertical].exams.length > 0) {
        mapping[normalizedVertical] = exams[vertical].exams;
      } else {
        mapping[normalizedVertical] = [];
      }
    });

    return mapping;
  };

  const verticalExamMapping = getVerticalExamMapping();

  // Vertical to Subject mapping - Now using API data from exams prop
  const getVerticalSubjectMapping = () => {
    if (!exams || Object.keys(exams).length === 0) {
      return {};
    }

    const mapping = {};

    Object.keys(exams).forEach(vertical => {
      const normalizedVertical = normalizeVerticalName(vertical);

      if (exams[vertical].subjects && exams[vertical].subjects.length > 0) {
        mapping[normalizedVertical] = exams[vertical].subjects;
      } else {
        mapping[normalizedVertical] = [];
      }
    });

    return mapping;
  };

  const verticalSubjectMapping = getVerticalSubjectMapping();

  const getSubcategories = () => {
    const contentType = formData['Type of Content'];

    const subcategoryMapping = {
      'Exam_Information': [
        'Exam Pattern',
        'Syllabus Overview',
        'Preparation Strategy',
        'Study Plan'
      ],
      'Content': [
        'Topic/Facts',
        'Question',
        'Tricks & Formulas'
      ],
      'Motivational_or_Fun': [
        'Motivational Shorts',
        'Classroom Moments',
        'Exam Life Situations'
      ]
    };

    return subcategoryMapping[contentType] || [];
  };

  const getAllVerticals = () => {
    // Get verticals dynamically from exams prop (API data)
    if (!exams || Object.keys(exams).length === 0) {
      console.warn('No exams data available. Exams object:', exams);
      return [];
    }
    const verticals = Object.keys(exams).map(vertical => normalizeVerticalName(vertical));
    console.log('Available verticals:', verticals);
    return verticals;
  };

  const getExamsByVertical = () => {
    const vertical = formData['Vertical Name'];
    if (!vertical) return [];
    return verticalExamMapping[vertical] || [];
  };

  const getSubjectsByVertical = () => {
    const vertical = formData['Vertical Name'];
    if (!vertical) return [];
    return verticalSubjectMapping[vertical] || [];
  };

  const getFilteredSubjects = () => {
    const subjects = getSubjectsByVertical();
    if (!subjectSearch.trim()) return subjects;
    
    return subjects.filter(subject =>
      subject.toLowerCase().includes(subjectSearch.toLowerCase())
    );
  };

  const getAllExamNames = () => {
    // Extract all exam names from the exams object
    const examNames = [];
    Object.keys(exams).forEach(category => {
      if (exams[category].exams && exams[category].exams.length > 0) {
        examNames.push(...exams[category].exams);
      }
    });
    return examNames;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Entry</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Sr no. is auto-generated but hidden from view */}

          {/* 1. Email Address */}
          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              value={formData['Email']}
              onChange={(e) => handleChange('Email', e.target.value)}
              placeholder="yourname@adda247.com"
              required
              readOnly
              style={{
                backgroundColor: '#f8f9fa',
                cursor: 'not-allowed',
                ...(emailError ? { borderColor: '#dc3545', borderWidth: '2px' } : {})
              }}
            />
            {!emailError && formData['Email'] && formData['Email'].includes('@') && (
              <small style={{ color: '#28a745', marginTop: '0.5rem', display: 'block' }}>
                ✅ Logged in as {formData['Email']}
              </small>
            )}
          </div>

          {/* 2. Verification Link (Link Checker) */}
          <div className="form-group verification-section">
            <label>
              🔍 Verification Link
            </label>
            <div className="verification-input-group">
              <input
                type="url"
                value={checkLinkUrl}
                onChange={(e) => {
                  setCheckLinkUrl(e.target.value);
                  setLinkCheckResult(null);
                }}
                placeholder="https://youtube.com/shorts/..."
              />
              <button
                type="button"
                onClick={handleCheckLink}
                disabled={isChecking || !checkLinkUrl.trim()}
              >
                {isChecking ? 'Checking...' : 'Check Link'}
              </button>
            </div>

            {/* Display check results */}
            {linkCheckResult && (
              <div className="verification-result">
                {linkCheckResult.error && (
                  <div className="verification-result-error">
                    <strong>❌ Error:</strong> {linkCheckResult.error}
                  </div>
                )}

                {linkCheckResult.exists && (
                  <div className="verification-result-exists">
                    <div style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.95)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      zIndex: 9999,
                      color: 'white',
                      textAlign: 'center',
                      padding: '2rem'
                    }}>
                      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🕐</div>
                      <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: '#fff' }}>
                        ⚠️ Video Already Exists
                      </h1>
                      <p style={{ fontSize: '1.5rem', marginBottom: '1rem', lineHeight: '1.6' }}>
                        This website opens at <strong style={{ color: '#FFD700' }}>7:00 PM</strong>
                      </p>
                      <p style={{ fontSize: '1.2rem', color: '#FFD700', marginTop: '1rem' }}>
                        Please join again between <strong>7:00 PM to 10:00 PM</strong>
                      </p>
                      <button
                        onClick={() => {
                          setLinkCheckResult(null);
                          setCheckLinkUrl('');
                        }}
                        style={{
                          marginTop: '2rem',
                          padding: '1rem 2rem',
                          fontSize: '1.1rem',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}

                {linkCheckResult.exists === false && (
                  <div className="verification-result-success">
                    <strong>✅ No duplicate found</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Type of Content */}
          <div className="form-group">
            <label>Type of Content *</label>
            <select
              value={formData['Type of Content']}
              onChange={(e) => handleChange('Type of Content', e.target.value)}
              required
            >
              <option value="">Select Content Type</option>
              <option value="Exam_Information">Exam Information</option>
              <option value="Content">Content</option>
              <option value="Motivational_or_Fun">Motivational or Fun</option>
            </select>
          </div>

          {/* 4. Sub category - Only show for "Content" type */}
          {formData['Type of Content'] === 'Content' && (
            <div className="form-group">
              <label>Sub category *</label>
              <select
                value={formData['Sub category']}
                onChange={(e) => handleChange('Sub category', e.target.value)}
                disabled={!formData['Type of Content']}
                required
              >
                <option value="">Select Subcategory</option>
                {getSubcategories().map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 5. Vertical Name */}
          <div className="form-group">
            <label>Vertical Name *</label>
            <select
              value={formData['Vertical Name']}
              onChange={(e) => handleChange('Vertical Name', e.target.value)}
              required
            >
              <option value="">Select Vertical</option>
              {getAllVerticals().map((vertical) => (
                <option key={vertical} value={vertical}>
                  {vertical}
                </option>
              ))}
            </select>
          </div>

          {/* 6. Exam Name */}
          <div className="form-group">
            <label>Exam Name *</label>
            <select
              value={formData['Exam Name']}
              onChange={(e) => handleChange('Exam Name', e.target.value)}
              disabled={!formData['Vertical Name']}
              required
            >
              <option value="">Select Exam</option>
              <option value="All">All</option>
              {getExamsByVertical().map((exam) => (
                <option key={exam} value={exam}>
                  {exam}
                </option>
              ))}
            </select>
          </div>

          {/* 7. Subject - Only show for "Content" type */}
          {formData['Type of Content'] === 'Content' && (
            <div className="form-group" style={{ position: 'relative' }}>
              <label>Subject *</label>
              <input
                type="text"
                value={subjectSearch || formData['Subject']}
                onChange={(e) => {
                  setSubjectSearch(e.target.value);
                  setShowSubjectDropdown(true);
                  // Clear the selected subject if user is typing
                  if (formData['Subject']) {
                    handleChange('Subject', '');
                  }
                }}
                onFocus={() => setShowSubjectDropdown(true)}
                placeholder={formData['Vertical Name'] ? "Search or select subject..." : "Select a vertical first"}
                disabled={!formData['Vertical Name']}
                autoComplete="off"
                required
              />
              
              {/* Searchable dropdown */}
              {showSubjectDropdown && formData['Vertical Name'] && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    backgroundColor: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                    marginTop: '4px'
                  }}
                >
                  {getFilteredSubjects().length > 0 ? (
                    getFilteredSubjects().map((subject) => (
                      <div
                        key={subject}
                        onClick={() => {
                          handleChange('Subject', subject);
                          setSubjectSearch('');
                          setShowSubjectDropdown(false);
                        }}
                        style={{
                          padding: '10px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f0f0f0',
                          backgroundColor: formData['Subject'] === subject ? '#f8f9fa' : '#fff',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = formData['Subject'] === subject ? '#f8f9fa' : '#fff'}
                      >
                        {subject}
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '10px 12px', color: '#6c757d', textAlign: 'center' }}>
                      No subjects found
                    </div>
                  )}
                </div>
              )}
              
              {formData['Subject'] && (
                <small style={{ color: '#28a745', marginTop: '0.5rem', display: 'block' }}>
                  Selected: {formData['Subject']}
                </small>
              )}
            </div>
          )}

          {/* 8. Status (Edit) */}
          <div className="form-group">
            <label>Status *</label>
            <select
              value={formData['Edit']}
              onChange={(e) => handleChange('Edit', e.target.value)}
              required
            >
              <option value="">Select Status</option>
              <option value="Final">Final</option>
              <option value="Re-edit">Re-edit</option>
            </select>
          </div>

          {/* Conditional: If Final - Show Video Link */}
          {formData['Edit'] === 'Final' && (
            <div className="form-group">
              <label>YouTube Video Link *</label>
              <input
                type="url"
                value={formData['Video Link']}
                onChange={(e) => handleChange('Video Link', e.target.value)}
                placeholder="https://youtube.com/shorts/..."
                style={isDuplicate ? { borderColor: '#dc3545', borderWidth: '2px' } : {}}
                required
              />
              <small style={{ color: '#6c757d', marginTop: '0.5rem', display: 'block' }}>
                YouTube short Video
              </small>
              {duplicateWarning && (
                <div className="duplicate-warning">
                  <strong>⚠️ Warning:</strong> {duplicateWarning}
                </div>
              )}
            </div>
          )}

          {/* Conditional: If Re-edit - Show Google Drive Link Input */}
          {formData['Edit'] === 'Re-edit' && (
            <div className="form-group">
              <label>Google Drive Link *</label>
              <input
                type="url"
                value={formData['Re-edit Drive Link'] || ''}
                onChange={(e) => handleChange('Re-edit Drive Link', e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                style={{ padding: '0.75rem' }}
                required
              />
              <small style={{ color: '#6c757d', marginTop: '0.5rem', display: 'block' }}>
                Paste the Google Drive link (make sure it's shared with "Anyone with the link")
              </small>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Entry
            </button>
          </div>        </form>
      </div>
    </div>
  );
}

export default AddEntryModal;
