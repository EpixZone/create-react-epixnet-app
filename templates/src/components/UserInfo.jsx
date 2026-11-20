import { useState } from 'react';
import { getEpixFrame, useSiteInfo } from '../epixnet/useEpixFrame.js';

/**
 * Shows which xID identity this xite sees and lets the user pick one.
 * siteInfo updates by itself after the choice (setSiteInfo from the wrapper).
 */
const UserInfo = () => {
  const siteInfo = useSiteInfo();
  const [error, setError] = useState(null);

  const handleSignIn = async () => {
    setError(null);
    try {
      // Opens the wrapper's xID account picker.
      await getEpixFrame().cmd('certXid');
    } catch (err) {
      setError((err && err.error) || String(err));
    }
  };

  const userName = siteInfo?.cert_user_id;
  const permissions = siteInfo?.settings?.permissions || [];

  return (
    <div className="user-info">
      <h3>User Status</h3>

      {userName ? (
        <div className="authenticated">
          <div className="status-indicator authenticated">
            <span className="status-dot"></span>
            Signed in
          </div>

          <div className="user-details">
            <div className="detail-item">
              <strong>Identity:</strong>
              <span>{userName}</span>
            </div>

            <div className="detail-item">
              <strong>Auth Address:</strong>
              <span className="address">{siteInfo.auth_address}</span>
            </div>

            {permissions.length > 0 && (
              <div className="detail-item">
                <strong>Permissions:</strong>
                <div className="permissions-list">
                  {permissions.map((permission) => (
                    <span key={permission} className="permission-tag">
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button onClick={handleSignIn} className="login-btn">
            Switch identity
          </button>
        </div>
      ) : (
        <div className="not-authenticated">
          <div className="status-indicator not-authenticated">
            <span className="status-dot"></span>
            Not signed in
          </div>

          <p>Choose an xID identity to post content to this xite.</p>

          <button onClick={handleSignIn} className="login-btn">
            Sign In
          </button>
        </div>
      )}

      {error && (
        <div className="error-content">
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default UserInfo;
