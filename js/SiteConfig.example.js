/**
 * Example React component showing how to access site configuration
 * from environment variables set during project generation.
 * 
 * This file demonstrates how to use the REACT_APP_SITE_DATA_PATH and
 * REACT_APP_SITE_ADDRESS environment variables in your React components.
 */

import React from 'react';

const SiteConfig = () => {
  // Access the site data path (useful for development/debugging)
  const siteDataPath = process.env.REACT_APP_SITE_DATA_PATH;
  
  // Access the site address (useful for API calls or site identification)
  const siteAddress = process.env.REACT_APP_SITE_ADDRESS;

  return (
    <div>
      <h2>Site Configuration</h2>
      <p><strong>Site Address:</strong> {siteAddress}</p>
      {process.env.NODE_ENV === 'development' && (
        <p><strong>Data Path:</strong> {siteDataPath}</p>
      )}
    </div>
  );
};

export default SiteConfig;
