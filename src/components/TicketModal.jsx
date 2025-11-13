import { useState } from 'react';
import apiService from '../services/api';

function TicketModal({ onClose, onSubmit, exams }) {
  const [formData, setFormData] = useState({
    'Ticket ID': '',
    'Vertical': '',
    'Exam Name': '',
    'Subject': '',
    'Issue Type': '',
    'Status': 'Open',
    'Issue Text': '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate Ticket ID (timestamp-based)
  const generateTicketId = () => {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000);
    return `TKT-${timestamp}-${randomNum}`;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Reset Exam Name and Subject when Vertical changes
    if (field === 'Vertical') {
      setFormData((prev) => ({
        ...prev,
        'Exam Name': '',
        'Subject': '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData['Vertical'] || !formData['Exam Name'] || !formData['Subject'] || !formData['Issue Type'] || !formData['Issue Text']) {
      alert('Please fill in all required fields (Vertical, Exam Name, Subject, Issue Type, Issue Text)');
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate Ticket ID before submission
      const ticketData = {
        ...formData,
        'Ticket ID': generateTicketId(),
      };

      // Call the onSubmit callback
      const response = await onSubmit(ticketData);

      if (response && response.success) {
        alert(`Ticket raised successfully! Ticket ID: ${ticketData['Ticket ID']}`);
        onClose();
      } else {
        throw new Error(response?.error || 'Failed to raise ticket');
      }
    } catch (error) {
      console.error('Error raising ticket:', error);
      let errorMessage = 'Error raising ticket: ';

      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        errorMessage += 'Unable to connect to the server. Please check your internet connection and try again.';
      } else if (error.response) {
        errorMessage += error.response.data?.error || error.response.statusText || 'Server error';
      } else {
        errorMessage += error.message || 'Unknown error occurred';
      }

      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to normalize vertical names
  const normalizeVerticalName = (vertical) => {
    const specialCases = {
      'ugc': 'UGC',
      'ssc': 'SSC'
    };

    const lowerVertical = vertical.toLowerCase();

    if (specialCases[lowerVertical]) {
      return specialCases[lowerVertical];
    }

    return vertical.charAt(0).toUpperCase() + vertical.slice(1);
  };

  // Vertical to Exam mapping - Now using API data from exams prop
  const getVerticalExamMapping = () => {
    if (!exams || Object.keys(exams).length === 0) {
      return {};
    }

    const mapping = {};
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

  const getAllVerticals = () => {
    if (!exams || Object.keys(exams).length === 0) {
      return [];
    }
    return Object.keys(exams).map(vertical => normalizeVerticalName(vertical));
  };

  const getExamsByVertical = () => {
    const vertical = formData['Vertical'];
    if (!vertical) return [];
    return verticalExamMapping[vertical] || [];
  };

  const getSubjectsByVertical = () => {
    const vertical = formData['Vertical'];
    if (!vertical) return [];
    return verticalSubjectMapping[vertical] || [];
  };

  // Issue types
  const issueTypes = [
    'Wrong Data Entry',
    'Duplicate Entry',
    'Missing Information',
    'Incorrect Video Link',
    'Wrong Category/Subject',
    'Other'
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎫 Raise a Ticket</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Vertical *</label>
            <select
              value={formData['Vertical']}
              onChange={(e) => handleChange('Vertical', e.target.value)}
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

          <div className="form-group">
            <label>Exam Name *</label>
            <select
              value={formData['Exam Name']}
              onChange={(e) => handleChange('Exam Name', e.target.value)}
              disabled={!formData['Vertical']}
              required
            >
              <option value="">Select Exam</option>
              {getExamsByVertical().map((exam) => (
                <option key={exam} value={exam}>
                  {exam}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Subject *</label>
            <select
              value={formData['Subject']}
              onChange={(e) => handleChange('Subject', e.target.value)}
              disabled={!formData['Vertical']}
              required
            >
              <option value="">Select Subject</option>
              {getSubjectsByVertical().map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Issue Type *</label>
            <select
              value={formData['Issue Type']}
              onChange={(e) => handleChange('Issue Type', e.target.value)}
              required
            >
              <option value="">Select Issue Type</option>
              {issueTypes.map((issue) => (
                <option key={issue} value={issue}>
                  {issue}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              value={formData['Status']}
              onChange={(e) => handleChange('Status', e.target.value)}
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="form-group">
            <label>Issue Text *</label>
            <textarea
              value={formData['Issue Text']}
              onChange={(e) => handleChange('Issue Text', e.target.value)}
              placeholder="Describe the issue you are facing..."
              rows="4"
              required
              style={{ resize: 'vertical' }}
            />
            <small style={{ color: '#6c757d', marginTop: '0.5rem', display: 'block' }}>
              Please describe the issue in detail
            </small>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Raise Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TicketModal;
