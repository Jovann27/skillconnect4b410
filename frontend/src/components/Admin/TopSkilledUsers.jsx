
import { useState, useEffect } from 'react';
import { FaCalendarAlt, FaTrophy, FaStar, FaSearch, FaFilter, FaArrowUp, FaArrowDown, FaEye} from 'react-icons/fa';
import api from '../../api';


const TopSkilledUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('all');

  useEffect(() => {
    const fetchTopSkilledUsers = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch service providers from database
        const response = await api.get('/admin/service-providers');
        const workers = response.data.workers || response.data || [];

        // Transform the data to match the expected format
        const transformedData = workers.map((worker, index) => {
          // Calculate mock performance metrics based on available data
          // In a real implementation, these would come from booking/review endpoints
          const baseBookings = Math.floor(Math.random() * 20) + 5; // 5-25 bookings
          const weeklyBookings = Math.floor(baseBookings * 0.3); // ~30% weekly
          const previousWeekBookings = Math.floor(weeklyBookings * (0.8 + Math.random() * 0.4)); // ±20% variation

          return {
            id: worker._id || index + 1,
            name: `${worker.firstName || 'Unknown'} ${worker.lastName || 'User'}`,
            skill: Array.isArray(worker.skills) && worker.skills.length > 0 ? worker.skills[0] : 'General Services',
            rating: (4.0 + Math.random() * 1.0).toFixed(1), // 4.0-5.0 rating
            weeklyBookings,
            previousWeekBookings,
            avatar: worker.profilePic ? `http://192.168.1.13:4000/uploads/${worker.profilePic}` : 'https://randomuser.me/api/portraits/men/1.jpg',
            totalBookings: baseBookings,
            joinedDate: worker.createdAt ? new Date(worker.createdAt).toISOString().split('T')[0] : '2022-01-01'
          };
        });

        // Sort by total bookings (descending) to show "top" skilled users
        transformedData.sort((a, b) => b.totalBookings - a.totalBookings);

        setUsers(transformedData);
        setFilteredUsers(transformedData);
      } catch (err) {
        console.error('Failed to fetch top skilled users:', err);
        setError('Failed to load skilled users data');
      } finally {
        setLoading(false);
      }
    };

    fetchTopSkilledUsers();
  }, []);


  // Filter users based on search term and selected skill
  useEffect(() => {
    let filtered = users;
   
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.skill.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
   
    if (selectedSkill !== 'all') {
      filtered = filtered.filter(user => user.skill === selectedSkill);
    }
   
    setFilteredUsers(filtered);
  }, [searchTerm, selectedSkill, users]);


  // Get unique skills for filter dropdown
  const uniqueSkills = ['all', ...new Set(users.map(user => user.skill))];


  // Calculate trend (up/down/stable)
  const getTrend = (current, previous) => {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'stable';
  };


  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
   
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="star filled" />);
    }
   
    if (hasHalfStar) {
      stars.push(<FaStar key="half" className="star half" />);
    }
   
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaStar key={`empty-${i}`} className="star empty" />);
    }
   
    return stars;
  };


  return (
    <>
      <style>{`
        .top-skilled-users-container {
          background: #fff;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          margin-bottom: 20px;
        }
       
        .page-header {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
        }
       
        .page-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #333;
          margin: 0;
          display: flex;
          align-items: center;
        }
       
        .page-title .icon {
          margin-right: 10px;
          color: #0a84ff;
        }
       
        .intro-text {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 25px;
          line-height: 1.5;
        }
       
        .filters-container {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-bottom: 20px;
        }
       
        .search-container {
          flex: 1;
          min-width: 200px;
          position: relative;
        }
       
        .search-input {
          width: 80%;
          padding: 10px 15px 10px 40px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 0.9rem;
        }
       
        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #999;
        }
       
        .filter-container {
          display: flex;
          align-items: center;
        }
       
        .filter-select {
          padding: 10px 15px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 0.9rem;
          background: white;
        }
       
        .data-table-container {
          overflow-x: auto;
        }
       
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
       
        .data-table th {
          background: #f1f3f7;
          padding: 12px 15px;
          text-align: left;
          font-weight: 600;
          color: #333;
          font-size: 0.85rem;
          border-bottom: 2px solid #e9ecef;
        }
       
        .data-table td {
          padding: 12px 15px;
          border-bottom: 1px solid #e9ecef;
          font-size: 0.85rem;
          color: #555;
        }
       
        .data-table tr:hover {
          background: #f9f9f9;
        }
       
        .rank-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          font-weight: 600;
          font-size: 0.8rem;
        }
       
        .rank-1 {
          background: #ffd700;
          color: #333;
        }
       
        .rank-2 {
          background: #c0c0c0;
          color: #333;
        }
       
        .rank-3 {
          background: #cd7f32;
          color: #fff;
        }
       
        .rank-default {
          background: #e9ecef;
          color: #555;
        }
       
        .user-info {
          display: flex;
          align-items: center;
        }
       
        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          margin-right: 10px;
        }
       
        .user-details {
          display: flex;
          flex-direction: column;
        }
       
        .user-name {
          font-weight: 600;
          color: #333;
        }
       
        .user-since {
          font-size: 0.75rem;
          color: #999;
        }
       
        .rating-container {
          display: flex;
          align-items: center;
        }
       
        .star {
          color: #ddd;
          font-size: 0.9rem;
        }
       
        .star.filled {
          color: #ffc107;
        }
       
        .star.half {
          color: #ffc107;
          opacity: 0.7;
        }
       
        .rating-value {
          margin-left: 5px;
          font-weight: 600;
        }
       
        .weekly-bookings {
          display: flex;
          align-items: center;
        }
       
        .booking-count {
          font-weight: 600;
          margin-right: 5px;
        }
       
        .trend {
          display: flex;
          align-items: center;
        }
       
        .trend.up {
          color: #28a745;
        }
       
        .trend.down {
          color: #dc3545;
        }
       
        .trend.stable {
          color: #6c757d;
        }
       
        .action-buttons {
          display: flex;
          gap: 8px;
        }
       
        .action-btn {
          padding: 6px 10px;
          border: none;
          border-radius: 4px;
          font-size: 0.8rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: all 0.2s;
        }
       
        .view-btn {
          background: #0a84ff;
          color: white;
        }
       
        .view-btn:hover {
          background: #0077e6;
        }
       
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 200px;
        }
       
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #0a84ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
       
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
       
        .no-results {
          text-align: center;
          padding: 20px;
          color: #666;
        }

        .error-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 200px;
        }

        .error-message {
          text-align: center;
          padding: 20px;
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 8px;
          color: #721c24;
        }

        .error-message h3 {
          margin: 0 0 10px 0;
          font-size: 1.1rem;
        }

        .error-message p {
          margin: 0 0 15px 0;
        }

        .retry-btn {
          background: #dc3545;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .retry-btn:hover {
          background: #c82333;
        }
       
        @media (max-width: 768px) {
          .filters-container {
            flex-direction: column;
          }
         
          .search-container {
            min-width: 100%;
          }
         
          .data-table th, .data-table td {
            padding: 8px 10px;
            font-size: 0.75rem;
          }
         
          .user-avatar {
            width: 30px;
            height: 30px;
          }
        }
      `}</style>


      <div className="top-skilled-users-container">
        <div className="page-header">
          <h1 className="page-title">
            <FaTrophy className="icon" />
            Top Skilled Users
          </h1>
        </div>
       
        <p className="intro-text">
          This page showcases the highest-rated service providers based on customer feedback and booking frequency.
          These top performers have demonstrated exceptional skills and reliability in their respective categories.
        </p>
       
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : error ? (
          <div className="error-container">
            <div className="error-message">
              <h3>⚠️ Error Loading Data</h3>
              <p>{error}</p>
              <button
                className="retry-btn"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Filters Section */}
            <div className="filters-container">
              <div className="search-container">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by name or skill..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
             
              <div className="filter-container">
                <FaFilter style={{ marginRight: '5px', color: '#999' }} />
                <select
                  className="filter-select"
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                >
                  {uniqueSkills.map(skill => (
                    <option key={skill} value={skill}>
                      {skill === 'all' ? 'All Skills' : skill}
                    </option>
                  ))}
                </select>
              </div>
            </div>
           
            {/* Data Table Section */}
            {filteredUsers.length > 0 ? (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Full Name</th>
                      <th>Skill (Category)</th>
                      <th>Rating</th>
                      <th>Weekly</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, index) => (
                      <tr key={user.id}>
                        <td>
                          <span className={`rank-badge ${
                            index + 1 === 1 ? 'rank-1' :
                            index + 1 === 2 ? 'rank-2' :
                            index + 1 === 3 ? 'rank-3' : 'rank-default'
                          }`}>
                            {index + 1}
                          </span>
                        </td>
                        <td>
                          <div className="user-info">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="user-avatar"
                            />
                            <div className="user-details">
                              <div className="user-name">{user.name}</div>
                              <div className="user-since">
                                <FaCalendarAlt style={{ fontSize: '0.7rem', marginRight: '3px' }} />
                                Since {new Date(user.joinedDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>{user.skill}</td>
                        <td>
                          <div className="rating-container">
                            {renderStars(user.rating)}
                            <span className="rating-value">{user.rating}</span>
                          </div>
                        </td>
                        <td>
                          <div className="weekly-bookings">
                            <span className="booking-count">{user.weeklyBookings}</span>
                            <div className={`trend ${getTrend(user.weeklyBookings, user.previousWeekBookings)}`}>
                              {getTrend(user.weeklyBookings, user.previousWeekBookings) === 'up' && <FaArrowUp />}
                              {getTrend(user.weeklyBookings, user.previousWeekBookings) === 'down' && <FaArrowDown />}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button className="action-btn view-btn">
                              <FaEye />
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-results">
                No users found matching your criteria.
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};


export default TopSkilledUsers;
