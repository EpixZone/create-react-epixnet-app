import React, { useState, useEffect } from 'react';
import './App.css';
import './components/Components.css';
import zeroFrame from './epixnet/zeroframe.js';
import SiteConfig from './SiteConfig.example.js';
import UserInfo from './components/UserInfo.js';
import SiteStats from './components/SiteStats.js';
import ApiExample from './components/ApiExample.js';

function App() {
  const [siteInfo, setSiteInfo] = useState(null);
  const [serverInfo, setServerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize EpixNet connection and get site information
    const initializeEpixNet = async () => {
      try {
        setLoading(true);

        // Get site information
        const siteInfoResponse = await zeroFrame.cmd('siteInfo');
        setSiteInfo(siteInfoResponse);

        // Get server information
        const serverInfoResponse = await zeroFrame.cmd('serverInfo');
        setServerInfo(serverInfoResponse);

        setLoading(false);
      } catch (err) {
        console.error('Failed to initialize EpixNet connection:', err);
        setError(err.message || 'Failed to connect to EpixNet');
        setLoading(false);
      }
    };

    initializeEpixNet();
  }, []);

  if (loading) {
    return (
      <div className="App">
        <header className="App-header">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Connecting to EpixNet...</p>
          </div>
        </header>
      </div>
    );
  }

  if (error) {
    return (
      <div className="App">
        <header className="App-header">
          <div className="error-message">
            <h2>Connection Error</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>
              Retry Connection
            </button>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to EpixNet</h1>
        <p>Your decentralized React application is ready!</p>

        <div className="site-status">
          <h2>Site Status</h2>
          <div className="status-grid">
            <div className="status-item">
              <strong>Site Address:</strong>
              <span>{siteInfo?.address || 'Unknown'}</span>
            </div>
            <div className="status-item">
              <strong>Site Title:</strong>
              <span>{siteInfo?.content?.title || 'Untitled Site'}</span>
            </div>
            <div className="status-item">
              <strong>Peers:</strong>
              <span>{siteInfo?.peers || 0}</span>
            </div>
            <div className="status-item">
              <strong>Size:</strong>
              <span>{siteInfo?.settings?.size ? `${(siteInfo.settings.size / 1024).toFixed(2)} KB` : 'Unknown'}</span>
            </div>
          </div>
        </div>

        <div className="getting-started">
          <h2>Getting Started</h2>
          <div className="steps">
            <div className="step">
              <h3>1. Explore the Code</h3>
              <p>Check out <code>src/App.js</code> to see how this EpixNet integration works.</p>
            </div>
            <div className="step">
              <h3>2. Use the ZeroFrame API</h3>
              <p>The <code>zeroFrame</code> object provides access to all EpixNet APIs. Try calling <code>zeroFrame.cmd('siteInfo')</code> in your components.</p>
            </div>
            <div className="step">
              <h3>3. Access Site Configuration</h3>
              <p>Use environment variables like <code>process.env.REACT_APP_SITE_ADDRESS</code> to access your site configuration.</p>
            </div>
            <div className="step">
              <h3>4. Build Your App</h3>
              <p>Replace this content with your own React components and start building your decentralized application!</p>
            </div>
          </div>
        </div>

        <div className="example-section">
          <SiteConfig />
        </div>

        <div className="components-showcase">
          <UserInfo />
          <SiteStats />
          <ApiExample />
        </div>

        <div className="resources">
          <h2>Resources</h2>
          <div className="resource-links">
            <a
              href="https://epixnet.io/docs/"
              target="_blank"
              rel="noopener noreferrer"
              className="resource-link"
            >
              EpixNet Documentation
            </a>
            <a
              href="https://reactjs.org/docs/getting-started.html"
              target="_blank"
              rel="noopener noreferrer"
              className="resource-link"
            >
              React Documentation
            </a>
            <a
              href="https://github.com/EpixZone/create-react-epixnet-app"
              target="_blank"
              rel="noopener noreferrer"
              className="resource-link"
            >
              Project Generator
            </a>
          </div>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="debug-info">
            <h3>Debug Information</h3>
            <details>
              <summary>Site Info</summary>
              <pre>{JSON.stringify(siteInfo, null, 2)}</pre>
            </details>
            <details>
              <summary>Server Info</summary>
              <pre>{JSON.stringify(serverInfo, null, 2)}</pre>
            </details>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
