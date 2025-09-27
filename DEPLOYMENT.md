# GitHub Pages Deployment

This project is configured to automatically deploy to GitHub Pages using GitHub Actions.

## Setup Instructions

### 1. Enable GitHub Pages in Repository Settings

1. Go to your GitHub repository
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**

### 2. Repository Permissions

Make sure your repository has the following permissions enabled:
1. Go to **Settings** → **Actions** → **General**
2. Under **Workflow permissions**, select **Read and write permissions**
3. Check **Allow GitHub Actions to create and approve pull requests**

### 3. Deployment Process

The deployment is handled automatically by the GitHub Actions workflow located at `.github/workflows/deploy.yml`:

- **Trigger**: Pushes to the `main` branch
- **Build Process**: 
  - Installs Node.js 20
  - Installs dependencies with `npm ci`
  - Builds the project with `npm run build`
  - Uploads the built files to GitHub Pages

### 4. Local Development

For local development:
```bash
npm run dev
```

For building locally (same as production):
```bash
npm run build
```

For building specifically for GitHub Pages:
```bash
npm run build:pages
```

### 5. Configuration Details

- **Base Path**: The app is configured with base path `/xplatform/` for GitHub Pages
- **Build Output**: Files are built to the `dist/` directory
- **Environment**: Production builds use `NODE_ENV=production`

### 6. Accessing Your Deployed App

Once deployed, your app will be available at:
```
https://[your-username].github.io/xplatform/
```

Replace `[your-username]` with your actual GitHub username.

### 7. Troubleshooting

- **Build Failures**: Check the Actions tab in your GitHub repository for detailed error logs
- **404 Errors**: Ensure the base path in `vite.config.ts` matches your repository name
- **Permission Issues**: Verify that GitHub Pages is enabled and workflow permissions are set correctly

### 8. Custom Domain (Optional)

If you want to use a custom domain:
1. Add a `CNAME` file to the `public/` directory with your domain
2. Configure your DNS settings to point to GitHub Pages
3. Enable custom domain in GitHub Pages settings