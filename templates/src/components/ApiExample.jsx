import { useState } from 'react';
import { getEpixFrame } from '../epixnet/useEpixFrame.js';

/**
 * Component that demonstrates common EpixNet API calls
 */
const ApiExample = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});

  const executeCommand = async (commandName, command, params = [], noReply = false) => {
    setLoading(prev => ({ ...prev, [commandName]: true }));
    setErrors(prev => ({ ...prev, [commandName]: null }));
    
    try {
      // Some wrapper commands (notifications, history) never answer, so
      // their promise would never settle: send them without waiting.
      const pending = getEpixFrame().cmd(command, params);
      const result = noReply ? 'Sent (the wrapper does not answer this command)' : await pending;
      setResults(prev => ({ ...prev, [commandName]: result }));
    } catch (error) {
      setErrors(prev => ({ ...prev, [commandName]: (error && error.error) || String(error) }));
    } finally {
      setLoading(prev => ({ ...prev, [commandName]: false }));
    }
  };

  const apiCommands = [
    {
      name: 'siteInfo',
      command: 'siteInfo',
      description: 'Get information about this xite',
      params: []
    },
    {
      name: 'serverInfo',
      command: 'serverInfo',
      description: 'Get information about the EpixNet server',
      params: []
    },
    {
      name: 'fileList',
      command: 'fileList',
      description: 'List every file of the xite',
      params: { inner_path: '' }
    },
    {
      name: 'dbQuery',
      command: 'dbQuery',
      description: 'Query the xite database (needs a dbschema.json)',
      params: ['SELECT * FROM json LIMIT 5']
    },
    {
      name: 'wrapperNotification',
      command: 'wrapperNotification',
      description: 'Show a notification to the user',
      params: ['info', 'Hello from EpixNet API!', 3000],
      noReply: true
    },
    {
      name: 'wrapperGetLocalStorage',
      command: 'wrapperGetLocalStorage',
      description: 'Read the storage the wrapper keeps for this xite (use instead of localStorage)',
      params: []
    }
  ];

  const formatResult = (result) => {
    if (typeof result === 'object') {
      return JSON.stringify(result, null, 2);
    }
    return String(result);
  };

  return (
    <div className="api-example">
      <h3>EpixNet API Examples</h3>
      <p>Try these common API calls to see how they work:</p>
      
      <div className="api-commands">
        {apiCommands.map((api) => (
          <div key={api.name} className="api-command">
            <div className="command-header">
              <h4>{api.command}</h4>
              <p>{api.description}</p>
              
              <button
                onClick={() => executeCommand(api.name, api.command, api.params, api.noReply)}
                disabled={loading[api.name]}
                className="execute-btn"
              >
                {loading[api.name] ? 'Executing...' : 'Execute'}
              </button>
            </div>
            
            {Object.keys(api.params).length > 0 && (
              <div className="command-params">
                <strong>Parameters:</strong>
                <code>{JSON.stringify(api.params)}</code>
              </div>
            )}
            
            {loading[api.name] && (
              <div className="command-loading">
                <div className="spinner-small"></div>
                <span>Executing command...</span>
              </div>
            )}
            
            {errors[api.name] && (
              <div className="command-error">
                <strong>Error:</strong>
                <pre>{errors[api.name]}</pre>
              </div>
            )}
            
            {api.name in results && !loading[api.name] && (
              <div className="command-result">
                <strong>Result:</strong>
                <pre>{formatResult(results[api.name])}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="api-documentation">
        <h4>Learn More</h4>
        <p>
          These are a few of the commands the EpixNet wrapper accepts. <code>src/epixnet/epixframe.esm.js</code>{' '}
          has a helper method for most of the others.
        </p>

        <div className="code-example">
          <h5>Usage in Your Components:</h5>
          <pre>{`import { getEpixFrame, getStorage, setStorage } from './epixnet/useEpixFrame.js';

// Any command, with its parameters as an object or a list
const siteInfo = await getEpixFrame().cmd('siteInfo');
const files = await getEpixFrame().cmd('fileList', { inner_path: 'data/' });

// Errors reject the promise with { error: '...' }
try {
  await getEpixFrame().cmd('fileGet', { inner_path: 'missing.json' });
} catch (err) {
  console.error('API call failed:', err.error);
}

// Storage that works in the sandboxed frame
const prefs = (await getStorage()) || {};
await setStorage({ ...prefs, theme: 'dark' });`}</pre>
        </div>
      </div>
    </div>
  );
};

export default ApiExample;
