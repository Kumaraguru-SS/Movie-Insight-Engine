import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, RotateCcw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { titlesApi } from '../services/api';
import TitleCard from '../components/TitleCard';

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [contentType, setContentType] = useState('all');
  const [genre, setGenre] = useState('all');
  const [sortBy, setSortBy] = useState('popularity');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [totalPages, setTotalPages] = useState(1);
  const [titles, setTitles] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const GENRES_LIST = [
    'All', 'Action', 'Adventure', 'Animation', 'Anime', 'Comedy', 'Crime', 
    'Drama', 'Fantasy', 'Horror', 'Mystery', 'Psychological', 'Science Fiction', 
    'Suspense', 'Thriller'
  ];

  useEffect(() => {
    fetchCatalog(query, page);
  }, [contentType, genre, sortBy, page]);

  const fetchCatalog = async (searchTerm = query, targetPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await titlesApi.list({
        q: searchTerm || undefined,
        content_type: contentType !== 'all' ? contentType : undefined,
        genre: genre !== 'all' ? genre : undefined,
        sort_by: sortBy,
        order: 'desc',
        page: targetPage,
        page_size: pageSize
      });
      setTitles(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || Math.ceil((res.total || 0) / pageSize) || 1);
    } catch (err) {
      console.error(err);
      setError('Unable to load catalog results. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (page === 1) {
      fetchCatalog(query, 1);
    } else {
      setPage(1);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setQuery('');
    setContentType('all');
    setGenre('all');
    setSortBy('popularity');
    setSearchParams({});
    setPage(1);
    titlesApi.list({ page: 1, page_size: pageSize }).then(res => {
      setTitles(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || Math.ceil((res.total || 0) / pageSize) || 1);
    });
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisibleButtons = 7;

    if (totalPages <= maxVisibleButtons) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);

      if (page <= 3) {
        end = 4;
      } else if (page >= totalPages - 2) {
        start = totalPages - 3;
      }

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('...');
      }

      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '30px 24px 80px' }} className="animate-fade-in">
      {/* Search Header */}
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 8 }} className="font-display">
          Explore Entertainment Catalog
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Discover movies, television series, and anime with multi-dimensional filtering and provider attribution.
        </p>
      </div>

      {/* Filter and Search Bar Panel */}
      <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: 36 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
          <div style={{
            flex: 1,
            minWidth: 260,
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            gap: 10
          }}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by title, character, or premise..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', width: '100%', fontSize: '0.95rem' }}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '10px 22px' }}>
            Search
          </button>
          <button type="button" onClick={handleReset} className="btn btn-secondary" title="Reset Filters">
            <RotateCcw size={16} /> Reset
          </button>
        </form>

        {/* Filter Controls */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Content Type */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Type:</span>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 12px',
                fontSize: '0.85rem'
              }}
            >
              <option value="all">All Types</option>
              <option value="movie">Movies</option>
              <option value="tv">TV Series</option>
              <option value="anime">Anime</option>
            </select>
          </div>

          {/* Genre */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Genre:</span>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 12px',
                fontSize: '0.85rem'
              }}
            >
              {GENRES_LIST.map(g => (
                <option key={g} value={g.toLowerCase()}>{g}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 12px',
                fontSize: '0.85rem'
              }}
            >
              <option value="popularity">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="release_date">Newest Release</option>
            </select>
          </div>

          <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{titles.length}</strong> of <strong>{total}</strong> titles
          </span>
        </div>
      </div>

      {/* Grid or Empty/Loading State */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
            <div key={n} style={{ height: 360, background: 'var(--bg-card)', borderRadius: 14 }} />
          ))}
        </div>
      ) : error ? (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center' }}>
          <AlertCircle size={36} color="#ef4444" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#ef4444' }}>{error}</p>
        </div>
      ) : titles.length > 0 ? (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 22
          }}>
            {titles.map(title => (
              <TitleCard key={title.id} title={title} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 48,
              padding: '16px 20px',
              flexWrap: 'wrap'
            }} className="glass-panel">
              {/* Prev Button */}
              <button
                type="button"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  fontSize: '0.88rem',
                  opacity: page <= 1 ? 0.45 : 1,
                  cursor: page <= 1 ? 'not-allowed' : 'pointer'
                }}
              >
                <ChevronLeft size={16} /> Prev
              </button>

              {/* Page Number Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {getPageNumbers().map((p, idx) => {
                  if (p === '...') {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        style={{
                          padding: '0 6px',
                          color: 'var(--text-muted)',
                          fontSize: '0.9rem',
                          userSelect: 'none'
                        }}
                      >
                        …
                      </span>
                    );
                  }

                  const isActive = p === page;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handlePageChange(p)}
                      style={{
                        minWidth: 38,
                        height: 38,
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.88rem',
                        fontWeight: isActive ? 700 : 500,
                        border: isActive ? '1px solid #ffffff' : '1px solid var(--border-subtle)',
                        background: isActive ? '#ffffff' : 'var(--bg-secondary)',
                        color: isActive ? '#000000' : 'var(--text-main)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  fontSize: '0.88rem',
                  opacity: page >= totalPages ? 0.45 : 1,
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="glass-panel" style={{ padding: 50, textAlign: 'center' }}>
          <Filter size={40} color="var(--text-muted)" style={{ margin: '0 auto 14px' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: 8 }}>No matching titles found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 18 }}>
            Try broadening your search term or resetting your genre and type filters.
          </p>
          <button onClick={handleReset} className="btn btn-secondary">
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
