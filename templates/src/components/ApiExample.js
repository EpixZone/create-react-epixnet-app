import React, { useState } from 'react';
import zeroFrame from '../epixnet/zeroframe.js';

/**
 * Component that demonstrates common EpixNet API calls
 */
const ApiExample = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});

  const executeCommand = async (commandName, command, params = []) => {
    setLoading(prev => ({ ...prev, [commandName]: true }));
    setErrors(prev => ({ ...prev, [commandName]: null }));
    
    try {
      const result = await zeroFrame.cmd(command, ...params);
      setResults(prev => ({ ...prev, [commandName]: result }));
    } catch (error) {
      setErrors(prev => ({ ...prev, [commandName]: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, [commandName]: false }));
    }
  };

  const apiCommands = [
    {
      name: 'siteInfo',
      command: 'siteInfo',
      description: 'Get comprehensive information about the current site',
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
      description: 'List all files in the site',
      params: []
    },
    {
      name: 'dbQuery',
      command: 'dbQuery',
      description: 'Query the site database (if available)',
      params: ['SELECT * FROM json WHERE 1 LIMIT 5']
    },
    {
      name: 'wrapperNotification',
      command: 'wrapperNotification',
      description: 'Show a notification to the user',
      params: ['info', 'Hello from EpixNet API!', 3000]
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
                onClick={() => executeCommand(api.name, api.command, api.params)}
                disabled={loading[api.name]}
                className="execute-btn"
              >
                {loading[api.name] ? 'Executing...' : 'Execute'}
              </button>
            </div>
            
            {api.params.length > 0 && (
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
            
            {results[api.name] && !loading[api.name] && (
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
          These are just a few examples of the EpixNet API. For a complete list of available commands,
          check the <a href="https://epixnet.io/docs/api/" target="_blank" rel="noopener noreferrer">
          EpixNet API documentation</a>.
        </p>
        
        <div className="code-example">
          <h5>Usage in Your Components:</h5>
          <pre>{`import zeroFrame from './epixnet/zeroframe.js';

// Basic API call
const siteInfo = await zeroFrame.cmd('siteInfo');

// API call with parameters
const files = await zeroFrame.cmd('fileList', 'data/');

// Handle errors
try {
  const result = await zeroFrame.cmd('someCommand');
  console.log(result);
} catch (error) {
  console.error('API call failed:', error);
}`}</pre>
        </div>
      </div>
    </div>
  );
};

export default ApiExample;
