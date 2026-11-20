import React, { useState, useEffect } from 'react';
import zeroFrame from '../epixnet/zeroframe.js';

/**
 * Component that displays detailed site statistics and information
 */
const SiteStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Get comprehensive site information
        const siteInfo = await zeroFrame.cmd('siteInfo');
        
        // Get file list to calculate more detailed stats
        const fileList = await zeroFrame.cmd('fileList');
        
        // Calculate additional statistics
        const fileCount = Object.keys(fileList).length;
        const totalSize = Object.values(fileList).reduce((sum, file) => sum + (file.size || 0), 0);
        
        setStats({
          ...siteInfo,
          fileCount,
          totalSize,
          fileList
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch site stats:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchStats();
    
    // Set up periodic updates every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (loading) {
    return (
      <div className="site-stats loading">
        <h3>Site Statistics</h3>
        <div className="loading-content">
          <div className="spinner-small"></div>
          <span>Loading statistics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="site-stats error">
        <h3>Site Statistics</h3>
        <div className="error-content">
          <span>Error loading stats: {error}</span>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="site-stats">
      <h3>Site Statistics</h3>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.peers || 0}</div>
          <div className="stat-label">Connected Peers</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{stats.fileCount || 0}</div>
          <div className="stat-label">Files</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{formatBytes(stats.totalSize || 0)}</div>
          <div className="stat-label">Total Size</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{stats.settings?.size_limit ? formatBytes(stats.settings.size_limit) : 'Unlimited'}</div>
          <div className="stat-label">Size Limit</div>
        </div>
      </div>
      
      <div className="detailed-info">
        <div className="info-section">
          <h4>Site Information</h4>
          <div className="info-grid">
            <div className="info-item">
              <strong>Address:</strong>
              <span className="address">{stats.address}</span>
            </div>
            
            <div className="info-item">
              <strong>Title:</strong>
              <span>{stats.content?.title || 'Untitled'}</span>
            </div>
            
            <div className="info-item">
              <strong>Description:</strong>
              <span>{stats.content?.description || 'No description'}</span>
            </div>
            
            {stats.content?.modified && (
              <div className="info-item">
                <strong>Last Modified:</strong>
                <span>{formatDate(stats.content.modified)}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="info-section">
          <h4>Network Status</h4>
          <div className="info-grid">
            <div className="info-item">
              <strong>Status:</strong>
              <span className={`status ${stats.serving ? 'serving' : 'not-serving'}`}>
                {stats.serving ? 'Serving' : 'Not Serving'}
              </span>
            </div>
            
            <div className="info-item">
              <strong>Downloaded:</strong>
              <span>{formatBytes(stats.settings?.downloaded || 0)}</span>
            </div>
            
            {stats.settings?.own && (
              <div className="info-item">
                <strong>Ownership:</strong>
                <span className="status own">You own this site</span>
              </div>
            )}
          </div>
        </div>
        
        {stats.settings?.permissions && stats.settings.permissions.length > 0 && (
          <div className="info-section">
            <h4>Permissions</h4>
            <div className="permissions-list">
              {stats.settings.permissions.map((permission, index) => (
                <span key={index} className="permission-tag">
                  {permission}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SiteStats;
