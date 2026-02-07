// WorkSmart — Crossover Unified Widget
// Adaptive Hours + Approval Manager
// Non-manager: nimble hours-only widget
// Manager: hours + approval management with notifications
// Role auto-detected on setup, refreshed weekly on Mondays
// Failover cache: shows last known data when API fails

// ─── Version & Auto-Update ───────────────────────────────────
const SCRIPT_VERSION = "1.4.0";
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/jaime-alvarez-trilogy/worksmart/main";

async function checkForUpdate() {
  try {
    const req = new Request(`${GITHUB_RAW_BASE}/version.json`);
    req.timeoutInterval = 5;
    const remote = await req.loadJSON();
    if (!remote || !remote.version) return null;
    if (remote.version === SCRIPT_VERSION) return null;
    // Compare semver: remote is newer if any part is greater
    const local = SCRIPT_VERSION.split(".").map(Number);
    const latest = remote.version.split(".").map(Number);
    for (let i = 0; i < 3; i++) {
      if ((latest[i] || 0) > (local[i] || 0)) {
        return remote; // { version, changelog }
      }
      if ((latest[i] || 0) < (local[i] || 0)) return null;
    }
    return null;
  } catch (e) {
    return null; // Silently fail — don't block widget
  }
}

async function performUpdate() {
  try {
    const req = new Request(`${GITHUB_RAW_BASE}/worksmart.js`);
    req.timeoutInterval = 15;
    const code = await req.loadString();
    if (!code || code.length < 500) return false;
    const fm = FileManager.iCloud();
    const scriptPath = fm.joinPath(fm.documentsDirectory(), Script.name() + ".js");
    fm.writeString(scriptPath, code);
    return true;
  } catch (e) {
    // Try local storage as fallback
    try {
      const req = new Request(`${GITHUB_RAW_BASE}/worksmart.js`);
      const code = await req.loadString();
      if (!code || code.length < 500) return false;
      const fm = FileManager.local();
      const scriptPath = fm.joinPath(fm.documentsDirectory(), Script.name() + ".js");
      fm.writeString(scriptPath, code);
      return true;
    } catch (e2) {
      return false;
    }
  }
}

// ─── Shared Config System ────────────────────────────────────
// Credentials stored in iOS Keychain, settings in JSON file
// Shared with Hours Widget — setup once, both widgets work

const CONFIG_FILE = "crossover-config.json";
const CACHE_FILE = "crossover-cache.json";
const KEY_USERNAME = "crossover_username";
const KEY_PASSWORD = "crossover_password";

function loadConfig() {
  let username, password;
  try {
    username = Keychain.get(KEY_USERNAME);
    password = Keychain.get(KEY_PASSWORD);
  } catch (e) {
    return null;
  }
  if (!username || !password) return null;

  const fm = FileManager.local();
  const path = fm.joinPath(fm.documentsDirectory(), CONFIG_FILE);
  if (!fm.fileExists(path)) return null;

  try {
    const settings = JSON.parse(fm.readString(path));
    if (!settings.setupComplete) return null;
    return { username, password, ...settings };
  } catch (e) {
    return null;
  }
}

function saveConfig(username, password, settings) {
  Keychain.set(KEY_USERNAME, username);
  Keychain.set(KEY_PASSWORD, password);

  const fm = FileManager.local();
  const path = fm.joinPath(fm.documentsDirectory(), CONFIG_FILE);
  fm.writeString(path, JSON.stringify({
    ...settings,
    setupComplete: true,
    setupDate: new Date().toISOString()
  }, null, 2));
}

function updateConfigField(field, value) {
  const fm = FileManager.local();
  const path = fm.joinPath(fm.documentsDirectory(), CONFIG_FILE);
  if (!fm.fileExists(path)) return;
  try {
    const settings = JSON.parse(fm.readString(path));
    settings[field] = value;
    fm.writeString(path, JSON.stringify(settings, null, 2));
    if (CONFIG) CONFIG[field] = value;
  } catch (e) {}
}

function clearConfig() {
  // Keychain has no remove() — overwrite with empty strings
  try { Keychain.set(KEY_USERNAME, ""); } catch (e) {}
  try { Keychain.set(KEY_PASSWORD, ""); } catch (e) {}
  const fm = FileManager.local();
  const path = fm.joinPath(fm.documentsDirectory(), CONFIG_FILE);
  if (fm.fileExists(path)) fm.remove(path);
}

// ─── Failover Cache ─────────────────────────────────────────

function saveCache(hoursData, itemCount) {
  try {
    const fm = FileManager.local();
    const path = fm.joinPath(fm.documentsDirectory(), CACHE_FILE);
    fm.writeString(path, JSON.stringify({
      hoursData,
      itemCount: itemCount || 0,
      cachedAt: new Date().toISOString()
    }));
  } catch (e) {}
}

function loadCache() {
  try {
    const fm = FileManager.local();
    const path = fm.joinPath(fm.documentsDirectory(), CACHE_FILE);
    if (!fm.fileExists(path)) return null;
    const data = JSON.parse(fm.readString(path));
    if (data.hoursData?.deadline) data.hoursData.deadline = new Date(data.hoursData.deadline);
    return data;
  } catch (e) {
    return null;
  }
}

// ─── Onboarding Flow ─────────────────────────────────────────

async function runOnboarding() {
  // Environment
  const envAlert = new Alert();
  envAlert.title = "Crossover Setup";
  envAlert.message = "Which environment?";
  envAlert.addAction("Production");
  envAlert.addAction("QA (Testing)");
  envAlert.addCancelAction("Cancel");
  const envChoice = await envAlert.presentAlert();
  if (envChoice === -1) return null;
  const useQA = envChoice === 1;

  // Credentials
  const credAlert = new Alert();
  credAlert.title = "Crossover Login";
  credAlert.message = "Enter your Crossover credentials.\n\nYour credentials are stored locally on your iOS Keychain and never sent anywhere else.";
  credAlert.addTextField("Email", "");
  credAlert.addSecureTextField("Password", "");
  credAlert.addAction("Log In");
  credAlert.addCancelAction("Cancel");
  const credChoice = await credAlert.presentAlert();
  if (credChoice === -1) return null;

  const username = credAlert.textFieldValue(0).trim();
  const password = credAlert.textFieldValue(1);
  if (!username || !password) {
    const err = new Alert();
    err.title = "Error";
    err.message = "Email and password are required.";
    err.addAction("OK");
    await err.presentAlert();
    return null;
  }

  // Authenticate
  const apiBase = useQA ? "https://api-qa.crossover.com" : "https://api.crossover.com";
  const credentials = btoa(`${username}:${password}`);
  let token, userId;

  try {
    const authReq = new Request(`${apiBase}/api/v3/token`);
    authReq.method = "POST";
    authReq.headers = { "Authorization": `Basic ${credentials}`, "Content-Type": "application/json" };
    const authResp = await authReq.loadJSON();
    token = authResp.token || authResp.access_token;
    userId = parseInt(token.split(':')[0]);
  } catch (e) {
    const err = new Alert();
    err.title = "Login Failed";
    err.message = "Could not authenticate. Check your credentials.";
    err.addAction("OK");
    await err.presentAlert();
    return null;
  }

  // Fetch profile
  let fullName = "Unknown";
  try {
    const profileReq = new Request(`${apiBase}/api/v3/users/current`);
    profileReq.headers = { "x-auth-token": token };
    const profile = await profileReq.loadJSON();
    fullName = profile.fullName || profile.printableName || "Unknown";
  } catch (e) {}

  // Fetch user detail — single endpoint returns all IDs, rate, role, and team info
  // /api/identity/users/current/detail has assignment with team.id, manager.id,
  // candidate avatar id (the userId for timesheet API), salary, and avatarTypes
  let teams = [];
  let primaryTeam = null;
  let managerId = userId;
  let isManager = false;
  let hourlyRate = 0;

  // Strategy 1: /api/identity/users/current/detail (best — has everything)
  try {
    const detailReq = new Request(`${apiBase}/api/identity/users/current/detail`);
    detailReq.headers = { "x-auth-token": token };
    const detail = await detailReq.loadJSON();

    if (detail?.assignment?.team) {
      const a = detail.assignment;
      primaryTeam = {
        id: a.team.id,
        name: a.team.name || "My Team",
        companyName: a.team.company?.name || "",
        managerId: a.manager?.id || userId
      };
      managerId = a.manager?.id || userId;
      teams = [primaryTeam];

      // candidate avatar ID is the userId for timesheet API (NOT the login userId)
      const candidateAvatar = (detail.userAvatars || []).find(av => av.type === "CANDIDATE");
      if (candidateAvatar?.id) userId = candidateAvatar.id;
      // Also available deeper: a.selection.marketplaceMember.application.candidate.id
      if (detail.fullName) fullName = detail.fullName;
      if (a.salary > 0) hourlyRate = Math.round(a.salary);
      isManager = (detail.avatarTypes || []).includes("MANAGER");
    }
  } catch (e) {}

  // Strategy 2: /api/v2/teams/assignments (fallback — also has all IDs)
  if (!primaryTeam) {
    try {
      const assignReq = new Request(`${apiBase}/api/v2/teams/assignments?avatarType=CANDIDATE&status=ACTIVE&page=0`);
      assignReq.headers = { "x-auth-token": token };
      const assignResp = await assignReq.loadJSON();
      const assignments = assignResp?.content || (Array.isArray(assignResp) ? assignResp : []);

      if (assignments.length > 0) {
        const a = assignments[0];
        primaryTeam = {
          id: a.team?.id || 0,
          name: a.team?.name || "My Team",
          companyName: a.team?.company?.name || "",
          managerId: a.manager?.id || userId
        };
        managerId = a.manager?.id || userId;
        if (a.candidate?.id) userId = a.candidate.id;
        teams = [primaryTeam];
        if (a.candidate?.printableName) fullName = a.candidate.printableName;
      }
    } catch (e) {}
  }

  // Strategy 3: /api/v2/teams (works for team owners/managers only)
  if (!primaryTeam) {
    try {
      const teamsReq = new Request(`${apiBase}/api/v2/teams`);
      teamsReq.headers = { "x-auth-token": token };
      const teamsResp = await teamsReq.loadJSON();
      if (Array.isArray(teamsResp) && teamsResp.length > 0) {
        teams = teamsResp.map(t => ({
          id: t.id,
          name: t.name,
          companyName: t.company?.name || "",
          managerId: t.teamOwner?.userId || 0
        }));
        primaryTeam = teams[0];
        managerId = primaryTeam.managerId || userId;
        isManager = true; // /api/v2/teams only succeeds for managers
      }
    } catch (e) {}
  }

  // Last resort: manual ID entry
  if (!primaryTeam) {
    const idAlert = new Alert();
    idAlert.title = "Setup IDs";
    idAlert.message = "Could not auto-detect your team.\n\nTo find these values:\n1. Go to app.crossover.com → Time Tracking\n2. Open browser DevTools → Network tab\n3. Look for a 'timesheets' request — the URL has teamId, managerId, and userId\n\nOr check with your manager.";
    idAlert.addTextField("Team ID", "");
    idAlert.addTextField("Manager ID", "");
    idAlert.addTextField("Your User ID (assignment)", String(userId));
    idAlert.addAction("Save");
    idAlert.addCancelAction("Skip");
    const idChoice = await idAlert.presentAlert();
    if (idChoice === 0) {
      const enteredTeamId = parseInt(idAlert.textFieldValue(0)) || 0;
      const enteredManagerId = parseInt(idAlert.textFieldValue(1)) || userId;
      const enteredUserId = parseInt(idAlert.textFieldValue(2)) || userId;
      if (enteredTeamId > 0) {
        primaryTeam = {
          id: enteredTeamId,
          name: "My Team",
          companyName: "",
          managerId: enteredManagerId
        };
        managerId = enteredManagerId;
        teams = [primaryTeam];
      }
      if (enteredUserId !== userId) userId = enteredUserId;
    }
  }

  // Detect hourly rate from payments if not already found from detail endpoint
  if (hourlyRate === 0) {
    try {
      const now = new Date();
      const from = new Date(now);
      from.setMonth(from.getMonth() - 3);
      const paymentsReq = new Request(`${apiBase}/api/v3/users/current/payments?from=${from.toISOString().split('T')[0]}&to=${now.toISOString().split('T')[0]}`);
      paymentsReq.headers = { "x-auth-token": token };
      const payments = await paymentsReq.loadJSON();
      if (Array.isArray(payments)) {
        for (const p of payments) {
          if (p.paidHours > 0 && p.amount > 0) {
            hourlyRate = Math.round(p.amount / p.paidHours);
            break;
          }
        }
      }
    } catch (e) {}
  }

  if (hourlyRate === 0) {
    // Fallback: ask user manually
    const rateAlert = new Alert();
    rateAlert.title = "Hourly Rate";
    rateAlert.message = "Could not detect your rate automatically.\nEnter your hourly rate in USD.";
    rateAlert.addTextField("Hourly rate", "50");
    rateAlert.addAction("Save");
    rateAlert.addAction("Skip ($50 default)");
    rateAlert.addCancelAction("Cancel");
    const rateChoice = await rateAlert.presentAlert();
    if (rateChoice === -1) return null;
    hourlyRate = rateChoice === 0 ? parseFloat(rateAlert.textFieldValue(0)) || 50 : 50;
  }

  // Save
  const settings = {
    userId, fullName, managerId,
    primaryTeamId: primaryTeam?.id || 0,
    teams, hourlyRate, useQA,
    isManager,
    lastRoleCheck: new Date().toISOString(),
    debugMode: false
  };
  saveConfig(username, password, settings);

  // Success
  const ok = new Alert();
  ok.title = "Setup Complete!";
  ok.message = `Welcome, ${fullName}!\n\nUser ID: ${userId}\nTeam: ${primaryTeam?.name || "N/A"}\nRole: ${isManager ? "Manager" : "Contributor"}\nRate: $${hourlyRate}/hr\nEnv: ${useQA ? "QA" : "Production"}\n\nCredentials stored in iOS Keychain.\nYou can change your rate anytime in Settings.`;
  ok.addAction("Done");
  await ok.presentAlert();

  return { username, password, ...settings };
}

