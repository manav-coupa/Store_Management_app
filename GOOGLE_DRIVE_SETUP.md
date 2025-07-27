# Google Drive Backup Setup Guide

This guide will help you set up automated backups to Google Drive for your store management system.

## Prerequisites

1. A Google account
2. Google Cloud Console access
3. The application running on your system

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click on it and press "Enable"

## Step 2: Create Service Account Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details:
   - Name: "Store Management Backup"
   - Description: "Service account for automated backups"
4. Click "Create and Continue"
5. Skip the optional steps and click "Done"

## Step 3: Generate JSON Key

1. Click on the service account you just created
2. Go to the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Select "JSON" format
5. Click "Create"
6. Download the JSON file and save it securely

## Step 4: Create Google Drive Folder

1. Go to [Google Drive](https://drive.google.com/)
2. Create a new folder for backups (e.g., "Store Management Backups")
3. Right-click on the folder and select "Share"
4. Add your service account email (from the JSON file) with "Editor" permissions
5. Copy the folder ID from the URL (it's the long string after /folders/)

## Step 5: Configure the Application

1. Place the downloaded JSON file in your project directory (e.g., `backend/credentials.json`)
2. Update the `application.properties` file:

```properties
# Backup Configuration
backup.enabled=true
google.drive.credentials.path=backend/credentials.json
google.drive.folder.id=YOUR_FOLDER_ID_HERE
```

3. Restart the application

## Step 6: Test the Backup

1. Start the application
2. Go to the dashboard
3. Click "Manual Backup" to test the functionality
4. Check your Google Drive folder for the backup file

## Security Notes

- Keep the JSON credentials file secure and never commit it to version control
- The service account has limited permissions only to the specified folder
- Backups are encrypted and stored securely in Google Drive

## Troubleshooting

### Common Issues:

1. **"Invalid credentials" error**
   - Make sure the JSON file path is correct
   - Verify the service account has the correct permissions

2. **"Folder not found" error**
   - Check that the folder ID is correct
   - Ensure the service account has access to the folder

3. **"API not enabled" error**
   - Make sure Google Drive API is enabled in your Google Cloud project

### Manual Backup Location

If Google Drive is not configured, backups will be saved locally in the `backups/` directory with timestamps.

## Backup Schedule

- **Automated**: Every hour
- **Manual**: Available via the dashboard button
- **Format**: JSON with timestamp (e.g., `store_management_backup_2024-01-15_14-30.json`)

## Restore from Backup

To restore from a backup:
1. Download the backup file from Google Drive
2. Use the "Import Data" feature in the dashboard
3. Select the downloaded JSON file
4. Confirm the import

The system will automatically map customer IDs and restore all transactions correctly. 