import { useState } from 'react';

function DataTable({ data, onUpdate, onDelete }) {
  const [editingRow, setEditingRow] = useState(null);
  const [editedData, setEditedData] = useState({});

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

  if (data.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📭</div>
        <h3>No data found</h3>
        <p>Try adjusting your filters or add a new entry</p>
      </div>
    );
  }

  const handleEdit = (index, row) => {
    setEditingRow(index);
    setEditedData({ ...row });
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditedData({});
  };

  const handleSaveEdit = (index) => {
    onUpdate(index, editedData);
    setEditingRow(null);
    setEditedData({});
  };

  const handleFieldChange = (field, value) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Auto-extract VideoId when Video Link is changed
    if (field === 'Video Link') {
      const videoId = extractYouTubeVideoId(value);
      setEditedData((prev) => ({
        ...prev,
        'VideoId': videoId,
      }));
    }
  };

  const columns = [
    'Sr no.',
    'Exam Name',
    'Subject',
    'Type of Content',
    'Sub category',
    'Video Link',
    'Edit',
  ];

  const renderEditCell = (col, row, index) => {
    // Always display serial number based on index
    if (col === 'Sr no.') {
      return index + 1;
    }

    if (editingRow === index) {
      // Edit mode
      if (col === 'Edit') {
        return (
          <select
            value={editedData[col] || ''}
            onChange={(e) => handleFieldChange(col, e.target.value)}
            style={{ minWidth: '120px' }}
          >
            <option value="">Select Status</option>
            <option value="Final">Final</option>
            <option value="Re-edit">Re-edit</option>
          </select>
        );
      } else if (col === 'Re-upload Link') {
        // Show Re-upload field only if Edit status is "Re-edit"
        if (editedData['Edit'] === 'Re-edit') {
          return (
            <input
              type="file"
              accept="video/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  handleFieldChange(col, file.name);
                }
              }}
              style={{ minWidth: '200px' }}
            />
          );
        } else {
          return <span style={{ color: '#999' }}>-</span>;
        }
      } else if (col === 'Video Upload') {
        return (
          <input
            type="url"
            value={editedData[col] || ''}
            onChange={(e) => handleFieldChange(col, e.target.value)}
            placeholder="https://youtube.com/shorts/..."
            style={{ minWidth: '200px' }}
          />
        );
      } else {
        return (
          <input
            type="text"
            value={editedData[col] || ''}
            onChange={(e) => handleFieldChange(col, e.target.value)}
          />
        );
      }
    } else {
      // View mode
      if (col === 'Edit') {
        const status = row[col];
        const statusClass = status === 'Final' ? 'status-final' : status === 'Re-edit' ? 'status-reedit' : '';
        return (
          <span className={`status-badge ${statusClass}`}>
            {status || '-'}
          </span>
        );
      } else if (col === 'Re-upload Link') {
        // Show re-upload file only if status is "Re-edit"
        if (row['Edit'] === 'Re-edit' && row[col]) {
          return (
            <span style={{ color: '#28a745', fontWeight: '500' }}>
              📹 {row[col].length > 20 ? row[col].substring(0, 20) + '...' : row[col]}
            </span>
          );
        } else {
          return <span style={{ color: '#999' }}>-</span>;
        }
      } else if (col === 'Video Upload') {
        return row[col] ? (
          <a href={row[col]} target="_blank" rel="noopener noreferrer">
            {row[col].length > 30 ? row[col].substring(0, 30) + '...' : row[col]}
          </a>
        ) : (
          '-'
        );
      } else if (col === 'Video Link') {
        return row[col] ? (
          <a href={row[col]} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'none' }}>
            {row[col].length > 40 ? row[col].substring(0, 40) + '...' : row[col]}
          </a>
        ) : (
          '-'
        );
      } else if (col === 'VideoId') {
        return row[col] ? (
          <code style={{
            backgroundColor: '#f4f4f4',
            padding: '2px 6px',
            borderRadius: '3px',
            fontSize: '0.85em',
            fontFamily: 'monospace'
          }}>
            {row[col]}
          </code>
        ) : (
          '-'
        );
      } else {
        return row[col] || '-';
      }
    }
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              {columns.map((col) => (
                <td key={col}>
                  {renderEditCell(col, row, index)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