async function getConfig() {
  let cfg = loadConfig();
  if (!cfg) cfg = await runOnboarding();
  return cfg;
}

// ─── Dynamic Config & URLs ───────────────────────────────────
// Set after config is loaded (see main())

let CONFIG = null;
let API_BASE = "";
let APP_BASE = "";
let TOKEN_URL = "";
let PENDING_MANUAL_URL = "";
let PENDING_OVERTIME_URL = "";
let APPROVAL_BASE_URL = "";
let TIMESHEET_URL = "";
let ACTIVE_TOKEN = "";

function initUrls(cfg) {
  // Backward compat: existing configs without isManager default to true
  // (existing users of this widget were managers using it for approvals)
  if (cfg.isManager === undefined) cfg.isManager = true;
  CONFIG = cfg;
  API_BASE = cfg.useQA ? "https://api-qa.crossover.com" : "https://api.crossover.com";
  APP_BASE = cfg.useQA ? "https://app-qa.crossover.com" : "https://app.crossover.com";
  TOKEN_URL = `${API_BASE}/api/v3/token`;
  PENDING_MANUAL_URL = `${API_BASE}/api/timetracking/workdiaries/manual/pending`;
  PENDING_OVERTIME_URL = `${API_BASE}/api/overtime/request`;
  APPROVAL_BASE_URL = `${APP_BASE}/x/dashboard/team/all`;
  TIMESHEET_URL = `${API_BASE}/api/timetracking/timesheets`;
}

// ─── Weekly Role & Rate Refresh ──────────────────────────────

async function weeklyRefresh(token) {
  // Check if refresh is needed (missing or last check was before this Monday)
  const now = new Date();
  const lastCheck = CONFIG.lastRoleCheck ? new Date(CONFIG.lastRoleCheck) : null;

  if (lastCheck) {
    // Find this week's Monday
    const thisMonday = new Date(now);
    const day = thisMonday.getDay();
    const diff = day === 0 ? 6 : day - 1; // Monday = 0 offset
    thisMonday.setDate(thisMonday.getDate() - diff);
    thisMonday.setHours(0, 0, 0, 0);

    if (lastCheck >= thisMonday) {
      if (CONFIG.debugMode) console.log("🔄 Weekly refresh: skipped (already checked this week)");
      return;
    }
  }

  if (CONFIG.debugMode) console.log("🔄 Weekly refresh: checking role and rate...");

  // Re-check user detail for role, rate, and ID updates
  try {
    const detailReq = new Request(`${API_BASE}/api/identity/users/current/detail`);
    detailReq.headers = { "x-auth-token": token };
    const detail = await detailReq.loadJSON();

    if (detail?.assignment) {
      const a = detail.assignment;
      if (a.team?.id && a.team.id !== CONFIG.primaryTeamId) {
        updateConfigField("primaryTeamId", a.team.id);
        if (CONFIG.debugMode) console.log(`🔄 Team updated: → ${a.team.id}`);
      }
      if (a.manager?.id && a.manager.id !== CONFIG.managerId) {
        updateConfigField("managerId", a.manager.id);
        if (CONFIG.debugMode) console.log(`🔄 Manager updated: → ${a.manager.id}`);
      }
      const candidateAvatar = (detail.userAvatars || []).find(av => av.type === "CANDIDATE");
      if (candidateAvatar?.id && candidateAvatar.id !== CONFIG.userId) {
        updateConfigField("userId", candidateAvatar.id);
        if (CONFIG.debugMode) console.log(`🔄 User ID updated: → ${candidateAvatar.id}`);
      }
      const isManager = (detail.avatarTypes || []).includes("MANAGER");
      if (isManager !== CONFIG.isManager) {
        updateConfigField("isManager", isManager);
        if (CONFIG.debugMode) console.log(`🔄 Role changed: ${isManager ? "Manager" : "Contributor"}`);
      }
      if (a.salary > 0) {
        const newRate = Math.round(a.salary);
        if (newRate !== CONFIG.hourlyRate) {
          updateConfigField("hourlyRate", newRate);
          if (CONFIG.debugMode) console.log(`🔄 Rate updated: $${CONFIG.hourlyRate} → $${newRate}`);
        }
      }
    }
  } catch (e) {
    if (CONFIG.debugMode) console.log("🔄 Detail check failed, keeping current config");
  }

  updateConfigField("lastRoleCheck", now.toISOString());
}

// Logo URLs (Google Drive direct links) — same as hours widget
const LOGO_URL_LARGE = "https://drive.google.com/uc?export=view&id=1eL0cjw1tqc_tdYxuD8G9EnEKBmbcd0A7"; // 512x512
const LOGO_URL_SMALL = "https://drive.google.com/uc?export=view&id=1ZSYu1zXxl8xpLJVfOPUOxjDr8pS3tupv"; // 128x128

// ─── Device Dimensions ──────────────────────────────────────

function getWidgetDimensions() {
  const phone = Device.screenSize();
  const height = phone.height;
  const width = phone.width;

  const devices = {
    932: { name: "iPhone 16 Pro Max / 15 Pro Max / 15 Plus", small: 170, medium: 364, large: 382 },
    852: { name: "iPhone 16 Pro / 15 Pro / 14 Pro", small: 158, medium: 338, large: 354 },
    844: { name: "iPhone 16 / 15 / 14 / 13 / 12", small: 158, medium: 338, large: 354 },
    896: { name: "iPhone 11 Pro Max / XS Max / 11", small: 169, medium: 360, large: 379 },
    812: { name: "iPhone X / XS / 11 Pro / mini", small: 155, medium: 329, large: 345 },
    736: { name: "iPhone 6/7/8 Plus", small: 157, medium: 348, large: 357 },
    667: { name: "iPhone 6/7/8 / SE", small: 148, medium: 321, large: 324 },
    568: { name: "iPhone SE 1st gen", small: 141, medium: 292, large: 311 }
  };

  const deviceInfo = devices[height] || devices[844];

  if (CONFIG.debugMode) {
    console.log(`📱 Device: ${deviceInfo.name}`);
    console.log(`📏 Screen: ${width}×${height}pt`);
  }

  return deviceInfo;
}

// ─── Logo Loading ────────────────────────────────────────────

async function loadLogo(useSmall = false) {
  try {
    const logoUrl = useSmall ? LOGO_URL_SMALL : LOGO_URL_LARGE;
    const request = new Request(logoUrl);
    const image = await request.loadImage();
    return image;
  } catch (error) {
    console.error("Failed to load logo:", error);
    return null;
  }
}

// ─── Authentication ──────────────────────────────────────────

async function getAuthToken() {
  const credentials = btoa(`${CONFIG.username}:${CONFIG.password}`);

  const request = new Request(TOKEN_URL);
  request.method = "POST";
  request.headers = {
    "Authorization": `Basic ${credentials}`,
    "Content-Type": "application/json"
  };

  try {
    const response = await request.loadJSON();
    const token = response.token || response.access_token || response;
    if (CONFIG.debugMode) console.log("✅ Auth OK");
    return token;
  } catch (error) {
    console.error("❌ Auth failed:", error);
    // If auth fails, credentials may have changed — clear config so onboarding runs next time
    clearConfig();
    return null;
  }
}

// ─── Week Start Date ─────────────────────────────────────────

