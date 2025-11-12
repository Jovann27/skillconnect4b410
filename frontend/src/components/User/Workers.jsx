import React, { useState, useEffect } from 'react';
import { useMainContext } from '../../mainContext';
import api from '../../api';
import './Workers.css';

const Workers = () => {
  const { user } = useMainContext();
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterService, setFilterService] = useState('All');

  // Fetch workers on component mount
  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/user/service-providers');
      if (response.data.success) {
        setWorkers(response.data.workers || []);
      }
    } catch (error) {
      console.error('Error fetching workers:', error);
      alert('Failed to load workers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkerClick = (worker) => {
    // Navigate to worker details or chat
    alert(`Selected worker: ${worker.firstName} ${worker.lastName}`);
  };

  const filteredWorkers = workers.filter((worker) => {
    const matchesSearch = searchTerm === '' ||
      `${worker.firstName} ${worker.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (worker.service || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (worker.skills || []).some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesService = filterService === 'All' || worker.service === filterService;

    return matchesSearch && matchesService;
  });

  const WorkerCard = ({ worker }) => (
    <div className="worker-card" onClick={() => handleWorkerClick(worker)}>
      <div className="worker-header">
        <img
          src={worker.profilePic || '/default-profile.png'}
          alt={`${worker.firstName} ${worker.lastName}`}
          className="worker-avatar"
        />
        <div className="worker-basic-info">
          <h3 className="worker-name">{worker.firstName} {worker.lastName}</h3>
          <p className="worker-service">{worker.service || 'Service Provider'}</p>
          <div className="worker-rating">
            <div className="stars">
              {[...Array(5)].map((_, i) => (
                <i key={i} className={`fas fa-star ${i < (worker.rating || 0) ? 'filled' : ''}`}></i>
              ))}
            </div>
            <span className="rating-text">({worker.reviewCount || 0} reviews)</span>
          </div>
        </div>
        <i className="fas fa-chevron-right worker-arrow"></i>
      </div>

      <div className="worker-details">
        <div className="detail-row">
          <i className="fas fa-tools detail-icon"></i>
          <span className="detail-label">Skills:</span>
          <span className="detail-value">
            {worker.skills && worker.skills.length > 0
              ? worker.skills.join(', ')
              : 'Not specified'
            }
          </span>
        </div>

        {worker.serviceRate && (
          <div className="detail-row">
            <i className="fas fa-money-bill-wave detail-icon"></i>
            <span className="detail-label">Rate:</span>
            <span className="detail-value rate">₱{worker.serviceRate}</span>
          </div>
        )}

        {worker.location && (
          <div className="detail-row">
            <i className="fas fa-map-marker-alt detail-icon"></i>
            <span className="detail-label">Location:</span>
            <span className="detail-value">{worker.location}</span>
          </div>
        )}

        {worker.experience && (
          <div className="detail-row">
            <i className="fas fa-briefcase detail-icon"></i>
            <span className="detail-label">Experience:</span>
            <span className="detail-value">{worker.experience} years</span>
          </div>
        )}
      </div>

      <div className="worker-actions">
        <button className="btn-contact" onClick={(e) => {
          e.stopPropagation();
          handleWorkerClick(worker);
        }}>
          <i className="fas fa-comments"></i>
          Contact
        </button>
        <button className="btn-book" onClick={(e) => {
          e.stopPropagation();
          // Navigate to booking or place order with this worker
          alert('Booking functionality will be implemented');
        }}>
          <i className="fas fa-calendar-check"></i>
          Book Now
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="workers-loading">
        <div className="loading-spinner"></div>
        <p>Loading workers...</p>
      </div>
    );
  }

  return (
    <div className="workers-container">
      <div className="workers-header">
        <h1>Available Workers</h1>
        <p>Find and connect with skilled service providers</p>
      </div>

      {/* Search and Filter */}
      <div className="workers-controls">
        <div className="search-box">
          <i className="fas fa-search search-icon"></i>
          <input
            type="text"
            placeholder="Search workers by name, service, or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-box">
          <select
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Services</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Electrical">Electrical</option>
            <option value="Carpentry">Carpentry</option>
            <option value="Painting">Painting</option>
            <option value="Cleaning">Cleaning</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <p>{filteredWorkers.length} worker{filteredWorkers.length !== 1 ? 's' : ''} found</p>
      </div>

      {/* Workers List */}
      {filteredWorkers.length === 0 ? (
        <div className="no-workers">
          <i className="fas fa-users fa-3x"></i>
          <h3>No Workers Found</h3>
          <p>Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="workers-grid">
          {filteredWorkers.map(worker => (
            <WorkerCard key={worker._id} worker={worker} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Workers;
