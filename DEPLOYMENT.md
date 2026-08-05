# Render Deployment Guide

This guide will help you deploy your Property Management application to Render using the free tier.

## Prerequisites

- GitHub account with your repository (https://github.com/kjagpal75-tech/property-mgmt)
- Render account (free at https://render.com)

## Step 1: Prepare Your Repository

1. **Commit the deployment files:**
   ```bash
   git add render.yaml .env.example server/.env.example src/api/api.ts
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **Ensure your repository is public** or configure Render to access private repos.

## Step 2: Set Up Render Account

1. Go to https://render.com and sign up/login
2. Connect your GitHub account to Render

## Step 3: Deploy Using render.yaml

1. In Render dashboard, click **"New +"** → **"Blueprint"**
2. Select your GitHub repository: `kjagpal75-tech/property-mgmt`
3. Render will automatically detect the `render.yaml` file
4. Review the configuration and click **"Apply Blueprint"**

## Step 4: Manual Alternative (If Blueprint Fails)

If the automatic blueprint doesn't work, create services manually:

### Database Setup

1. Click **"New +"** → **"PostgreSQL"**
2. Name: `property-mgmt-db`
3. Database: `property_mgmt`
4. User: `property_user`
5. Region: Oregon (free tier)
6. Plan: Free
7. Click **"Create Database"**

### Backend API Setup

1. Click **"New +"** → **"Web Service"**
2. Name: `property-mgmt-api`
3. Runtime: Node
4. Build Command: `cd server && npm install`
5. Start Command: `cd server && npm start`
6. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `DB_HOST`: (from database connection info)
   - `DB_PORT`: `5432`
   - `DB_USER`: (from database connection info)
   - `DB_PASSWORD`: (from database connection info)
   - `DB_NAME`: `property_mgmt`
   - `JWT_SECRET`: (generate a secure random string)
7. Click **"Create Web Service"**

### Frontend Setup

1. Click **"New +"** → **"Static Site"**
2. Name: `property-mgmt-frontend`
3. Build Command: `npm install && npm run build`
4. Publish Directory: `build`
5. Add Environment Variables:
   - `REACT_APP_API_URL`: `https://property-mgmt-api.onrender.com/api`
   - `REACT_APP_AUTH_URL`: `https://property-mgmt-api.onrender.com/api`
6. Click **"Create Static Site"**

## Step 5: Database Initialization

After the database is created, you'll need to run the initialization scripts:

1. Go to your PostgreSQL database in Render dashboard
2. Click **"Connect"** to get connection details
3. Use a PostgreSQL client to run the SQL scripts:
   - `server/database.sql`
   - `server/migration.sql`
   - `server/create-users-table.sql`

Alternatively, you can add a migration script to your server that runs automatically on startup.

## Step 6: Access Your Application

- Frontend: `https://property-mgmt-frontend.onrender.com`
- Backend API: `https://property-mgmt-api.onrender.com/api`
- Database: Available via internal Render network

## Important Notes

### Free Tier Limitations

- **Services spin down** after 15 minutes of inactivity (wake up on request ~30 seconds)
- **Database free tier** is limited (90 days for new databases, then requires paid plan)
- **512 MB RAM** limit per service
- **No custom domains** on free tier

### Cost Expectations

- **Free tier**: Great for development and testing
- **After 90 days**: Database becomes ~$7/month
- **Production use**: Consider upgrading to paid tiers for reliability

### Environment Variables

Never commit actual `.env` files to git. Use the example files and set real values in Render dashboard.

### Troubleshooting

1. **Build fails**: Check Render logs for specific errors
2. **Database connection**: Ensure environment variables match database credentials
3. **Frontend can't reach backend**: Check CORS settings and API URLs
4. **Services keep spinning down**: This is normal on free tier; upgrade for always-on

## Security Considerations

- Change the default JWT_SECRET to a secure random string
- Use strong database passwords
- Enable SSL (Render provides this automatically)
- Consider adding authentication for your frontend in production

## Monitoring

- Render provides logs for each service
- Set up error monitoring (like Sentry) for production
- Monitor database usage to stay within free tier limits

## Next Steps

After successful deployment:

1. Test all functionality thoroughly
2. Set up database backups
3. Consider adding a custom domain (paid tier)
4. Monitor usage and costs
5. Plan for database upgrade after 90 days if continuing use
