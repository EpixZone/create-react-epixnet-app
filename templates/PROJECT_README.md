# EpixNet React App

This project was created with [create-react-epixnet-app](https://github.com/EpixZone/create-react-epixnet-app).

## Getting Started

### Development

```bash
npm run start
```

Builds and deploys a development version with hot reloading to your EpixNet site.

### Production Build

```bash
npm run build
```

Builds and deploys a production version of your site.

## Configuration

This project is configured to work with your EpixNet site through environment variables:

- `REACT_APP_SITE_DATA_PATH`: Path to your EpixNet site data directory
- `REACT_APP_SITE_ADDRESS`: Your site's address/identifier

These variables are automatically set in the `.env` file during project creation and are ignored by git for security.

## EpixNet Features

This project includes several example components that demonstrate common EpixNet patterns:

### Example Components

- **`src/components/UserInfo.js`** - Displays user authentication status and certificate information
- **`src/components/SiteStats.js`** - Shows real-time site statistics and network information
- **`src/components/ApiExample.js`** - Interactive examples of EpixNet API calls

### Site Configuration in React

You can access your site configuration in React components using environment variables:

```javascript
// Get the site address
const siteAddress = process.env.REACT_APP_SITE_ADDRESS;

// Get the data path (useful for development)
const siteDataPath = process.env.REACT_APP_SITE_DATA_PATH;
```

See `src/SiteConfig.example.js` for a complete example.

### Using the ZeroFrame API

The project includes a pre-configured ZeroFrame API client:

```javascript
import zeroFrame from './epixnet/zeroframe.js';

// Get site information
const siteInfo = await zeroFrame.cmd('siteInfo');

// Show a notification
await zeroFrame.cmd('wrapperNotification', ['info', 'Hello EpixNet!', 3000]);

// Handle user authentication
const certInfo = await zeroFrame.cmd('certSelect');
```

## Sharing Your Project

### GitHub Setup

1. Initialize git repository:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Create a new repository on GitHub

3. Add remote and push:

   ```bash
   git remote add origin https://github.com/yourusername/your-repo-name.git
   git branch -M main
   git push -u origin main
   ```

The `.env` file containing your local site paths will be automatically ignored by git, so your local configuration stays private while your code can be shared.

## Learn More

- [React Documentation](https://reactjs.org/)
- [Create React App Documentation](https://facebook.github.io/create-react-app/docs/getting-started)
- [EpixNet Documentation](https://epixnet.io/docs/)
