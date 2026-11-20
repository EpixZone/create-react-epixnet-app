import { useEffect, useState } from 'react';
import { getEpixFrame, useSiteInfo } from '../epixnet/useEpixFrame.js';

/**
 * Xite statistics. siteInfo is pushed by the wrapper whenever the xite
 * changes, so only the file list is fetched here.
 */
const SiteStats = () => {
  const siteInfo = useSiteInfo();
  const [files, setFiles] = useState(null);
  const [error, setError] = useState(null);
  const modified = siteInfo?.content?.modified;

  useEffect(() => {
    let cancelled = false;
    getEpixFrame()
      .cmd('fileList', { inner_path: '' })
      .then((list) => {
        if (!cancelled) setFiles(list);
      })
      .catch((err) => {
        if (!cancelled) setError((err && err.error) || String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [modified]);

  const loading = !siteInfo || (files === null && !error);
  const stats = siteInfo && {
    ...siteInfo,
    fileCount: files ? files.length : 0,
    totalSize: siteInfo.settings?.size || 0,
  };

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
        <h3>Xite Statistics</h3>
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
        <h3>Xite Statistics</h3>
        <div className="error-content">
          <span>Error loading stats: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="site-stats">
      <h3>Xite Statistics</h3>
      
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
          <div className="stat-value">{stats.size_limit ? formatBytes(stats.size_limit * 1024 * 1024) : 'Unknown'}</div>
          <div className="stat-label">Size Limit</div>
        </div>
      </div>
      
      <div className="detailed-info">
        <div className="info-section">
          <h4>Xite Information</h4>
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
              <span className={`status ${stats.settings?.serving ? 'serving' : 'not-serving'}`}>
                {stats.settings?.serving ? 'Serving' : 'Not Serving'}
              </span>
            </div>
            
            <div className="info-item">
              <strong>Received:</strong>
              <span>{formatBytes(stats.settings?.bytes_recv || 0)}</span>
            </div>
            
            {stats.settings?.own && (
              <div className="info-item">
                <strong>Ownership:</strong>
                <span className="status own">You own this xite</span>
              </div>
            )}
          </div>
        </div>
        
        {stats.settings?.permissions && stats.settings.permissions.length > 0 && (
          <div className="info-section">
            <h4>Permissions</h4>
            <div className="permissions-list">
              {stats.settings.permissions.map((permission) => (
                <span key={permission} className="permission-tag">
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
