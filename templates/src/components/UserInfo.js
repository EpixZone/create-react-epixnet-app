import React, { useState, useEffect } from 'react';
import zeroFrame from '../epixnet/zeroframe.js';

/**
 * Component that displays user authentication status and certificate information
 */
const UserInfo = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setLoading(true);
        
        // Get certificate information
        const certInfo = await zeroFrame.cmd('certSelect');
        
        // Get site permissions
        const siteInfo = await zeroFrame.cmd('siteInfo');
        
        setUserInfo({
          certificate: certInfo,
          permissions: siteInfo.settings?.permissions || [],
          auth_address: siteInfo.auth_address,
          auth_key: siteInfo.auth_key
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch user info:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const result = await zeroFrame.cmd('certSelect');
      if (result) {
        // Refresh user info after login
        window.location.reload();
      }
    } catch (err) {
      setError('Failed to authenticate: ' + err.message);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await zeroFrame.cmd('certSelect', { accepted_domains: [] });
      window.location.reload();
    } catch (err) {
      setError('Failed to logout: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="user-info loading">
        <div className="spinner-small"></div>
        <span>Loading user info...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-info error">
        <span>Error: {error}</span>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  const isAuthenticated = userInfo?.auth_address && userInfo?.auth_key;

  return (
    <div className="user-info">
      <h3>User Status</h3>
      
      {isAuthenticated ? (
        <div className="authenticated">
          <div className="status-indicator authenticated">
            <span className="status-dot"></span>
            Authenticated
          </div>
          
          <div className="user-details">
            <div className="detail-item">
              <strong>Auth Address:</strong>
              <span className="address">{userInfo.auth_address}</span>
            </div>
            
            {userInfo.certificate && (
              <div className="detail-item">
                <strong>Certificate:</strong>
                <span>{userInfo.certificate}</span>
              </div>
            )}
            
            {userInfo.permissions.length > 0 && (
              <div className="detail-item">
                <strong>Permissions:</strong>
                <div className="permissions-list">
                  {userInfo.permissions.map((permission, index) => (
                    <span key={index} className="permission-tag">
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      ) : (
        <div className="not-authenticated">
          <div className="status-indicator not-authenticated">
            <span className="status-dot"></span>
            Not Authenticated
          </div>
          
          <p>Sign in with your EpixNet certificate to access personalized features.</p>
          
          <button onClick={handleLogin} className="login-btn">
            Sign In
          </button>
        </div>
      )}
    </div>
  );
};

export default UserInfo;