function getWeekStartDate() {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - day);
  return weekStart.toISOString().split('T')[0];
}

// ─── Fetch Pending Manual Time ───────────────────────────────

async function getPendingManualTime(token) {
  const weekStartStr = getWeekStartDate();
  const url = `${PENDING_MANUAL_URL}?weekStartDate=${weekStartStr}`;

  if (CONFIG.debugMode) console.log("📊 Fetching manual:", url);

  const request = new Request(url);
  request.headers = {
    "x-auth-token": token,
    "Accept": "application/json"
  };

  try {
    const response = await request.loadJSON();
    if (CONFIG.debugMode) console.log("✅ Manual time received");
    return response;
  } catch (error) {
    console.error("❌ Manual fetch failed:", error);
    return [];
  }
}

// ─── Fetch Pending Overtime ──────────────────────────────────

async function getPendingOvertime(token) {
  // Crossover uses Monday-based weeks for overtime
  const today = new Date();
  const day = today.getDay(); // 0=Sun
  const mondayOffset = day === 0 ? 6 : day - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);
  const weekStartStr = monday.toISOString().split('T')[0];

  const url = `${PENDING_OVERTIME_URL}?status=PENDING&weekStartDate=${weekStartStr}`;

  if (CONFIG.debugMode) console.log("⏰ Fetching overtime:", url);

  const request = new Request(url);
  request.headers = {
    "x-auth-token": token,
    "Accept": "application/json"
  };

  try {
    const response = await request.loadJSON();
    if (CONFIG.debugMode) console.log("✅ Overtime received:", JSON.stringify(response).substring(0, 200));
    // Handle both plain array and paginated {content: [...]} responses
    if (Array.isArray(response)) return response;
    if (response && Array.isArray(response.content)) return response.content;
    if (response && typeof response === "object") return [response];
    return [];
  } catch (error) {
    console.error("❌ Overtime fetch failed:", error);
    return [];
  }
}

// ─── Fetch Timesheet Data ─────────────────────────────────────

async function getTimesheetData(token) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  // Try multiple URL strategies — some accounts need different params
  const urls = [];

  // Strategy 1: full params (team + manager + user)
  if (CONFIG.primaryTeamId && CONFIG.managerId) {
    urls.push(`${TIMESHEET_URL}?date=${dateStr}&managerId=${CONFIG.managerId}&period=WEEK&teamId=${CONFIG.primaryTeamId}&userId=${CONFIG.userId}`);
  }

  // Strategy 2: manager + user only (no team)
  if (CONFIG.managerId && CONFIG.managerId !== CONFIG.userId) {
    urls.push(`${TIMESHEET_URL}?date=${dateStr}&managerId=${CONFIG.managerId}&period=WEEK&userId=${CONFIG.userId}`);
  }

  // Strategy 3: just user + period (minimal)
  urls.push(`${TIMESHEET_URL}?date=${dateStr}&period=WEEK&userId=${CONFIG.userId}`);

  for (const url of urls) {
    if (CONFIG.debugMode) console.log("📊 Fetching timesheet:", url);
    try {
      const request = new Request(url);
      request.headers = { "x-auth-token": token };
      const response = await request.loadJSON();
      if (response && Array.isArray(response) && response.length > 0) {
        return response;
      }
      if (response && !Array.isArray(response) && Object.keys(response).length > 0) {
        return response;
      }
    } catch (e) {
      if (CONFIG.debugMode) console.log("📊 Strategy failed, trying next...");
    }
  }

  console.error("Failed to fetch timesheet with all strategies");
  return null;
}

// Calculate total hours from timesheet
function calculateHours(timesheetData) {
  if (!timesheetData || !Array.isArray(timesheetData) || timesheetData.length === 0) {
    const now = new Date();
    const currentDay = now.getUTCDay();
    const daysUntilSunday = currentDay === 0 ? 0 : 7 - currentDay;
    const deadline = new Date(now);
    deadline.setUTCDate(deadline.getUTCDate() + daysUntilSunday);
    deadline.setUTCHours(23, 59, 59, 999);
    return {
      total: 0, average: 0, today: 0, daily: [],
      weeklyEarnings: 0, todayEarnings: 0,
      hoursRemaining: 40, timeRemaining: deadline - now, deadline: deadline
    };
  }

  const firstEntry = timesheetData[0];
  const totalHours = parseFloat(firstEntry.totalHours || firstEntry.hourWorked || 0);
  const averageHours = parseFloat(firstEntry.averageHoursPerDay || 0);
  const daily = firstEntry.stats || [];

  // Get today's hours
  const today = new Date().toISOString().split('T')[0];
  const todayData = daily.find(d => d.date.startsWith(today));
  const todayHours = todayData ? todayData.hours : 0;

  // Calculate earnings
  const weeklyEarnings = totalHours * CONFIG.hourlyRate;
  const todayEarnings = todayHours * CONFIG.hourlyRate;

  // Calculate deadline (Sunday midnight GMT)
  const now = new Date();
  const currentDay = now.getUTCDay();
  const daysUntilSunday = currentDay === 0 ? 0 : 7 - currentDay;

  const deadline = new Date(now);
  deadline.setUTCDate(deadline.getUTCDate() + daysUntilSunday);
  deadline.setUTCHours(23, 59, 59, 999);

  const timeRemaining = deadline - now;
  const hoursRemaining = Math.max(0, 40 - totalHours);

  return {
    total: totalHours,
    average: averageHours,
    today: todayHours,
    daily: daily,
    weeklyEarnings: weeklyEarnings,
    todayEarnings: todayEarnings,
    hoursRemaining: hoursRemaining,
    timeRemaining: timeRemaining,
    deadline: deadline
  };
}

