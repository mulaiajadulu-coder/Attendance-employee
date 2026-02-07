---
status: pending
priority: high
created_at: 2026-02-01
---

# Fix Monitoring Images Display

## Issue
User reported that employee attendance photos are not showing up in the Monitoring Page for Managers/HR (`MonitoringPage.jsx`).
Despite backend returning 200 OK for static files and correct paths being stored in DB for new records, the images fail to load in the browser (likely 404 or connection refused on specific environments).

## Current State
- **Backend**: 
  - `express.static` uses absolute path `path.join(__dirname, '../uploads')`.
  - Images are stored in `uploads/absensi/masuk` and `uploads/absensi/pulang`.
  - Database records store path relative to root, e.g., `uploads/absensi/masuk/filename.jpg`.
- **Frontend**:
  - `MonitoringPage.jsx` has a `getAssetUrl` helper.
  - The "View Detail" button (Eye icon) is currently **commented out** (HIDDEN) in `MonitoringPage.jsx`.

## Next Steps to Fix
1. Uncomment the button in `MonitoringPage.jsx`.
2. Debug why the browser cannot load the image even if `curl` works locally.
   - Check Network tab in browser dev tools.
   - Check for Mixed Content issues (if one is https and other http).
   - Check correct port mapping.
3. Verify if `VITE_API_URL` env var is correctly set and accessible.
4. Test with a fresh attendance record.

## Reference
- See Conversation ID around `2026-02-01` regarding "monitoring mgr001".
