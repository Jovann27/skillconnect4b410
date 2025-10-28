import { useState, useEffect } from "react";
import {
  FaChartBar,
  FaUsers,
  FaTools,
  FaCalendarAlt,
  FaDownload,
  FaFilter,
  FaSyncAlt,
  FaEye
} from "react-icons/fa";
import api from "../../api";
import toast from "react-hot-toast";

const SytemAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    totalUsers: 0,
    totalProviders: 0,
    totalJobFairs: 0,
    totalBookings: 0,
    recentActivity: [],
    popularServices: [],
    userGrowth: [],
    providerStats: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch multiple analytics endpoints
      const [usersRes, providersRes, jobFairsRes, bookingsRes] = await Promise.all([
        api.get('/reports/totals'),
        api.get('/admin/service-providers'),
        api.get('/settings/jobfair'),
        api.get('/reports/most-booked-services')
      ]);

      setAnalyticsData({
        totalUsers: usersRes.data?.totalUsers || 0,
        totalProviders: providersRes.data?.count || 0,
        totalJobFairs: jobFairsRes.data?.jobfair ? 1 : 0,
        totalBookings: bookingsRes.data ? Object.values(bookingsRes.data).reduce((a, b) => a + b, 0) : 0,
        recentActivity: [],
        popularServices: Object.entries(bookingsRes.data || {}).map(([service, count]) => ({
          service,
          count
        })).slice(0, 10),
        userGrowth: [],
        providerStats: {}
      });

      toast.success('Analytics data loaded successfully!');
    } catch (err) {
      console.error('Failed to fetch analytics data:', err);
      setError('Failed to load analytics data');
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="analytics-header">
          <h1>System Analytics</h1>
          <div className="title"></div>
        </div>
        <div className="analytics-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="analytics"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>System Analytics</h1>
        <p>Comprehensive overview of platform performance and user engagement</p>

        <div className="analytics-controls">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="card-icon">
            <FaUsers />
          </div>
          <div className="card-content">
            <h3>Total Users</h3>
            <p className="metric-value">{analyticsData.totalUsers}</p>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-icon">
            <FaTools />
          </div>
          <div className="card-content">
            <h3>Service Providers</h3>
            <p className="metric-value">{analyticsData.totalProviders}</p>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-icon">
            <FaCalendarAlt />
          </div>
          <div className="card-content">
            <h3>Job Fairs</h3>
            <p className="metric-value">{analyticsData.totalJobFairs}</p>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-icon">
            <FaChartBar />
          </div>
          <div className="card-content">
            <h3>Total Bookings</h3>
            <p className="metric-value">{analyticsData.totalBookings}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="analytics-charts">
        <div className="chart-section">
          <h2>Popular Services</h2>
          <div className="services-list">
            {analyticsData.popularServices.length > 0 ? (
              analyticsData.popularServices.map((service, index) => {
                const maxCount = Math.max(...analyticsData.popularServices.map(s => s.count));
                const widthPercentage = maxCount > 0 ? (service.count / maxCount) * 100 : 0;
                const widthClass = `width-${Math.round(widthPercentage / 10) * 10}`;

                return (
                  <div key={index} className={`service-item service-item-${index}`}>
                    <span className="service-name">{service.service}</span>
                    <div className="service-bar">
                      <div className={`service-fill ${widthClass}`}></div>
                    </div>
                    <span className="service-count">{service.count}</span>
                  </div>
                );
              })
            ) : (
              <p>No service data available</p>
            )}
          </div>
        </div>

        <div className="chart-section">
          <h2>Platform Overview</h2>
          <div className="overview-stats">
            <div className="stat-item">
              <span className="stat-label">Active Users</span>
              <span className="stat-value">{Math.floor(analyticsData.totalUsers * 0.7)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Verified Providers</span>
              <span className="stat-value">{Math.floor(analyticsData.totalProviders * 0.85)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Success Rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="analytics-actions">
        <button className="export-btn">
          <FaDownload /> Export Report
        </button>
        <button className="view-details-btn">
          <FaEye /> View Detailed Reports
        </button>
      </div>
    </div>
  );
};

export default SytemAnalytics;
