// Petal & Stem — configuration
//
// Set GOOGLE_CLIENT_ID after you create your OAuth credentials in Google Cloud Console.
// See README.md for step-by-step instructions.
//
// If left empty, the Google Sheets sync feature will be disabled but
// everything else (offline ledger, calendar export, notifications) still works.

export const GOOGLE_CLIENT_ID = '';

// Scopes the app requests during OAuth.
//   spreadsheets — create + edit Sheets
//   drive.file   — only access files this app creates (less scary than full Drive scope)
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
].join(' ');

// Title of the spreadsheet we create in the user's Drive.
// Will use the business name from settings if available; this is the fallback.
export const SHEET_TITLE_FALLBACK = 'Petal & Stem — Ledger';

// Set to true to log Sheets API responses to console for debugging.
export const SHEETS_DEBUG = false;

// --- OneSignal push notifications ---
//
// OneSignal provides server-side scheduled delivery — reminders fire
// even when the phone is asleep or the app is fully closed.
// Free tier: unlimited web push subscribers, $0 forever.
//
// Create a free OneSignal account, create a Web Push app,
// then paste your App ID and REST API Key here. See README.md.
//
// If left empty, reminders fall back to local-only notifications
// (reliable when app is open; best-effort when closed).

export const ONESIGNAL_APP_ID = '94383035-ca3e-4f6c-9859-a51f94bcd3cf';
export const ONESIGNAL_REST_API_KEY = 'os_v2_app_sq4danokhzhwzgczuupzjpgtz6ftscmhw4weesmhcmlbq34zwenkq7ug7jbaeaxfgeu5ndgm6r3p6hfpekzeju2tjcodysjd57gwfji';

// Set to true to log OneSignal API responses to console for debugging.
export const ONESIGNAL_DEBUG = true;
