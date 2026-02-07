# Crossover Manual Time Approval Widget

A Scriptable widget for iOS that displays pending manual time approval requests and allows managers to quickly approve or reject them.

## Features

- **Real-time Pending Requests**: Shows all pending manual time requests from your team
- **Quick Approval**: Tap the widget to open the approval page for the first pending request
- **Multi-Size Support**: Works with small, medium, and large widgets
- **Environment Toggle**: Switch between QA and Production environments
- **Rich Information**: Displays user name, hours, description, and request type (Web/Mobile)

## Setup Instructions

### 1. Install Scriptable App

Download and install [Scriptable](https://scriptable.app/) from the App Store.

### 2. Create New Script

1. Open Scriptable
2. Tap the "+" button to create a new script
3. Name it "Time Approval" (or any name you prefer)
4. Copy the entire contents of `time-approval-widget.js` into the script editor
5. Tap "Done" to save

### 3. Configure Your Settings

Edit the `CONFIG` object at the top of the script:

```javascript
const CONFIG = {
  // Manager credentials
  username: "your.manager@email.com",  // Your manager email
  password: "your_password",            // Your password
  managerId: 765054,                    // Your manager ID
  teamId: 2351927,                      // Your team ID
  useQA: false,                         // true for QA, false for Production
  debugMode: false                      // true to see debug logs
};
```

**Important Settings:**
- `useQA`: Set to `true` for testing on QA environment, `false` for production
- `managerId`: Your manager user ID (visible in your profile or from auth token)
- `teamId`: Your team ID (found in the Crossover dashboard URL)

### 4. Add Widget to Home Screen

1. Long-press on your iPhone home screen
2. Tap the "+" button in the top-left corner
3. Search for "Scriptable"
4. Choose your preferred widget size:
   - **Small**: Shows 2 pending requests
   - **Medium**: Shows 3 pending requests (recommended)
   - **Large**: Shows 5 pending requests with more details
5. Tap "Add Widget"
6. Long-press the widget and select "Edit Widget"
7. Under "Script", select "Time Approval"
8. Tap outside the widget to save

## Usage

### Widget Display

The widget shows:
- **Pending Count**: Number of pending manual time requests
- **User Information**: Name, job title, hours requested
- **Request Details**: Date, type (Web 💻 or Mobile 📱), description
- **Last Updated**: When the widget was last refreshed

### Approving/Rejecting Time

**To Approve:**
1. Tap anywhere on the widget
2. Safari will open to the approval page
3. The first pending request will be pre-selected with "approve" action
4. Review and confirm the approval

**To Reject:**
- Currently, the widget opens the approve page
- You can manually change `action=approve` to `action=reject` in the URL
- Future versions may support a dedicated reject action

### Manual Refresh

Widgets refresh automatically, but you can force a refresh:
1. Long-press the widget
2. Select "Refresh Widget"

## API Response Structure

The widget fetches data from:
```
GET /api/timetracking/workdiaries/manual/pending?weekStartDate=YYYY-MM-DD
```

Response example:
```json
[
  {
    "userId": 36412,
    "fullName": "Test User",
    "jobTitle": "Technical Architect",
    "totalTimeMinutes": 30,
    "webTimeMinutes": 30,
    "mobileTimeMinutes": 0,
    "manualTimes": [
      {
        "startDateTime": "2026-02-05T01:30:00",
        "durationMinutes": 30,
        "type": "WEB",
        "description": "Test",
        "status": "PENDING",
        "timecardIds": [278656299, 278656300],
        "rejectionReason": ""
      }
    ],
    "weekLate": 2
  }
]
```

## Approval URL Format

The widget constructs URLs like:
```
https://app.crossover.com/x/dashboard/team/all/{teamId}/time-approval
  ?review=true
  &tab=manual
  &action=approve          # or reject
  &candidateUserId={userId}
  &weekStartDate={date}
  &ids={timecardId1,timecardId2,...}
```

### URL Parameters

- `teamId`: Your team ID
- `action`: `approve` or `reject`
- `candidateUserId`: The user whose time you're approving
- `weekStartDate`: Start of the week (Sunday) in YYYY-MM-DD format
- `ids`: Comma-separated list of timecard IDs to approve/reject
- `tab`: `manual` for manual time, `overtime` for overtime

## Testing

Before using in production, test with the QA environment:

1. Set `useQA: true` in CONFIG
2. Use QA credentials: `user_765054@example.com` / `test123`
3. Run the test script:
   ```bash
   cd /path/to/scripts
   node test-time-approval-api.js
   ```

Expected output:
```
✅ Authentication successful!
✅ Pending manual time data received!
📋 Full Response: [...]
```

## Troubleshooting

### "Error: Authentication failed"
- Check your username and password
- Verify you're using the correct environment (QA vs Production)
- Ensure your account has manager permissions

### "Error: Failed to fetch data"
- Verify your manager has team access
- Check the `managerId` and `teamId` settings
- Try running the test script to see detailed error messages

### "403 Forbidden"
- Your account doesn't have permission to view pending approvals
- Verify you're logged in as a manager
- Check that the `managerId` matches your account

### Widget shows "No pending approvals" but you know there are some
- The API only returns pending requests for the current week
- Verify the week start date calculation is correct
- Enable `debugMode: true` to see what week it's querying

## Debug Mode

Enable debug mode to see detailed logs:

```javascript
const CONFIG = {
  // ...
  debugMode: true
};
```

Then run the script in Scriptable and check the console logs:
- Authentication status
- API URLs being called
- Week start dates
- Parsed data structure
- Approval URLs generated

## Security Notes

- **Hardcoded Credentials**: For personal use, hardcoded credentials are acceptable
- **For Sharing**: Consider implementing iOS Keychain storage (similar to the hours widget)
- **HTTPS**: All API calls use secure HTTPS connections
- **Token Handling**: Authentication tokens are temporary and not stored

## Future Enhancements

Potential improvements:
- [ ] Support for overtime approval (not just manual time)
- [ ] Multiple action buttons (approve/reject)
- [ ] Widget parameters to switch between manual/overtime
- [ ] Notifications when new approvals are pending
- [ ] Batch approval of multiple requests
- [ ] Show approval history
- [ ] Keychain integration for secure credential storage

## Support

If you encounter issues:
1. Enable `debugMode: true` and check logs
2. Run the test script to verify API connectivity
3. Check your manager permissions in Crossover
4. Verify all CONFIG settings are correct

## Related Scripts

- `crossover-widget.js` - Hours tracking widget for contractors
- `test-time-approval-api.js` - API testing script
- `SECURITY_IMPROVEMENTS.md` - Security best practices

---

**Last Updated**: February 6, 2026
**API Version**: Crossover API v3
**Scriptable Version**: iOS app (latest)