// Format time remaining
function formatTimeRemaining(milliseconds) {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}d ${remainingHours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

// ─── Parse Manual Time Data ──────────────────────────────────

function parseManualData(pendingData) {
  if (!Array.isArray(pendingData) || pendingData.length === 0) return [];

  const parsed = [];
  const weekStartStr = getWeekStartDate();

  pendingData.forEach(user => {
    if (!user.manualTimes || user.manualTimes.length === 0) return;

    user.manualTimes.forEach(manualTime => {
      if (manualTime.status !== "PENDING") return;

      parsed.push({
        category: "MANUAL",
        userId: user.userId,
        fullName: user.fullName,
        jobTitle: (user.jobTitle || "").replace(/"/g, ''),
        durationMinutes: manualTime.durationMinutes,
        hours: (manualTime.durationMinutes / 60).toFixed(1),
        description: manualTime.description || "No description",
        startDateTime: manualTime.startDateTime,
        type: manualTime.type, // WEB or MOBILE
        timecardIds: manualTime.timecardIds,
        weekStartDate: weekStartStr
      });
    });
  });

  return parsed;
}

// ─── Parse Overtime Data ─────────────────────────────────────

function parseOvertimeData(overtimeData) {
  if (!Array.isArray(overtimeData) || overtimeData.length === 0) return [];

  const parsed = [];

  overtimeData.forEach(entry => {
    const ot = entry.overtimeRequest;
    if (!ot || ot.status !== "PENDING") return;

    const candidate = entry.assignment?.selection?.marketplaceMember?.application?.candidate;
    const assignment = entry.assignment;

    parsed.push({
      category: "OVERTIME",
      overtimeId: ot.id,
      userId: candidate?.userId || 0,
      fullName: candidate?.printableName || "Unknown",
      jobTitle: (assignment?.jobTitle || "").replace(/"/g, ''),
      durationMinutes: ot.overtimePeriod,
      hours: (ot.overtimePeriod / 60).toFixed(1),
      cost: ot.overtimeCost,
      description: ot.memo || "No memo",
      startDateTime: ot.createdOn,
      type: "OVERTIME",
      timecardIds: [], // Overtime uses overtimeId, not timecardIds
      weekStartDate: ot.weekStartDate,
      totalHoursWorked: entry.totalHoursWorked,
      salary: assignment?.salary
    });
  });

  return parsed;
}

// ─── URL Builder ─────────────────────────────────────────────

function buildApprovalUrl(action, item) {
  const teamId = CONFIG.primaryTeamId;

  if (item.category === "OVERTIME") {
    return `${APPROVAL_BASE_URL}/${teamId}/time-approval?review=true&tab=overtime&action=${action}&candidateUserId=${item.userId}&weekStartDate=${item.weekStartDate}&ids=${item.overtimeId}`;
  }

  const ids = Array.isArray(item.timecardIds) ? item.timecardIds.join(',') : item.timecardIds;
  return `${APPROVAL_BASE_URL}/${teamId}/time-approval?review=true&tab=manual&action=${action}&candidateUserId=${item.userId}&weekStartDate=${item.weekStartDate}&ids=${ids}`;
}

// ─── Direct API Approval/Rejection ───────────────────────────

async function approveItemViaAPI(token, item) {
  if (item.category === "OVERTIME") {
    const url = `${API_BASE}/api/overtime/request/approval/${item.overtimeId}`;
    const request = new Request(url);
    request.method = "PUT";
    request.headers = { "x-auth-token": token, "Content-Type": "application/json" };
    await request.load();
    return request.response.statusCode === 200;
  }

  // Manual time
  const url = `${API_BASE}/api/timetracking/workdiaries/manual/approved`;
  const request = new Request(url);
  request.method = "PUT";
  request.headers = { "x-auth-token": token, "Content-Type": "application/json" };
  request.body = JSON.stringify({
    approverId: CONFIG.userId,
    timecardIds: item.timecardIds,
    allowOvertime: false
  });
  await request.load();
  return request.response.statusCode === 200;
}

async function rejectItemViaAPI(token, item, reason) {
  if (item.category === "OVERTIME") {
    const url = `${API_BASE}/api/overtime/request/rejection/${item.overtimeId}`;
    const request = new Request(url);
    request.method = "PUT";
    request.headers = { "x-auth-token": token, "Content-Type": "application/json" };
    request.body = JSON.stringify({ memo: reason || "Rejected" });
    await request.load();
    return request.response.statusCode === 200;
  }

  // Manual time
  const url = `${API_BASE}/api/timetracking/workdiaries/manual/rejected`;
  const request = new Request(url);
  request.method = "PUT";
  request.headers = { "x-auth-token": token, "Content-Type": "application/json" };
  request.body = JSON.stringify({
    approverId: CONFIG.userId,
    timecardIds: item.timecardIds,
    rejectionReason: reason || "Rejected"
  });
  await request.load();
  return request.response.statusCode === 200;
}

// ─── Notification System ─────────────────────────────────────

const STORAGE_FILE = "time-approval-state.json";

function loadStoredState() {
  const fm = FileManager.local();
  const dir = fm.documentsDirectory();
  const path = fm.joinPath(dir, STORAGE_FILE);

  if (fm.fileExists(path)) {
    try {
      const data = JSON.parse(fm.readString(path));
      return data;
    } catch (e) {
      return { lastCount: 0, lastIds: [] };
    }
  }
  return { lastCount: 0, lastIds: [] };
}

function saveStoredState(count, ids) {
  const fm = FileManager.local();
  const dir = fm.documentsDirectory();
  const path = fm.joinPath(dir, STORAGE_FILE);

  fm.writeString(path, JSON.stringify({
    lastCount: count,
    lastIds: ids,
    lastUpdated: new Date().toISOString()
  }));
}

async function checkAndNotify(allItems) {
  const stored = loadStoredState();

  // Build a set of unique IDs for current items
  const currentIds = allItems.map(item => {
    if (item.category === "OVERTIME") return `ot-${item.overtimeId}`;
    return `mt-${item.timecardIds.join(',')}`;
  });

  // Find truly new items (IDs we haven't seen before)
  const storedIdSet = new Set(stored.lastIds);
  const newItems = allItems.filter((item, i) => !storedIdSet.has(currentIds[i]));

  if (newItems.length > 0) {
    const manualNew = newItems.filter(i => i.category === "MANUAL");
    const overtimeNew = newItems.filter(i => i.category === "OVERTIME");

    const notif = new Notification();
    notif.title = "New Time Approval Requests";
    notif.threadIdentifier = "time-approval";
    notif.sound = "default";

    // Build body
    const parts = [];
    if (manualNew.length > 0) {
      const names = [...new Set(manualNew.map(i => i.fullName))].join(', ');
      const totalHrs = manualNew.reduce((sum, i) => sum + parseFloat(i.hours), 0).toFixed(1);
      parts.push(`📝 ${manualNew.length} manual (${totalHrs}h) from ${names}`);
    }
    if (overtimeNew.length > 0) {
      const names = [...new Set(overtimeNew.map(i => i.fullName))].join(', ');
      const totalHrs = overtimeNew.reduce((sum, i) => sum + parseFloat(i.hours), 0).toFixed(1);
      parts.push(`⏰ ${overtimeNew.length} overtime (${totalHrs}h) from ${names}`);
    }

    notif.body = parts.join('\n');

    // Open the script when notification is tapped
    notif.openURL = URLScheme.forRunningScript();

    await notif.schedule();

    if (CONFIG.debugMode) {
      console.log(`🔔 Notification sent: ${newItems.length} new items`);
    }
  } else if (CONFIG.debugMode) {
    console.log("🔕 No new items since last check");
  }

  // Save current state
  saveStoredState(allItems.length, currentIds);

  // Schedule deadline reminders if items are pending
  await scheduleDeadlineReminders(allItems);
}

// ─── Deadline System ─────────────────────────────────────────

const REMINDER_PREFIX = "time-approval-deadline-";

function getSundayMidnightGMT() {
  const now = new Date();
  const currentDay = now.getUTCDay(); // 0 = Sunday
  const daysUntilSunday = currentDay === 0 ? 0 : 7 - currentDay;

  const deadline = new Date(now);
  deadline.setUTCDate(deadline.getUTCDate() + daysUntilSunday);
  deadline.setUTCHours(23, 59, 59, 999);

  return deadline;
}

function formatCountdown(ms) {
  const totalMin = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Returns urgency level for widget styling
// "none" = >12h, "low" = 12h-3h, "high" = 3h-1h, "critical" = <1h
function getUrgencyLevel() {
  const now = new Date();
  const deadline = getSundayMidnightGMT();
  const hoursLeft = (deadline - now) / (1000 * 60 * 60);

  if (hoursLeft <= 0) return "expired";
  if (hoursLeft <= 1) return "critical";
  if (hoursLeft <= 3) return "high";
  if (hoursLeft <= 12) return "low";
  return "none";
}

function getHoursUntilDeadline() {
  const now = new Date();
  const deadline = getSundayMidnightGMT();
  return (deadline - now) / (1000 * 60 * 60);
}

async function scheduleDeadlineReminders(allItems) {
  // Clear any previously scheduled deadline reminders
  const pending = await Notification.allPending();
  const deadlineIds = pending
    .filter(n => n.identifier && n.identifier.startsWith(REMINDER_PREFIX))
    .map(n => n.identifier);

  if (deadlineIds.length > 0) {
    Notification.removePending(deadlineIds);
    if (CONFIG.debugMode) console.log(`🗑️ Cleared ${deadlineIds.length} old reminders`);
  }

  // No pending items → no reminders needed
  if (!allItems || allItems.length === 0) {
    if (CONFIG.debugMode) console.log("🔕 No pending items, no reminders needed");
    return;
  }

  const now = new Date();
  const deadline = getSundayMidnightGMT();
  const msUntilDeadline = deadline - now;
  const hoursLeft = msUntilDeadline / (1000 * 60 * 60);

  // Only schedule if within 12 hours of deadline
  if (hoursLeft > 12 || hoursLeft <= 0) {
    if (CONFIG.debugMode) console.log(`🔕 ${hoursLeft.toFixed(1)}h until deadline, reminders start within 3h`);
    return;
  }

  const itemCount = allItems.length;
  const itemLabel = `${itemCount} request${itemCount > 1 ? 's' : ''}`;
  let scheduled = 0;

  // Tier 1: 3h-1h before deadline → every 60 min
  const threeHoursBefore = new Date(deadline.getTime() - 3 * 60 * 60 * 1000);
  const oneHourBefore = new Date(deadline.getTime() - 1 * 60 * 60 * 1000);

  let t = new Date(Math.max(threeHoursBefore.getTime(), now.getTime() + 60000)); // At least 1 min from now
  while (t < oneHourBefore) {
    const msLeft = deadline - t;
    const notif = new Notification();
    notif.identifier = `${REMINDER_PREFIX}${scheduled}`;
    notif.title = `⚠️ ${formatCountdown(msLeft)} left to approve`;
    notif.body = `${itemLabel} still pending — deadline Sunday midnight GMT`;
    notif.threadIdentifier = "time-approval-deadline";
    notif.sound = "default";
    notif.openURL = URLScheme.forRunningScript();
    notif.setTriggerDate(t);
    await notif.schedule();
    scheduled++;
    t = new Date(t.getTime() + 60 * 60 * 1000); // +60 min
  }

  // Tier 2: Last 1 hour → every 30 min
  t = new Date(Math.max(oneHourBefore.getTime(), now.getTime() + 60000));
  const fiveMinBefore = new Date(deadline.getTime() - 5 * 60 * 1000);

  while (t < fiveMinBefore) {
    const msLeft = deadline - t;
    const notif = new Notification();
    notif.identifier = `${REMINDER_PREFIX}${scheduled}`;
    notif.title = `🔴 ${formatCountdown(msLeft)} left!`;
    notif.body = `${itemLabel} still pending — approve now before it's too late!`;
    notif.threadIdentifier = "time-approval-deadline";
    notif.sound = "default";
    notif.openURL = URLScheme.forRunningScript();
    notif.setTriggerDate(t);
    await notif.schedule();
    scheduled++;
    t = new Date(t.getTime() + 30 * 60 * 1000); // +30 min
  }

  // Final: 5 min before deadline
  if (fiveMinBefore > now) {
    const notif = new Notification();
    notif.identifier = `${REMINDER_PREFIX}final`;
    notif.title = `🚨 5 MINUTES LEFT!`;
    notif.body = `${itemLabel} still pending! Approve NOW or they expire!`;
    notif.threadIdentifier = "time-approval-deadline";
    notif.sound = "default";
    notif.openURL = URLScheme.forRunningScript();
    notif.setTriggerDate(fiveMinBefore);
    await notif.schedule();
    scheduled++;
  }

  if (CONFIG.debugMode) {
    console.log(`⏰ Scheduled ${scheduled} deadline reminders:`);
    console.log(`   3h-1h: every 60m | Last 1h: every 30m | 5m: final alert`);
  }
}

// ─── Data Fetching (reusable for refresh) ────────────────────

async function fetchApprovalData(token) {
  let allItems = [];
  let hoursData = null;

  if (CONFIG.isManager) {
    const [manualData, overtimeData, timesheetData] = await Promise.all([
      getPendingManualTime(token),
      getPendingOvertime(token),
      getTimesheetData(token)
    ]);

    const manualItems = parseManualData(manualData || []);
    const overtimeItems = parseOvertimeData(overtimeData || []);
    allItems = [...manualItems, ...overtimeItems];
    hoursData = timesheetData ? calculateHours(timesheetData) : null;
  } else {
    const timesheetData = await getTimesheetData(token);
    hoursData = timesheetData ? calculateHours(timesheetData) : null;
  }

  if (hoursData) {
    saveCache(hoursData, allItems.length);
  }

  return { allItems, hoursData };
}

// ─── Interactive In-App View (UITable) ───────────────────────

async function showInteractiveView(allItems, hoursData = null) {
  const table = new UITable();
  table.showSeparators = true;
  buildTableRows(table, allItems, hoursData);
  await table.present(false);
}

function buildTableRows(table, allItems, hoursData) {
  table.removeAllRows();

  // Closure to refresh the table after actions
  const refreshTable = async () => {
    const data = await fetchApprovalData(ACTIVE_TOKEN);
    buildTableRows(table, data.allItems, data.hoursData);
    table.reload();
  };

  const manualItems = allItems.filter(i => i.category === "MANUAL");
  const overtimeItems = allItems.filter(i => i.category === "OVERTIME");

  // Header row
  const headerRow = new UITableRow();
  headerRow.isHeader = true;
  headerRow.backgroundColor = new Color("#1a1a1a");

  let headerTitle, headerSubtitle;

  if (CONFIG.isManager && allItems.length > 0) {
    // Manager with pending items: approval-focused header
    headerTitle = CONFIG.useQA ? "⏱️ Time Approval [QA]" : "⏱️ Time Approval";
    headerSubtitle = `${manualItems.length} manual • ${overtimeItems.length} overtime`;
    if (hoursData && hoursData.total !== undefined) {
      headerSubtitle += ` | ${hoursData.total.toFixed(1)}h worked`;
    }
  } else {
    // Manager with nothing to approve, or non-manager: earnings-focused header
    headerTitle = CONFIG.useQA ? "⏱️ Crossover Hours [QA]" : "⏱️ Crossover Hours";
    headerSubtitle = hoursData ? `${hoursData.total.toFixed(1)}h this week • $${hoursData.weeklyEarnings.toFixed(0)} earned` : "Loading...";
  }

  const headerText = headerRow.addText(headerTitle, headerSubtitle);
  headerText.titleFont = Font.boldSystemFont(20);
  headerText.titleColor = Color.white();
  headerText.subtitleFont = Font.systemFont(14);
  headerText.subtitleColor = new Color("#FFC107");

  table.addRow(headerRow);

  if (allItems.length === 0) {
    // ── Earnings-focused view (no approvals pending) ──
    if (hoursData && hoursData.total !== undefined) {
      // Big earnings row
      const earningsRow = new UITableRow();
      earningsRow.backgroundColor = new Color("#1a1a1a");
      earningsRow.height = 70;
      const earningsText = earningsRow.addText(
        `$${hoursData.weeklyEarnings.toFixed(2)}`,
        `${hoursData.total.toFixed(1)} hours this week`
      );
      earningsText.titleFont = Font.boldSystemFont(32);
      earningsText.titleColor = new Color("#FFC107");
      earningsText.subtitleFont = Font.systemFont(15);
      earningsText.subtitleColor = new Color("#4CAF50");
      table.addRow(earningsRow);

      // Rate info
      const rateRow = new UITableRow();
      rateRow.backgroundColor = new Color("#1a1a1a");
      rateRow.height = 30;
      const rateText = rateRow.addText(`$${CONFIG.hourlyRate}/hr rate`);
      rateText.titleFont = Font.systemFont(14);
      rateText.titleColor = new Color("#999999");
      table.addRow(rateRow);

      // Spacer
      const sp1 = new UITableRow();
      sp1.backgroundColor = new Color("#1a1a1a");
      sp1.height = 10;
      table.addRow(sp1);

      // Hours remaining / goal
      if (hoursData.hoursRemaining > 0) {
        const remainRow = new UITableRow();
        remainRow.backgroundColor = new Color("#1a1a1a");
        remainRow.height = 45;
        const potentialEarnings = hoursData.hoursRemaining * CONFIG.hourlyRate;
        const remainText = remainRow.addText(
          `${hoursData.hoursRemaining.toFixed(1)} hrs left to 40`,
          `$${potentialEarnings.toFixed(0)} potential • ${formatTimeRemaining(hoursData.timeRemaining)} until deadline`
        );
        remainText.titleFont = Font.boldSystemFont(16);
        remainText.titleColor = new Color("#FF9800");
        remainText.subtitleFont = Font.systemFont(13);
        remainText.subtitleColor = new Color("#FF5722");
        table.addRow(remainRow);
      } else {
        const goalRow = new UITableRow();
        goalRow.backgroundColor = new Color("#1a1a1a");
        goalRow.height = 40;
        const goalText = goalRow.addText("40 hour goal reached!", `$${hoursData.weeklyEarnings.toFixed(0)}+ earned this week`);
        goalText.titleFont = Font.boldSystemFont(16);
        goalText.titleColor = new Color("#4CAF50");
        goalText.subtitleFont = Font.systemFont(13);
        goalText.subtitleColor = new Color("#FFC107");
        table.addRow(goalRow);
      }

      // Today's hours
      if (hoursData.today > 0) {
        const todayRow = new UITableRow();
        todayRow.backgroundColor = new Color("#1a1a1a");
        todayRow.height = 35;
        const todayText = todayRow.addText(
          `Today: ${hoursData.today.toFixed(1)} hrs`,
          `$${hoursData.todayEarnings.toFixed(2)}`
        );
        todayText.titleFont = Font.systemFont(14);
        todayText.titleColor = new Color("#64B5F6");
        todayText.subtitleFont = Font.systemFont(13);
        todayText.subtitleColor = new Color("#64B5F6");
        table.addRow(todayRow);
      }

      // Average
      if (hoursData.average > 0) {
        const avgRow = new UITableRow();
        avgRow.backgroundColor = new Color("#1a1a1a");
        avgRow.height = 30;
        const avgEarnings = hoursData.average * CONFIG.hourlyRate;
        const avgText = avgRow.addText(`Avg: ${hoursData.average.toFixed(1)} hrs/day ($${avgEarnings.toFixed(2)})`);
        avgText.titleFont = Font.systemFont(13);
        avgText.titleColor = new Color("#999999");
        table.addRow(avgRow);
      }

      // Daily breakdown
      if (hoursData.daily && hoursData.daily.length > 0) {
        const sp2 = new UITableRow();
        sp2.backgroundColor = new Color("#1a1a1a");
        sp2.height = 8;
        table.addRow(sp2);

        const dailyTitleRow = new UITableRow();
        dailyTitleRow.backgroundColor = new Color("#0a2a0a");
        dailyTitleRow.height = 30;
        const dailyTitle = dailyTitleRow.addText("Daily Breakdown");
        dailyTitle.titleFont = Font.boldSystemFont(13);
        dailyTitle.titleColor = new Color("#4CAF50");
        table.addRow(dailyTitleRow);

        const workDays = hoursData.daily.filter(d => d.hours > 0);
        for (const day of workDays) {
          const date = new Date(day.date);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
          const dayEarnings = day.hours * CONFIG.hourlyRate;

          const dayRow = new UITableRow();
          dayRow.backgroundColor = new Color("#1a1a1a");
          dayRow.height = 32;
          const dayText = dayRow.addText(
            `${dayName}  —  ${day.hours.toFixed(1)} hrs`,
            `$${dayEarnings.toFixed(2)}`
          );
          dayText.titleFont = Font.systemFont(14);
          dayText.titleColor = Color.white();
          dayText.subtitleFont = Font.systemFont(12);
          dayText.subtitleColor = new Color("#FFC107");
          table.addRow(dayRow);
        }
      }
    } else {
      const emptyRow = new UITableRow();
      emptyRow.backgroundColor = new Color("#1a1a1a");
      emptyRow.height = 50;
      const emptyText = emptyRow.addText("No data available", "Check your connection and try again");
      emptyText.titleFont = Font.systemFont(16);
      emptyText.titleColor = new Color("#999999");
      emptyText.subtitleFont = Font.systemFont(13);
      emptyText.subtitleColor = new Color("#666666");
      table.addRow(emptyRow);
    }

    // Subtle approval status for managers
    if (CONFIG.isManager) {
      const approvalNoteRow = new UITableRow();
      approvalNoteRow.backgroundColor = new Color("#1a1a1a");
      approvalNoteRow.height = 30;
      const approvalNote = approvalNoteRow.addText("Nothing to approve");
      approvalNote.titleFont = Font.systemFont(13);
      approvalNote.titleColor = new Color("#4CAF50");
      table.addRow(approvalNoteRow);
    }

    // Settings row
    const settingsRow = new UITableRow();
    settingsRow.backgroundColor = new Color("#1a1a1a");
    settingsRow.height = 44;
    const settingsBtn = settingsRow.addButton("⚙️  Settings");
    settingsBtn.titleFont = Font.systemFont(14);
    settingsBtn.titleColor = new Color("#64B5F6");
    settingsBtn.widthWeight = 100;
    settingsBtn.onTap = async () => {
      const alert = new Alert();
      alert.title = "Settings";
      alert.message = `Logged in as: ${CONFIG.fullName}\nTeam: ${CONFIG.teams?.[0]?.name || "N/A"}\nRole: ${CONFIG.isManager ? "Manager" : "Contributor"}\nRate: $${CONFIG.hourlyRate}/hr\nEnv: ${CONFIG.useQA ? "QA" : "Production"}\nVersion: v${SCRIPT_VERSION}`;
      alert.addAction("Check for Updates");
      alert.addAction("Change Hourly Rate");
      alert.addDestructiveAction("Re-login / Reconfigure");
      alert.addCancelAction("Close");
      const choice = await alert.presentAlert();
      if (choice === 0) {
        const update = await checkForUpdate();
        if (update) {
          const ua = new Alert();
          ua.title = "Update Available";
          ua.message = `v${update.version} is available (you have v${SCRIPT_VERSION}).${update.changelog ? "\n\n" + update.changelog : ""}`;
          ua.addAction("Update Now");
          ua.addCancelAction("Later");
          if (await ua.presentAlert() === 0) {
            const ok = await performUpdate();
            const ra = new Alert();
            ra.title = ok ? "Updated!" : "Update Failed";
            ra.message = ok ? "Restart the script to use the new version." : "Could not download the update. Try again later.";
            ra.addAction("OK");
            await ra.presentAlert();
          }
        } else {
          const na = new Alert();
          na.title = "Up to Date";
          na.message = `You're running the latest version (v${SCRIPT_VERSION}).`;
          na.addAction("OK");
          await na.presentAlert();
        }
      } else if (choice === 1) {
        const rateAlert = new Alert();
        rateAlert.title = "Hourly Rate";
        rateAlert.message = `Current rate: $${CONFIG.hourlyRate}/hr`;
        rateAlert.addTextField("New hourly rate", String(CONFIG.hourlyRate));
        rateAlert.addAction("Save");
        rateAlert.addCancelAction("Cancel");
        const rc = await rateAlert.presentAlert();
        if (rc === 0) {
          const newRate = parseFloat(rateAlert.textFieldValue(0));
          if (newRate > 0) updateConfigField("hourlyRate", newRate);
        }
      } else if (choice === 2) {
        clearConfig();
        await runOnboarding();
      }
    };
    table.addRow(settingsRow);

    // Footer
    const footerRow = new UITableRow();
    footerRow.backgroundColor = new Color("#1a1a1a");
    footerRow.height = 30;
    const footerText = footerRow.addText(
      `v${SCRIPT_VERSION} • Updated: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} • Week of ${getWeekStartDate()}`
    );
    footerText.titleFont = Font.systemFont(11);
    footerText.titleColor = new Color("#666666");
    table.addRow(footerRow);

    return;
  }

  // ── Section: Manual Time ──
  if (manualItems.length > 0) {
    const sectionRow = new UITableRow();
    sectionRow.backgroundColor = new Color("#1a3a1a");
    sectionRow.height = 32;
    const sectionText = sectionRow.addText(`📝 Manual Time (${manualItems.length})`);
    sectionText.titleFont = Font.boldSystemFont(14);
    sectionText.titleColor = new Color("#81C784");
    table.addRow(sectionRow);

    addItemRows(table, manualItems, refreshTable);
  }

  // ── Section: Overtime ──
  if (overtimeItems.length > 0) {
    const sectionRow = new UITableRow();
    sectionRow.backgroundColor = new Color("#3a2a1a");
    sectionRow.height = 32;
    const sectionText = sectionRow.addText(`⏰ Overtime (${overtimeItems.length})`);
    sectionText.titleFont = Font.boldSystemFont(14);
    sectionText.titleColor = new Color("#FFB74D");
    table.addRow(sectionRow);

    addItemRows(table, overtimeItems, refreshTable);
  }

  // ── Bulk Actions ──
  const spacerRow = new UITableRow();
  spacerRow.backgroundColor = new Color("#1a1a1a");
  spacerRow.height = 20;
  table.addRow(spacerRow);

  const bulkRow = new UITableRow();
  bulkRow.backgroundColor = new Color("#252525");
  bulkRow.height = 50;

  const bulkLabel = bulkRow.addText("Bulk Actions");
  bulkLabel.titleFont = Font.boldSystemFont(14);
  bulkLabel.titleColor = Color.white();
  bulkLabel.widthWeight = 40;

  const approveAllBtn = bulkRow.addButton("✅ Approve All");
  approveAllBtn.titleFont = Font.boldSystemFont(13);
  approveAllBtn.titleColor = new Color("#4CAF50");
  approveAllBtn.widthWeight = 30;
  approveAllBtn.onTap = async () => {
    const alert = new Alert();
    alert.title = "Approve All";
    alert.message = `Approve all ${allItems.length} pending requests?`;
    alert.addAction("Approve All");
    alert.addCancelAction("Cancel");

    const choice = await alert.presentAlert();
    if (choice === 0) {
      let approved = 0, failed = 0;
      for (const item of allItems) {
        try {
          const success = await approveItemViaAPI(ACTIVE_TOKEN, item);
          if (success) approved++; else failed++;
        } catch (e) { failed++; }
      }
      const result = new Alert();
      result.title = "Bulk Approve";
      result.message = `${approved} approved${failed > 0 ? `, ${failed} failed` : ""}`;
      result.addAction("OK");
      await result.presentAlert();
      await refreshTable();
    }
  };

  const rejectAllBtn = bulkRow.addButton("Reject All");
  rejectAllBtn.titleFont = Font.boldSystemFont(13);
  rejectAllBtn.titleColor = new Color("#FF5722");
  rejectAllBtn.widthWeight = 30;
  rejectAllBtn.onTap = async () => {
    const alert = new Alert();
    alert.title = "Reject All";
    alert.message = `Reject all ${allItems.length} pending requests? This cannot be undone.`;
    alert.addDestructiveAction("Reject All");
    alert.addCancelAction("Cancel");

    const choice = await alert.presentAlert();
    if (choice === 0) {
      let rejected = 0, failed = 0;
      for (const item of allItems) {
        try {
          const success = await rejectItemViaAPI(ACTIVE_TOKEN, item, "Bulk rejected");
          if (success) rejected++; else failed++;
        } catch (e) { failed++; }
      }
      const result = new Alert();
      result.title = "Bulk Reject";
      result.message = `${rejected} rejected${failed > 0 ? `, ${failed} failed` : ""}`;
      result.addAction("OK");
      await result.presentAlert();
      await refreshTable();
    }
  };

  table.addRow(bulkRow);

  // Settings row
  const settingsRow = new UITableRow();
  settingsRow.backgroundColor = new Color("#1a1a1a");
  settingsRow.height = 44;

  const settingsBtn = settingsRow.addButton("⚙️  Settings");
  settingsBtn.titleFont = Font.systemFont(14);
  settingsBtn.titleColor = new Color("#64B5F6");
  settingsBtn.widthWeight = 100;
  settingsBtn.onTap = async () => {
    const alert = new Alert();
    alert.title = "Settings";
    alert.message = `Logged in as: ${CONFIG.fullName}\nTeam: ${CONFIG.teams?.[0]?.name || "N/A"}\nRole: ${CONFIG.isManager ? "Manager" : "Contributor"}\nRate: $${CONFIG.hourlyRate}/hr\nEnv: ${CONFIG.useQA ? "QA" : "Production"}\nVersion: v${SCRIPT_VERSION}`;
    alert.addAction("Check for Updates");
    alert.addAction("Change Hourly Rate");
    alert.addDestructiveAction("Re-login / Reconfigure");
    alert.addCancelAction("Close");
    const choice = await alert.presentAlert();
    if (choice === 0) {
      const update = await checkForUpdate();
      if (update) {
        const ua = new Alert();
        ua.title = "Update Available";
        ua.message = `v${update.version} is available (you have v${SCRIPT_VERSION}).${update.changelog ? "\n\n" + update.changelog : ""}`;
        ua.addAction("Update Now");
        ua.addCancelAction("Later");
        if (await ua.presentAlert() === 0) {
          const ok = await performUpdate();
          const ra = new Alert();
          ra.title = ok ? "Updated!" : "Update Failed";
          ra.message = ok ? "Restart the script to use the new version." : "Could not download the update. Try again later.";
          ra.addAction("OK");
          await ra.presentAlert();
        }
      } else {
        const na = new Alert();
        na.title = "Up to Date";
        na.message = `You're running the latest version (v${SCRIPT_VERSION}).`;
        na.addAction("OK");
        await na.presentAlert();
      }
    } else if (choice === 1) {
      const rateAlert = new Alert();
      rateAlert.title = "Hourly Rate";
      rateAlert.message = `Current rate: $${CONFIG.hourlyRate}/hr`;
      rateAlert.addTextField("New hourly rate", String(CONFIG.hourlyRate));
      rateAlert.addAction("Save");
      rateAlert.addCancelAction("Cancel");
      const rc = await rateAlert.presentAlert();
      if (rc === 0) {
        const newRate = parseFloat(rateAlert.textFieldValue(0));
        if (newRate > 0) updateConfigField("hourlyRate", newRate);
      }
    } else if (choice === 2) {
      clearConfig();
      await runOnboarding();
    }
  };
  table.addRow(settingsRow);

  // Footer
  const footerRow = new UITableRow();
  footerRow.backgroundColor = new Color("#1a1a1a");
  footerRow.height = 30;
  const footerText = footerRow.addText(
    `v${SCRIPT_VERSION} • Updated: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} • Week of ${getWeekStartDate()}`
  );
  footerText.titleFont = Font.systemFont(11);
  footerText.titleColor = new Color("#666666");
  table.addRow(footerRow);
}

// Helper: add item rows to UITable
function addItemRows(table, items, refreshTable) {
  for (const item of items) {
    // Row 1: Info header
    const labelRow = new UITableRow();
    labelRow.backgroundColor = new Color("#252525");
    labelRow.height = 28;

    let labelStr;
    if (item.category === "OVERTIME") {
      labelStr = `⏰ ${item.hours}h overtime • $${item.cost} • ${item.totalHoursWorked}h worked this week`;
    } else {
      const typeIcon = item.type === "WEB" ? "💻" : "📱";
      const dateStr = new Date(item.startDateTime).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric'
      });
      labelStr = `${typeIcon} ${dateStr} • ${item.hours}h • ${item.timecardIds.length} timecards`;
    }

    const labelText = labelRow.addText(labelStr);
    labelText.titleFont = Font.mediumSystemFont(12);
    labelText.titleColor = new Color("#999999");
    table.addRow(labelRow);

    // Row 2: User info
    const infoRow = new UITableRow();
    infoRow.backgroundColor = new Color("#1a1a1a");
    infoRow.height = 50;

    const infoText = infoRow.addText(
      `${item.fullName}`,
      `${item.jobTitle} • "${item.description}"`
    );
    infoText.titleFont = Font.boldSystemFont(16);
    infoText.titleColor = Color.white();
    infoText.subtitleFont = Font.systemFont(12);
    infoText.subtitleColor = new Color("#999999");

    table.addRow(infoRow);

    // Row 3: Action buttons
    const actionRow = new UITableRow();
    actionRow.backgroundColor = new Color("#1a1a1a");
    actionRow.height = 44;

    const spacer = actionRow.addText("");
    spacer.widthWeight = 30;

    const approveBtn = actionRow.addButton("Approve");
    approveBtn.titleFont = Font.boldSystemFont(15);
    approveBtn.titleColor = new Color("#4CAF50");
    approveBtn.widthWeight = 35;
    approveBtn.onTap = async () => {
      try {
        const success = await approveItemViaAPI(ACTIVE_TOKEN, item);
        if (success) {
          const ok = new Alert();
          ok.title = "Approved";
          ok.message = `${item.hours}h from ${item.fullName} approved.`;
          ok.addAction("OK");
          await ok.presentAlert();
        } else {
          const err = new Alert();
          err.title = "Failed";
          err.message = "Approval failed. Try again.";
          err.addAction("OK");
          await err.presentAlert();
        }
      } catch (e) {
        const err = new Alert();
        err.title = "Error";
        err.message = e.message;
        err.addAction("OK");
        await err.presentAlert();
      }
      await refreshTable();
    };

    const rejectBtn = actionRow.addButton("Reject");
    rejectBtn.titleFont = Font.boldSystemFont(15);
    rejectBtn.titleColor = new Color("#FF5722");
    rejectBtn.widthWeight = 35;
    rejectBtn.onTap = async () => {
      const alert = new Alert();
      alert.title = `Reject ${item.category === "OVERTIME" ? "Overtime" : "Manual Time"}`;
      alert.message = `Reject ${item.hours}h from ${item.fullName}?`;
      if (item.category === "OVERTIME") {
        alert.addTextField("Reason (required for overtime)", "");
      }
      alert.addAction("Reject");
      alert.addCancelAction("Cancel");

      const choice = await alert.presentAlert();
      if (choice === 0) {
        const reason = item.category === "OVERTIME" ? alert.textFieldValue(0) || "Rejected" : "Rejected";
        try {
          const success = await rejectItemViaAPI(ACTIVE_TOKEN, item, reason);
          if (success) {
            const ok = new Alert();
            ok.title = "Rejected";
            ok.message = `${item.hours}h from ${item.fullName} rejected.`;
            ok.addAction("OK");
            await ok.presentAlert();
          } else {
            const err = new Alert();
            err.title = "Failed";
            err.message = "Rejection failed. Try again.";
            err.addAction("OK");
            await err.presentAlert();
          }
        } catch (e) {
          const err = new Alert();
          err.title = "Error";
          err.message = e.message;
          err.addAction("OK");
          await err.presentAlert();
        }
        await refreshTable();
      }
    };

    table.addRow(actionRow);
  }
}

// ─── Home Screen Widget ──────────────────────────────────────

async function createWidget(allItems, logo = null, error = null, hoursData = null, cachedAt = null) {
  const widget = new ListWidget();
  const urgency = getUrgencyLevel();
  const hasItems = allItems && allItems.length > 0;

  // Background changes with urgency when items are pending
  if (hasItems && urgency === "critical") {
    widget.backgroundColor = new Color("#3a0a0a"); // Dark red
  } else if (hasItems && urgency === "high") {
    widget.backgroundColor = new Color("#2a1a0a"); // Dark orange
  } else {
    widget.backgroundColor = new Color("#1a1a1a"); // Normal dark
  }

  const widgetFamily = config.widgetFamily || "medium";

  // ── Lock Screen / StandBy accessories (compact) ──
  if (widgetFamily === "accessoryRectangular" || widgetFamily === "accessoryCircular" || widgetFamily === "accessoryInline") {
    if (error) {
      widget.addText("Error");
      return widget;
    }

    widget.setPadding(6, 6, 6, 6);

    const titleStack = widget.addStack();
    titleStack.layoutHorizontally();
    titleStack.centerAlignContent();

    if (logo) {
      const logoImage = titleStack.addImage(logo);
      logoImage.imageSize = new Size(12, 12);
      titleStack.addSpacer(3);
    }

    const titleText = titleStack.addText(CONFIG.useQA ? "WS [QA]" : "WS");
    titleText.font = Font.boldSystemFont(10);
    titleText.textColor = CONFIG.useQA ? new Color("#FF9800") : Color.white();

    widget.addSpacer(1);

    if (hoursData) {
      const hoursText = widget.addText(`${hoursData.total.toFixed(1)}h`);
      hoursText.font = Font.boldSystemFont(18);
      hoursText.textColor = new Color("#4CAF50");

      const earningsText = widget.addText(`$${hoursData.weeklyEarnings.toFixed(0)}`);
      earningsText.font = Font.boldSystemFont(16);
      earningsText.textColor = new Color("#FFC107");

      widget.addSpacer(2);

      if (hoursData.hoursRemaining > 0) {
        const remainingText = widget.addText(`${hoursData.hoursRemaining.toFixed(1)}h left`);
        remainingText.font = Font.systemFont(9);
        remainingText.textColor = new Color("#FF9800");
      }
    }

    if (hasItems) {
      const itemText = widget.addText(`${allItems.length} pending`);
      itemText.font = Font.systemFont(9);
      itemText.textColor = new Color("#FFC107");
    }

    return widget;
  }
  const dimensions = getWidgetDimensions();
  const widgetWidth = widgetFamily === "small" ? dimensions.small : dimensions.medium;

  // Responsive sizing (same approach as hours widget)
  let scaleFactor, titleSize, textSize, smallTextSize, padding, spacing, logoSize;

  if (widgetFamily === "small") {
    scaleFactor = widgetWidth / 158;
    titleSize = Math.round(12 * scaleFactor);
    textSize = Math.round(10 * scaleFactor);
    smallTextSize = Math.round(8 * scaleFactor);
    padding = Math.round(12 * scaleFactor);
    spacing = Math.round(3 * scaleFactor);
    logoSize = 10;
  } else if (widgetFamily === "medium") {
    scaleFactor = widgetWidth / 338;
    titleSize = Math.round(14 * scaleFactor);
    textSize = Math.round(12 * scaleFactor);
    smallTextSize = Math.round(10 * scaleFactor);
    padding = Math.round(14 * scaleFactor);
    spacing = Math.round(4 * scaleFactor);
    logoSize = 14;
  } else {
    const widgetHeight = dimensions.large;
    scaleFactor = widgetHeight / 354;
    titleSize = Math.round(18 * scaleFactor);
    textSize = Math.round(15 * scaleFactor);
    smallTextSize = Math.round(12 * scaleFactor);
    padding = Math.round(16 * scaleFactor);
    spacing = Math.round(5 * scaleFactor);
    logoSize = 18;
  }

  widget.setPadding(padding, padding, padding, padding);

  // Title with logo
  const titleStack = widget.addStack();
  titleStack.layoutHorizontally();
  titleStack.centerAlignContent();

  if (logo) {
    const logoImage = titleStack.addImage(logo);
    logoImage.imageSize = new Size(logoSize, logoSize);
    titleStack.addSpacer(4);
  }

  const titleLabel = (CONFIG.isManager && hasItems) ? "Time Approval" : "Crossover";
  const titleText = titleStack.addText(titleLabel);
  titleText.font = Font.boldSystemFont(titleSize);
  titleText.textColor = Color.white();

  // QA environment badge — always visible so users know which server
  if (CONFIG.useQA) {
    titleStack.addSpacer(6);
    const qaBadge = titleStack.addText("QA");
    qaBadge.font = Font.boldSystemFont(Math.max(smallTextSize, 8));
    qaBadge.textColor = new Color("#000000");
    qaBadge.backgroundColor = new Color("#FF9800");
  }

  widget.addSpacer(spacing);

  // Error
  if (error) {
    const errorText = widget.addText(`Error: ${error}`);
    errorText.font = Font.systemFont(textSize);
    errorText.textColor = Color.red();
    return widget;
  }

  // No pending items → show hours tracking mode
  if (!allItems || allItems.length === 0) {
    if (hoursData && hoursData.total !== undefined) {
      // ── Hours Tracking Mode ──
      if (widgetFamily === "small") {
        // Small: hours total + earnings + hours remaining
        const hoursText = widget.addText(`${hoursData.total.toFixed(1)}h`);
        hoursText.font = Font.boldSystemFont(textSize + 12);
        hoursText.textColor = new Color("#4CAF50");

        widget.addSpacer(2);

        const periodText = widget.addText("This Week");
        periodText.font = Font.systemFont(smallTextSize);
        periodText.textColor = new Color("#999999");

        widget.addSpacer(spacing);

        const earningsText = widget.addText(`$${Math.round(hoursData.weeklyEarnings)}`);
        earningsText.font = Font.boldSystemFont(textSize + 6);
        earningsText.textColor = new Color("#FFC107");

        widget.addSpacer(spacing);

        if (hoursData.hoursRemaining > 0) {
          const remainingText = widget.addText(`${hoursData.hoursRemaining.toFixed(1)}h left`);
          remainingText.font = Font.systemFont(smallTextSize);
          remainingText.textColor = new Color("#FF9800");
        } else {
          const goalText = widget.addText("40h goal reached!");
          goalText.font = Font.systemFont(smallTextSize);
          goalText.textColor = new Color("#4CAF50");
        }

      } else if (widgetFamily === "medium") {
        // Medium: two-column layout (hours left, earnings right) + deadline
        const mainStack = widget.addStack();
        mainStack.layoutHorizontally();
        mainStack.centerAlignContent();

        const leftStack = mainStack.addStack();
        leftStack.layoutVertically();

        const hoursText = leftStack.addText(`${hoursData.total.toFixed(1)}h`);
        hoursText.font = Font.boldSystemFont(textSize + 14);
        hoursText.textColor = new Color("#4CAF50");

        const periodText = leftStack.addText("This Week");
        periodText.font = Font.systemFont(smallTextSize);
        periodText.textColor = new Color("#999999");

        mainStack.addSpacer();

        const rightStack = mainStack.addStack();
        rightStack.layoutVertically();

        const earningsText = rightStack.addText(`$${Math.round(hoursData.weeklyEarnings)}`);
        earningsText.font = Font.boldSystemFont(textSize + 8);
        earningsText.textColor = new Color("#FFC107");

        const earningsLabel = rightStack.addText("Earned");
        earningsLabel.font = Font.systemFont(smallTextSize);
        earningsLabel.textColor = new Color("#999999");

        widget.addSpacer(spacing);

        if (hoursData.hoursRemaining > 0) {
          const infoStack = widget.addStack();
          infoStack.layoutHorizontally();

          const remainingText = infoStack.addText(`${hoursData.hoursRemaining.toFixed(1)}h left to 40`);
          remainingText.font = Font.systemFont(smallTextSize);
          remainingText.textColor = new Color("#FF9800");

          infoStack.addSpacer();

          const deadlineText = infoStack.addText(`${formatTimeRemaining(hoursData.timeRemaining)} deadline`);
          deadlineText.font = Font.systemFont(smallTextSize);
          deadlineText.textColor = new Color("#FF5722");
        } else {
          const goalText = widget.addText("40h goal reached!");
          goalText.font = Font.systemFont(textSize);
          goalText.textColor = new Color("#4CAF50");
        }

        if (hoursData.today > 0) {
          widget.addSpacer(2);
          const todayText = widget.addText(`Today: ${hoursData.today.toFixed(1)}h ($${Math.round(hoursData.todayEarnings)})`);
          todayText.font = Font.systemFont(smallTextSize);
          todayText.textColor = new Color("#64B5F6");
        }

      } else {
        // Large: full layout with daily bar chart
        const hoursText = widget.addText(`${hoursData.total.toFixed(1)} hrs`);
        hoursText.font = Font.boldSystemFont(textSize + 18);
        hoursText.textColor = new Color("#4CAF50");

        widget.addSpacer(spacing / 2);

        const periodText = widget.addText("This Week");
        periodText.font = Font.systemFont(textSize);
        periodText.textColor = new Color("#999999");

        widget.addSpacer(spacing);

        const earningsText = widget.addText(`$${hoursData.weeklyEarnings.toFixed(2)}`);
        earningsText.font = Font.boldSystemFont(textSize + 12);
        earningsText.textColor = new Color("#FFC107");

        widget.addSpacer(spacing);

        if (hoursData.hoursRemaining > 0) {
          const remainingText = widget.addText(`${hoursData.hoursRemaining.toFixed(1)} hrs left to 40`);
          remainingText.font = Font.systemFont(textSize);
          remainingText.textColor = new Color("#FF9800");

          widget.addSpacer(spacing / 3);

          const deadlineText = widget.addText(`${formatTimeRemaining(hoursData.timeRemaining)} until deadline`);
          deadlineText.font = Font.systemFont(smallTextSize);
          deadlineText.textColor = new Color("#FF5722");
        } else {
          const goalText = widget.addText("40 hour goal reached!");
          goalText.font = Font.systemFont(textSize);
          goalText.textColor = new Color("#4CAF50");
        }

        widget.addSpacer(spacing);

        if (hoursData.today > 0) {
          const todayText = widget.addText(`Today: ${hoursData.today.toFixed(1)} hrs ($${hoursData.todayEarnings.toFixed(2)})`);
          todayText.font = Font.systemFont(textSize);
          todayText.textColor = new Color("#64B5F6");
        }

        if (hoursData.average > 0) {
          widget.addSpacer(spacing / 2);
          const avgEarnings = hoursData.average * CONFIG.hourlyRate;
          const avgText = widget.addText(`Avg: ${hoursData.average.toFixed(1)} hrs/day ($${avgEarnings.toFixed(2)})`);
          avgText.font = Font.systemFont(smallTextSize);
          avgText.textColor = new Color("#999999");
        }

        // Daily bar chart
        if (hoursData.daily && hoursData.daily.length > 0) {
          widget.addSpacer(3);

          const chartTitle = widget.addText("Daily");
          chartTitle.font = Font.boldSystemFont(smallTextSize - 1);
          chartTitle.textColor = new Color("#999999");

          widget.addSpacer(2);

          const workDays = hoursData.daily.filter(d => d.hours > 0);
          const maxHours = Math.max(...workDays.map(d => d.hours), 8);

          workDays.forEach(day => {
            const date = new Date(day.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });

            const rowStack = widget.addStack();
            rowStack.layoutHorizontally();
            rowStack.centerAlignContent();

            const dayLabel = rowStack.addText(dayName);
            dayLabel.font = Font.systemFont(smallTextSize - 3);
            dayLabel.textColor = Color.white();
            dayLabel.size = new Size(35, 0);

            rowStack.addSpacer(4);

            const barWidth = (day.hours / maxHours) * 100;
            const barStack = rowStack.addStack();
            barStack.size = new Size(barWidth, 8);
            barStack.backgroundColor = new Color("#4CAF50");
            barStack.cornerRadius = 2;

            rowStack.addSpacer(4);

            const hoursLabel = rowStack.addText(`${day.hours.toFixed(1)}h`);
            hoursLabel.font = Font.systemFont(smallTextSize - 3);
            hoursLabel.textColor = new Color("#4CAF50");

            widget.addSpacer(1);
          });
        }
      }

      widget.addSpacer();

      if (!CONFIG.isManager) {
        const checkText = widget.addText("Hours tracking mode");
        checkText.font = Font.systemFont(smallTextSize - 1);
        checkText.textColor = new Color("#64B5F6");
      } else {
        const checkText = widget.addText("No pending approvals");
        checkText.font = Font.systemFont(smallTextSize - 1);
        checkText.textColor = new Color("#4CAF50");
      }

      widget.addSpacer(2);

      const tsLabel = cachedAt
        ? `Cached: ${new Date(cachedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
        : `Updated: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      const timeText = widget.addText(tsLabel);
      timeText.font = Font.systemFont(smallTextSize - 1);
      timeText.textColor = new Color(cachedAt ? "#FFA726" : "#666666");

    } else {
      // No hours data available — simple empty state
      const noDataText = widget.addText(CONFIG.isManager ? "No pending approvals" : "Hours tracking");
      noDataText.font = Font.systemFont(textSize);
      noDataText.textColor = new Color("#4CAF50");

      widget.addSpacer();

      const tsLabel2 = cachedAt
        ? `Cached: ${new Date(cachedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
        : `Updated: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      const timeText = widget.addText(tsLabel2);
      timeText.font = Font.systemFont(smallTextSize);
      timeText.textColor = new Color(cachedAt ? "#FFA726" : "#666666");
    }

    // Tap opens interactive view even in hours mode
    const scriptUrl = URLScheme.forRunningScript();
    widget.url = scriptUrl;

    return widget;
  }

  // Counts
  const manualCount = allItems.filter(i => i.category === "MANUAL").length;
  const overtimeCount = allItems.filter(i => i.category === "OVERTIME").length;

  const countParts = [];
  if (manualCount > 0) countParts.push(`${manualCount} manual`);
  if (overtimeCount > 0) countParts.push(`${overtimeCount} overtime`);

  const countText = widget.addText(countParts.join(" + "));
  countText.font = Font.boldSystemFont(textSize + 4);
  countText.textColor = new Color("#FFC107");

  // Urgency countdown banner
  if (urgency !== "none" && urgency !== "expired") {
    widget.addSpacer(spacing / 2);

    const deadline = getSundayMidnightGMT();
    const countdown = formatCountdown(deadline - new Date());

    const urgencyStack = widget.addStack();
    urgencyStack.layoutHorizontally();
    urgencyStack.centerAlignContent();

    if (urgency === "critical") {
      urgencyStack.backgroundColor = new Color("#b71c1c");
    } else if (urgency === "high") {
      urgencyStack.backgroundColor = new Color("#e65100");
    } else {
      urgencyStack.backgroundColor = new Color("#4a3000");
    }
    urgencyStack.cornerRadius = 4;
    urgencyStack.setPadding(3, 6, 3, 6);

    let urgencyIcon, urgencyLabel;
    if (urgency === "critical") {
      urgencyIcon = "🚨";
      urgencyLabel = `${countdown} LEFT!`;
    } else if (urgency === "high") {
      urgencyIcon = "🔴";
      urgencyLabel = `${countdown} left`;
    } else {
      urgencyIcon = "⚠️";
      urgencyLabel = `${countdown} left`;
    }

    const urgencyText = urgencyStack.addText(`${urgencyIcon} ${urgencyLabel}`);
    urgencyText.font = Font.boldSystemFont(smallTextSize);
    urgencyText.textColor = Color.white();
  }

  widget.addSpacer(spacing);

  // List items — medium gets fewer to avoid clipping
  const maxItems = widgetFamily === "large" ? 5 : (widgetFamily === "medium" ? 2 : 1);
  const itemsToShow = allItems.slice(0, maxItems);

  for (const item of itemsToShow) {
    const itemStack = widget.addStack();
    itemStack.layoutVertically();
    itemStack.backgroundColor = new Color("#2a2a2a");
    itemStack.cornerRadius = 5;
    itemStack.setPadding(4, 8, 4, 8);

    const nameRow = itemStack.addStack();
    nameRow.layoutHorizontally();
    nameRow.centerAlignContent();

    const categoryIcon = item.category === "OVERTIME" ? "⏰" : "📝";
    const nameText = nameRow.addText(`${categoryIcon} ${item.fullName}`);
    nameText.font = Font.boldSystemFont(smallTextSize);
    nameText.textColor = Color.white();
    nameText.lineLimit = 1;

    nameRow.addSpacer();

    const hoursTag = nameRow.addText(`${item.hours}h`);
    hoursTag.font = Font.boldSystemFont(smallTextSize);
    hoursTag.textColor = new Color("#FFC107");

    widget.addSpacer(spacing / 2);
  }

  if (allItems.length > maxItems) {
    const moreText = widget.addText(`+${allItems.length - maxItems} more`);
    moreText.font = Font.systemFont(smallTextSize - 1);
    moreText.textColor = new Color("#666666");
  }

  widget.addSpacer();

  // Bottom line: hours summary + updated time
  const scriptUrl = URLScheme.forRunningScript();
  widget.url = scriptUrl;

  const tsStr = cachedAt
    ? new Date(cachedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const tsPrefix = cachedAt ? "Cached" : "Updated";

  if (hoursData && hoursData.total !== undefined) {
    const footerText = widget.addText(`${hoursData.total.toFixed(1)}h worked • $${Math.round(hoursData.weeklyEarnings)} • ${tsPrefix}: ${tsStr}`);
    footerText.font = Font.systemFont(smallTextSize - 1);
    footerText.textColor = new Color(cachedAt ? "#FFA726" : "#64B5F6");
  } else {
    const timeText = widget.addText(`Tap to review • ${tsPrefix}: ${tsStr}`);
    timeText.font = Font.systemFont(smallTextSize - 1);
    timeText.textColor = new Color(cachedAt ? "#FFA726" : "#666666");
  }

  return widget;
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  try {
    // ── Load or run onboarding ──
    const cfg = await getConfig();
    if (!cfg) {
      return null;
    }
    initUrls(cfg);

    const widgetFamily = config.widgetFamily || "medium";
    const useSmallLogo = (widgetFamily === "small" ||
                          widgetFamily === "accessoryRectangular" ||
                          widgetFamily === "accessoryCircular" ||
                          widgetFamily === "accessoryInline");

    // ── Authenticate ──
    const token = await getAuthToken();
    if (!token) {
      if (config.runsInWidget) {
        // Try cache before showing error
        const cached = loadCache();
        if (cached) {
          const logo = await loadLogo(useSmallLogo);
          return await createWidget([], logo, null, cached.hoursData, cached.cachedAt);
        }
        const logo = await loadLogo(useSmallLogo);
        return await createWidget(null, logo, "Setup needed — tap to configure");
      }
      // Auth failed — re-run onboarding
      clearConfig();
      const retryCfg = await runOnboarding();
      if (!retryCfg) return null;
      initUrls(retryCfg);
      const retryToken = await getAuthToken();
      if (!retryToken) return null;
    }

    const activeToken = token || await getAuthToken();
    ACTIVE_TOKEN = activeToken;

    // ── Weekly role/rate refresh (non-blocking, skips if already checked) ──
    await weeklyRefresh(activeToken);

    // ── Fetch data (role-aware) ──
    const data = await fetchApprovalData(activeToken);
    let { allItems, hoursData } = data;

    if (CONFIG.debugMode) {
      if (CONFIG.isManager) console.log(`📋 Total: ${allItems.length} items`);
      if (hoursData) console.log(`⏱️ Hours: ${hoursData.total.toFixed(1)}h / $${hoursData.weeklyEarnings.toFixed(0)}`);
    }

    // Notifications only for managers
    if (CONFIG.isManager) {
      await checkAndNotify(allItems);
    }

    // ── Failover: if no hours data, try cache ──
    if (!hoursData) {
      const cached = loadCache();
      if (cached) {
        if (config.runsInWidget) {
          const logo = await loadLogo(useSmallLogo);
          return await createWidget([], logo, null, cached.hoursData, cached.cachedAt);
        }
        hoursData = cached.hoursData;
      }
    } else {
      // Cache successful data
      saveCache(hoursData, allItems.length);
    }

    // Widget mode → show summary widget with logo
    if (config.runsInWidget) {
      const logo = await loadLogo(useSmallLogo);
      return await createWidget(allItems, logo, null, hoursData);
    }

    // In-app mode → check for updates, then show interactive UITable
    const update = await checkForUpdate();
    if (update) {
      const ua = new Alert();
      ua.title = "Update Available";
      ua.message = `v${update.version} is available (you have v${SCRIPT_VERSION}).${update.changelog ? "\n\n" + update.changelog : ""}`;
      ua.addAction("Update Now");
      ua.addCancelAction("Later");
      if (await ua.presentAlert() === 0) {
        const ok = await performUpdate();
        const ra = new Alert();
        ra.title = ok ? "Updated!" : "Update Failed";
        ra.message = ok ? "Restart the script to use the new version." : "Could not download the update. Try again later.";
        ra.addAction("OK");
        await ra.presentAlert();
        if (ok) return null;
      }
    }

    await showInteractiveView(allItems, hoursData);
    return null;

  } catch (error) {
    console.error("❌ Error:", error);
    // Try cache before showing error
    const cached = loadCache();
    if (cached) {
      if (config.runsInWidget) {
        const logo = await loadLogo(true);
        return await createWidget([], logo, null, cached.hoursData, cached.cachedAt);
      }
    }
    if (config.runsInWidget) {
      return await createWidget(null, null, error.message);
    }
    const alert = new Alert();
    alert.title = "Error";
    alert.message = error.message;
    alert.addAction("OK");
    await alert.presentAlert();
    return null;
  }
}

// ─── Run ─────────────────────────────────────────────────────

const widget = await main();

if (widget && config.runsInWidget) {
  Script.setWidget(widget);
} else if (widget) {
  widget.presentMedium();
}

Script.complete();
