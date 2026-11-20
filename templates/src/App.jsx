import './components/Components.css';
import { useEpixFrame, useHashRoute } from './epixnet/useEpixFrame.js';
import UserInfo from './components/UserInfo.jsx';
import SiteStats from './components/SiteStats.jsx';
import ApiExample from './components/ApiExample.jsx';

// Hash routes: the wrapper serves one index.html, so routes live after the #.
const routes = {
  '/': { title: 'Home', render: () => <Home /> },
  '/stats': { title: 'Statistics', render: () => <SiteStats /> },
  '/api': { title: 'API examples', render: () => <ApiExample /> },
};

function App() {
  const { embedded, connected, siteInfo, error } = useEpixFrame();
  const route = useHashRoute();

  if (!embedded) {
    return (
      <div className="App">
        <header className="App-header">
          <div className="error-message">
            <h2>Open this page through EpixNet</h2>
            <p>
              This xite talks to your EpixNet node through the wrapper page. Open it at
              <code> http://127.0.0.1:42222/&lt;xite address&gt;/</code> (your node may use
              port 42223 or higher, see the ui_port file in its data folder).
            </p>
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
            <button onClick={() => window.location.reload()}>Retry Connection</button>
          </div>
        </header>
      </div>
    );
  }

  if (!connected || !siteInfo) {
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

  const page = routes[route] || routes['/'];

  return (
    <div className="App">
      <header className="App-header">
        <h1>{siteInfo.content?.title || 'Welcome to EpixNet'}</h1>
        <p>Your decentralized React application is ready!</p>

        <nav className="nav resource-links">
          {Object.entries(routes).map(([path, { title }]) => (
            <a
              key={path}
              href={'#' + path}
              className={'resource-link' + (page === routes[path] ? ' active' : '')}
            >
              {title}
            </a>
          ))}
        </nav>

        {page.render()}
      </header>
    </div>
  );
}

function Home() {
  const { siteInfo, serverInfo } = useEpixFrame();
  return (
    <>
      <div className="site-status">
        <h2>Xite Status</h2>
        <div className="status-grid">
          <div className="status-item">
            <strong>Address:</strong>
            <span>{siteInfo.address}</span>
          </div>
          <div className="status-item">
            <strong>Title:</strong>
            <span>{siteInfo.content?.title || 'Untitled xite'}</span>
          </div>
          <div className="status-item">
            <strong>Peers:</strong>
            <span>{siteInfo.peers || 0}</span>
          </div>
          <div className="status-item">
            <strong>Size:</strong>
            <span>
              {siteInfo.settings?.size ? `${(siteInfo.settings.size / 1024).toFixed(2)} KB` : 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      <div className="getting-started">
        <h2>Getting Started</h2>
        <div className="steps">
          <div className="step">
            <h3>1. Explore the Code</h3>
            <p>
              <code>src/App.jsx</code> shows the routes, <code>src/epixnet/useEpixFrame.js</code> the
              connection to EpixNet.
            </p>
          </div>
          <div className="step">
            <h3>2. Call the EpixNet API</h3>
            <p>
              <code>getEpixFrame().cmd('siteInfo')</code> sends any API command. The{' '}
              <code>useEpixFrame()</code> hook keeps siteInfo current.
            </p>
          </div>
          <div className="step">
            <h3>3. Store Settings</h3>
            <p>
              Use <code>getStorage()</code> and <code>setStorage()</code>: browser localStorage is not
              available in the sandboxed frame.
            </p>
          </div>
          <div className="step">
            <h3>4. Sign and Publish</h3>
            <p>
              <code>npm run build</code> copies the build into the xite folder. Then Sign &amp; Publish from
              the EpixNet sidebar.
            </p>
          </div>
        </div>
      </div>

      <div className="components-showcase">
        <UserInfo />
      </div>

      {import.meta.env.MODE === 'development' && (
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
    </>
  );
}

export default App;
