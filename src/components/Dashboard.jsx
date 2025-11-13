import { useState } from 'react';
import DataTable from './DataTable';

function Dashboard({
  data,
  allData,
  loading,
  error,
  filters,
  onFilterChange,
  onClearFilters,
  onAddEntry,
  onRaiseTicket,
  onShowLeaderboard,
  onUpdateEntry,
  onDeleteEntry,
  uniqueVerticals,
  uniqueTypes,
  uniqueExamNames,
  uniqueSubjects,
  categories,
  exams,
}) {
  if (loading) {
    return <div className="loading">Loading data</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <>
      {/* Hero Section - Add New Entry */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-icon">✨</div>
          <h1 className="hero-title">Build the Feed</h1>
          <p className="hero-subtitle">Find. Refine. Repost</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-hero" onClick={onAddEntry}>
              <span className="btn-hero-icon">➕</span>
              <span className="btn-hero-text">Add New Entry</span>
            </button>
            <button className="btn-hero" onClick={onRaiseTicket}>
              <span className="btn-hero-icon">🎫</span>
              <span className="btn-hero-text">Raise Ticket</span>
            </button>
            <button className="btn-hero" onClick={onShowLeaderboard}>
              <span className="btn-hero-icon">🏆</span>
              <span className="btn-hero-text">Leaderboard</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.1h-15V5h15v14.1zm0-16.1h-15c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>{allData.length}</h3>
            <p>Total Submissions</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3>{uniqueVerticals.length}</h3>
            <p>Verticals</p>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <h2>🔍 Filter Content</h2>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Vertical Name</label>
            <select
              value={filters.vertical}
              onChange={(e) => onFilterChange('vertical', e.target.value)}
            >
              <option value="">All Verticals</option>
              {uniqueVerticals.map((vertical) => (
                <option key={vertical} value={vertical}>
                  {vertical}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Content Type</label>
            <select
              value={filters.type}
              onChange={(e) => onFilterChange('type', e.target.value)}
            >
              <option value="">All Types</option>
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Exam Name</label>
            <select
              value={filters.examName}
              onChange={(e) => onFilterChange('examName', e.target.value)}
            >
              <option value="">All Exams</option>
              {uniqueExamNames.map((exam) => (
                <option key={exam} value={exam}>
                  {exam}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Subject</label>
            <select
              value={filters.subject}
              onChange={(e) => onFilterChange('subject', e.target.value)}
            >
              <option value="">All Subjects</option>
              {uniqueSubjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="filter-actions">
          <button className="btn btn-secondary" onClick={onClearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-section">
        <div className="table-header">
          <h2>📋 Content Entries</h2>
        </div>
        <DataTable
          data={data}
          onUpdate={onUpdateEntry}
          onDelete={onDeleteEntry}
        />
      </div>
    </>
  );
}

export default Dashboard;
