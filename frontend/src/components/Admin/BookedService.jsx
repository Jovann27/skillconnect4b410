import React, { useState, useEffect } from 'react';
import { FaChartBar, FaInfoCircle } from 'react-icons/fa';


const BookedService = () => {
  const [bookingData, setBookingData] = useState([]);
  const [loading, setLoading] = useState(true);


  // Sample data - in a real app, this would come from an API call
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const data = [
        { skill: 'Plumbing', count: 156 },
        { skill: 'Electrical', count: 132 },
        { skill: 'Carpentry', count: 98 },
        { skill: 'Painting', count: 87 },
        { skill: 'Gardening', count: 76 },
        { skill: 'Cleaning', count: 65 },
        { skill: 'Appliance Repair', count: 54 },
        { skill: 'Moving', count: 43 }
      ];
     
      // Calculate total for percentage
      const total = data.reduce((sum, item) => sum + item.count, 0);
     
      // Add percentage and rank to data
      const processedData = data.map((item, index) => ({
        ...item,
        percentage: ((item.count / total) * 100).toFixed(1),
        rank: index + 1
      }));
     
      setBookingData(processedData);
      setLoading(false);
    }, 1000);
  }, []);


  // Find max value for chart scaling
  const maxBookingCount = bookingData.length > 0
    ? Math.max(...bookingData.map(item => item.count))
    : 100;


  return (
    <>
      <style>{`
        .booked-services-container {
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
       
        .chart-container {
          background: #f9f9f9;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 25px;
        }
       
        .chart-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;
          margin: 0 0 20px 0;
          display: flex;
          align-items: center;
        }
       
        .chart-title .icon {
          margin-right: 8px;
          color: #0a84ff;
        }
       
        .bar-chart {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
       
        .bar-item {
          display: flex;
          align-items: center;
        }
       
        .bar-label {
          width: 120px;
          font-size: 0.85rem;
          color: #555;
          text-align: right;
          padding-right: 15px;
        }
       
        .bar-container {
          flex: 1;
          height: 24px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
        }
       
        .bar {
          height: 100%;
          background: linear-gradient(90deg, #0a84ff, #0077e6);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 8px;
          color: white;
          font-size: 0.75rem;
          font-weight: 500;
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
          width: 24px;
          height: 24px;
          border-radius: 50%;
          font-weight: 600;
          font-size: 0.75rem;
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
       
        .percentage-bar {
          display: inline-block;
          height: 6px;
          background: #e9ecef;
          border-radius: 3px;
          width: 50px;
          margin-right: 8px;
          position: relative;
        }
       
        .percentage-fill {
          height: 100%;
          background: #0a84ff;
          border-radius: 3px;
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
       
        @media (max-width: 768px) {
          .bar-label {
            width: 80px;
            font-size: 0.75rem;
            padding-right: 8px;
          }
         
          .data-table th, .data-table td {
            padding: 8px 10px;
            font-size: 0.75rem;
          }
        }
      `}</style>


      <div className="booked-services-container">
        <div className="page-header">
          <h1 className="page-title">
            <FaChartBar className="icon" />
            Booked Services
          </h1>
        </div>
       
        <p className="intro-text">
          <FaInfoCircle style={{ marginRight: '5px', color: '#0a84ff' }} />
          This page displays analytics on booked services across different skill categories.
          The data helps identify the most in-demand services and trends in user preferences.
        </p>
       
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {/* Bar Chart Section */}
            <div className="chart-container">
              <h2 className="chart-title">
                <FaChartBar className="icon" />
                Services by Booking Volume
              </h2>
             
              <div className="bar-chart">
                {bookingData.map((item, index) => (
                  <div key={index} className="bar-item">
                    <div className="bar-label">{item.skill}</div>
                    <div className="bar-container">
                      <div
                        className="bar"
                        style={{ width: `${(item.count / maxBookingCount) * 100}%` }}
                      >
                        {item.count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
           
            {/* Data Table Section */}
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Skill Category</th>
                    <th>Booking Count</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingData.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <span className={`rank-badge ${
                          item.rank === 1 ? 'rank-1' :
                          item.rank === 2 ? 'rank-2' :
                          item.rank === 3 ? 'rank-3' : 'rank-default'
                        }`}>
                          {item.rank}
                        </span>
                      </td>
                      <td>{item.skill}</td>
                      <td>{item.count}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div className="percentage-bar">
                            <div
                              className="percentage-fill"
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                          {item.percentage}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
};


export default BookedService;