// Crossover Hours Widget
// First run: onboarding flow auto-configures everything
// Shared config with Time Approval Widget — setup once, both work

// ─── Shared Config System ────────────────────────────────────

const CONFIG_FILE = "crossover-config.json";
const CACHE_FILE = "crossover-hours-cache.json";
const KEY_USERNAME = "crossover_username";
const KEY_PASSWORD = "crossover_password";

function loadConfig() {
  let username, password;
  try {
    username = Keychain.get(KEY_USERNAME);
    password = Keychain.get(KEY_PASSWORD);
  } catch (e) { return null; }
  if (!username || !password) return null;

  const fm = FileManager.local();
  const path = fm.joinPath(fm.documentsDirectory(), CONFIG_FILE);
  if (!fm.fileExists(path)) return null;

  try {
    const settings = JSON.parse(fm.readString(path));
    if (!settings.setupComplete) return null;
    return { username, password, ...settings };
  } catch (e) { return null; }
}

function saveConfig(username, password, settings) {
  Keychain.set(KEY_USERNAME, username);
  Keychain.set(KEY_PASSWORD, password);
  const fm = FileManager.local();
  const path = fm.joinPath(fm.documentsDirectory(), CONFIG_FILE);
  fm.writeString(path, JSON.stringify({ ...settings, setupComplete: true, setupDate: new Date().toISOString() }, null, 2));
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
  try { Keychain.remove(KEY_USERNAME); } catch (e) {}
  try { Keychain.remove(KEY_PASSWORD); } catch (e) {}
  const fm = FileManager.local();
  const path = fm.joinPath(fm.documentsDirectory(), CONFIG_FILE);
  if (fm.fileExists(path)) fm.remove(path);
}

function saveCache(hoursData) {
  try {
    const fm = FileManager.local();
    const path = fm.joinPath(fm.documentsDirectory(), CACHE_FILE);
    fm.writeString(path, JSON.stringify({
      hoursData,
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
    // Restore deadline as Date object
    if (data.hoursData?.deadline) data.hoursData.deadline = new Date(data.hoursData.deadline);
    return data;
  } catch (e) {
    return null;
  }
}

async function runOnboarding() {
  const envAlert = new Alert();
  envAlert.title = "Crossover Setup";
  envAlert.message = "Which environment?";
  envAlert.addAction("Production");
  envAlert.addAction("QA (Testing)");
  envAlert.addCancelAction("Cancel");
  const envChoice = await envAlert.presentAlert();
  if (envChoice === -1) return null;
  const useQA = envChoice === 1;

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
    const err = new Alert(); err.title = "Error"; err.message = "Email and password are required."; err.addAction("OK"); await err.presentAlert();
    return null;
  }

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
    const err = new Alert(); err.title = "Login Failed"; err.message = "Check your credentials."; err.addAction("OK"); await err.presentAlert();
    return null;
  }

  let fullName = "Unknown";
  try {
    const profileReq = new Request(`${apiBase}/api/v3/users/current`);
    profileReq.headers = { "x-auth-token": token };
    const profile = await profileReq.loadJSON();
    fullName = profile.fullName || profile.printableName || "Unknown";
  } catch (e) {}

  let teams = [];
  try {
    const teamsReq = new Request(`${apiBase}/api/v2/teams`);
    teamsReq.headers = { "x-auth-token": token };
    const teamsResp = await teamsReq.loadJSON();
    if (Array.isArray(teamsResp)) {
      teams = teamsResp.map(t => ({ id: t.id, name: t.name, companyName: t.company?.name || "", managerId: t.teamOwner?.userId || 0 }));
    }
  } catch (e) {}

  // Auto-select first team (no user prompt needed)
  let primaryTeam = teams.length > 0 ? teams[0] : null;
  let managerId = primaryTeam?.managerId || userId;

  // Auto-detect hourly rate from payments API
  let hourlyRate = 0;
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

  if (hourlyRate === 0) {
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

  const settings = { userId, fullName, managerId, primaryTeamId: primaryTeam?.id || 0, teams, hourlyRate, useQA, debugMode: false };
  saveConfig(username, password, settings);

  const ok = new Alert();
  ok.title = "Setup Complete!";
  ok.message = `Welcome, ${fullName}!\n\nUser ID: ${userId}\nTeam: ${primaryTeam?.name || "N/A"}\nRate: $${hourlyRate}/hr\nEnv: ${useQA ? "QA" : "Production"}\n\nYou can change your rate anytime in Settings.`;
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

let CONFIG = null;
let TOKEN_URL = "";
let TIMESHEET_URL = "";

function initUrls(cfg) {
  CONFIG = cfg;
  const apiBase = cfg.useQA ? "https://api-qa.crossover.com" : "https://api.crossover.com";
  TOKEN_URL = `${apiBase}/api/v3/token`;
  TIMESHEET_URL = `${apiBase}/api/timetracking/timesheets`;
}

// Logo URLs (Google Drive direct links)
const LOGO_URL_LARGE = "https://drive.google.com/uc?export=view&id=1eL0cjw1tqc_tdYxuD8G9EnEKBmbcd0A7"; // 512x512
const LOGO_URL_SMALL = "https://drive.google.com/uc?export=view&id=1ZSYu1zXxl8xpLJVfOPUOxjDr8pS3tupv"; // 128x128

// Get device-specific widget dimensions
function getWidgetDimensions() {
  const phone = Device.screenSize();
  const height = phone.height;
  const width = phone.width;

  // iPhone dimensions database (in points)
  const devices = {
    // iPhone 16 Pro Max, 15 Pro Max, 15 Plus, 14 Pro Max, 14 Plus
    932: { name: "iPhone 16 Pro Max / 15 Pro Max / 15 Plus", small: 170, medium: 364, large: 382 },
    // iPhone 16 Pro, 15 Pro, 14 Pro, 13 Pro, 12 Pro
    852: { name: "iPhone 16 Pro / 15 Pro / 14 Pro", small: 158, medium: 338, large: 354 },
    // iPhone 16, 15, 14, 13, 12
    844: { name: "iPhone 16 / 15 / 14 / 13 / 12", small: 158, medium: 338, large: 354 },
    // iPhone 11 Pro Max, XS Max, 11
    896: { name: "iPhone 11 Pro Max / XS Max / 11", small: 169, medium: 360, large: 379 },
    // iPhone X, XS, 11 Pro, 12 mini, 13 mini
    812: { name: "iPhone X / XS / 11 Pro / mini", small: 155, medium: 329, large: 345 },
    // iPhone 6/7/8 Plus
    736: { name: "iPhone 6/7/8 Plus", small: 157, medium: 348, large: 357 },
    // iPhone 6/7/8, SE 2nd/3rd gen
    667: { name: "iPhone 6/7/8 / SE", small: 148, medium: 321, large: 324 },
    // iPhone SE 1st gen
    568: { name: "iPhone SE 1st gen", small: 141, medium: 292, large: 311 }
  };

  // Find closest match
  const deviceInfo = devices[height] || devices[844];

  // Log device info if debug mode is enabled
  if (CONFIG.debugMode) {
    console.log(`📱 Device: ${deviceInfo.name}`);
    console.log(`📏 Screen: ${width}×${height}pt`);
    console.log(`📦 Widget sizes - Small: ${deviceInfo.small}pt, Medium: ${deviceInfo.medium}pt, Large: ${deviceInfo.large}pt`);
  }

  return deviceInfo;
}

// Load logo image
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

// Authenticate and get token
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
    return response.token || response.access_token || response;
  } catch (error) {
    console.error("Authentication failed:", error);
    clearConfig();
    return null;
  }
}

// Get timesheet data
async function getTimesheetData(token) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  const url = `${TIMESHEET_URL}?date=${dateStr}&managerId=${CONFIG.managerId}&period=WEEK&teamId=${CONFIG.primaryTeamId}&userId=${CONFIG.userId}`;

  const request = new Request(url);
  request.headers = {
    "x-auth-token": token
  };

  try {
    const response = await request.loadJSON();
    return response;
  } catch (error) {
    console.error("Failed to fetch timesheet:", error);
    return null;
  }
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
  const currentDay = now.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
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

// Create widget
async function createWidget(hoursData, logo = null, error = null, cachedAt = null) {
  const widget = new ListWidget();
  widget.backgroundColor = new Color("#1a1a1a");

  // Detect widget size and adjust accordingly
  const widgetFamily = config.widgetFamily || "large";

  // Handle StandBy/Lock Screen accessories (compact version - no charts)
  if (widgetFamily === "accessoryRectangular" || widgetFamily === "accessoryCircular" || widgetFamily === "accessoryInline") {
    if (error) {
      widget.addText("Error");
      return widget;
    }

    widget.setPadding(6, 6, 6, 6);

    // Title with logo
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

    // Hours
    const hoursText = widget.addText(`${hoursData.total.toFixed(1)}h`);
    hoursText.font = Font.boldSystemFont(18);
    hoursText.textColor = new Color("#4CAF50");

    // Earnings
    const earningsText = widget.addText(`$${hoursData.weeklyEarnings.toFixed(0)}`);
    earningsText.font = Font.boldSystemFont(16);
    earningsText.textColor = new Color("#FFC107");

    widget.addSpacer(2);

    // Hours remaining and deadline
    if (hoursData.hoursRemaining > 0) {
      const remainingText = widget.addText(`${hoursData.hoursRemaining.toFixed(1)}h left`);
      remainingText.font = Font.systemFont(9);
      remainingText.textColor = new Color("#FF9800");

      const totalHoursUntilDeadline = Math.floor(hoursData.timeRemaining / (1000 * 60 * 60));
      const deadlineText = widget.addText(`${totalHoursUntilDeadline}h deadline`);
      deadlineText.font = Font.systemFont(8);
      deadlineText.textColor = new Color("#FF5722");
    }

    widget.addSpacer(1);

    // Today's hours
    if (hoursData.today > 0) {
      const todayText = widget.addText(`Today: ${hoursData.today.toFixed(1)}h`);
      todayText.font = Font.systemFont(8);
      todayText.textColor = new Color("#64B5F6");
    }

    return widget;
  }

  // Get device-specific dimensions for responsive sizing
  const dimensions = getWidgetDimensions();
  const widgetWidth = widgetFamily === "small" ? dimensions.small : dimensions.medium;
  const widgetHeight = widgetFamily === "large" ? dimensions.large : dimensions.small;

  // Calculate responsive font sizes based on widget width
  const scaleFactor = widgetWidth / 158; // Normalized to iPhone 16 Pro small widget

  if (CONFIG.debugMode) {
    console.log(`🎨 Widget family: ${widgetFamily}`);
    console.log(`📐 Widget dimensions: ${widgetWidth}×${widgetHeight}pt`);
    console.log(`🔢 Scale factor: ${scaleFactor.toFixed(2)}x`);
  }

  let titleSize, hoursSize, earningsSize, textSize, smallTextSize, padding, spacing;

  // SMALL WIDGET - Very compact, essential info only
  if (widgetFamily === "small") {
    titleSize = Math.round(12 * scaleFactor);
    hoursSize = Math.round(28 * scaleFactor);
    earningsSize = Math.round(20 * scaleFactor);
    textSize = Math.round(10 * scaleFactor);
    smallTextSize = Math.round(8 * scaleFactor);
    padding = Math.round(12 * scaleFactor);
    spacing = Math.round(3 * scaleFactor);

    widget.setPadding(padding, padding, padding, padding);

    // Title with logo
    const titleStack = widget.addStack();
    titleStack.layoutHorizontally();
    titleStack.centerAlignContent();

    if (logo) {
      const logoImage = titleStack.addImage(logo);
      logoImage.imageSize = new Size(10, 10);
      titleStack.addSpacer(4);
    }

    const titleText = titleStack.addText("Crossover");
    titleText.font = Font.boldSystemFont(titleSize);
    titleText.textColor = Color.white();

    if (CONFIG.useQA) {
      titleStack.addSpacer(4);
      const qaBadge = titleStack.addText("QA");
      qaBadge.font = Font.boldSystemFont(Math.max(smallTextSize, 8));
      qaBadge.textColor = new Color("#000000");
      qaBadge.backgroundColor = new Color("#FF9800");
    }

    widget.addSpacer(spacing);

    if (error) {
      const errorText = widget.addText(`Error`);
      errorText.font = Font.systemFont(textSize);
      errorText.textColor = Color.red();
      return widget;
    }

    // Hours this week
    const hoursText = widget.addText(`${hoursData.total.toFixed(1)}h`);
    hoursText.font = Font.boldSystemFont(hoursSize);
    hoursText.textColor = new Color("#4CAF50");

    widget.addSpacer(2);

    const periodText = widget.addText("This Week");
    periodText.font = Font.systemFont(textSize);
    periodText.textColor = new Color("#999999");

    widget.addSpacer(spacing);

    // Weekly earnings
    const earningsText = widget.addText(`$${Math.round(hoursData.weeklyEarnings)}`);
    earningsText.font = Font.boldSystemFont(earningsSize);
    earningsText.textColor = new Color("#FFC107");

    widget.addSpacer(spacing);

    // Hours remaining
    if (hoursData.hoursRemaining > 0) {
      const remainingText = widget.addText(`${hoursData.hoursRemaining.toFixed(1)}h left`);
      remainingText.font = Font.systemFont(textSize);
      remainingText.textColor = new Color("#FF9800");

      // Deadline countdown (compact)
      const totalHoursUntilDeadline = Math.floor(hoursData.timeRemaining / (1000 * 60 * 60));
      const deadlineText = widget.addText(`${totalHoursUntilDeadline}h`);
      deadlineText.font = Font.systemFont(smallTextSize);
      deadlineText.textColor = new Color("#FF5722");
    }

    return widget;
  }

  // MEDIUM WIDGET - Compact horizontal layout
  if (widgetFamily === "medium") {
    const mediumScale = widgetWidth / 338; // Normalized to iPhone 16 Pro medium widget
    titleSize = Math.round(14 * mediumScale);
    hoursSize = Math.round(32 * mediumScale);
    earningsSize = Math.round(24 * mediumScale);
    textSize = Math.round(12 * mediumScale);
    smallTextSize = Math.round(10 * mediumScale);
    padding = Math.round(14 * mediumScale);
    spacing = Math.round(4 * mediumScale);

    widget.setPadding(padding, padding, padding, padding);

    // Title with logo
    const titleStack = widget.addStack();
    titleStack.layoutHorizontally();
    titleStack.centerAlignContent();

    if (logo) {
      const logoImage = titleStack.addImage(logo);
      logoImage.imageSize = new Size(14, 14);
      titleStack.addSpacer(4);
    }

    const titleText = titleStack.addText("Crossover Hours");
    titleText.font = Font.boldSystemFont(titleSize);
    titleText.textColor = Color.white();

    if (CONFIG.useQA) {
      titleStack.addSpacer(6);
      const qaBadge = titleStack.addText("QA");
      qaBadge.font = Font.boldSystemFont(Math.max(smallTextSize, 8));
      qaBadge.textColor = new Color("#000000");
      qaBadge.backgroundColor = new Color("#FF9800");
    }

    widget.addSpacer(spacing);

    if (error) {
      const errorText = widget.addText(`Error: ${error}`);
      errorText.font = Font.systemFont(textSize);
      errorText.textColor = Color.red();
      return widget;
    }

    // Main content in horizontal layout
    const mainStack = widget.addStack();
    mainStack.layoutHorizontally();
    mainStack.centerAlignContent();

    // Left side - Hours
    const leftStack = mainStack.addStack();
    leftStack.layoutVertically();

    const hoursText = leftStack.addText(`${hoursData.total.toFixed(1)}h`);
    hoursText.font = Font.boldSystemFont(hoursSize);
    hoursText.textColor = new Color("#4CAF50");

    const periodText = leftStack.addText("This Week");
    periodText.font = Font.systemFont(textSize);
    periodText.textColor = new Color("#999999");

    mainStack.addSpacer();

    // Right side - Earnings
    const rightStack = mainStack.addStack();
    rightStack.layoutVertically();

    const earningsText = rightStack.addText(`$${Math.round(hoursData.weeklyEarnings)}`);
    earningsText.font = Font.boldSystemFont(earningsSize);
    earningsText.textColor = new Color("#FFC107");

    const earningsLabel = rightStack.addText("Earned");
    earningsLabel.font = Font.systemFont(textSize);
    earningsLabel.textColor = new Color("#999999");

    widget.addSpacer(spacing);

    // Bottom info
    if (hoursData.hoursRemaining > 0) {
      const infoStack = widget.addStack();
      infoStack.layoutHorizontally();

      const remainingText = infoStack.addText(`${hoursData.hoursRemaining.toFixed(1)}h left to 40`);
      remainingText.font = Font.systemFont(textSize);
      remainingText.textColor = new Color("#FF9800");

      infoStack.addSpacer();

      // Deadline countdown
      const totalHoursUntilDeadline = Math.floor(hoursData.timeRemaining / (1000 * 60 * 60));
      const deadlineText = infoStack.addText(`${totalHoursUntilDeadline}h deadline`);
      deadlineText.font = Font.systemFont(textSize);
      deadlineText.textColor = new Color("#FF5722");
    }

    // Today's hours
    if (hoursData.today > 0) {
      widget.addSpacer(2);
      const todayText = widget.addText(`Today: ${hoursData.today.toFixed(1)}h ($${Math.round(hoursData.todayEarnings)})`);
      todayText.font = Font.systemFont(smallTextSize);
      todayText.textColor = new Color("#64B5F6");
    }

    return widget;
  }

  // LARGE WIDGET - Full layout with chart
  const largeScale = widgetHeight / 354; // Normalized to iPhone 16 Pro large widget height
  titleSize = Math.round(18 * largeScale);
  hoursSize = Math.round(40 * largeScale);
  earningsSize = Math.round(32 * largeScale);
  textSize = Math.round(15 * largeScale);
  smallTextSize = Math.round(12 * largeScale);
  padding = Math.round(16 * largeScale);
  spacing = Math.round(5 * largeScale);

  widget.setPadding(padding, padding, padding, padding);

  // Title with logo
  const titleStack = widget.addStack();
  titleStack.layoutHorizontally();
  titleStack.centerAlignContent();

  if (logo) {
    const logoImage = titleStack.addImage(logo);
    logoImage.imageSize = new Size(titleSize, titleSize);
    titleStack.addSpacer(6);
  }

  const titleText = titleStack.addText("Crossover Hours");
  titleText.font = Font.boldSystemFont(titleSize);
  titleText.textColor = Color.white();

  if (CONFIG.useQA) {
    titleStack.addSpacer(6);
    const qaBadge = titleStack.addText("QA");
    qaBadge.font = Font.boldSystemFont(Math.max(smallTextSize, 9));
    qaBadge.textColor = new Color("#000000");
    qaBadge.backgroundColor = new Color("#FF9800");
  }

  widget.addSpacer(spacing);

  if (error) {
    const errorText = widget.addText(`Error: ${error}`);
    errorText.font = Font.systemFont(textSize);
    errorText.textColor = Color.red();
    return widget;
  }

  // Hours this week
  const hoursText = widget.addText(`${hoursData.total.toFixed(1)} hrs`);
  hoursText.font = Font.boldSystemFont(hoursSize);
  hoursText.textColor = new Color("#4CAF50");

  widget.addSpacer(spacing / 2);

  const periodText = widget.addText("This Week");
  periodText.font = Font.systemFont(textSize);
  periodText.textColor = new Color("#999999");

  widget.addSpacer(spacing);

  // Weekly earnings
  const earningsText = widget.addText(`$${hoursData.weeklyEarnings.toFixed(2)}`);
  earningsText.font = Font.boldSystemFont(earningsSize);
  earningsText.textColor = new Color("#FFC107");

  widget.addSpacer(spacing);

  // Hours remaining to 40
  if (hoursData.hoursRemaining > 0) {
    const remainingText = widget.addText(`${hoursData.hoursRemaining.toFixed(1)} hrs left to 40`);
    remainingText.font = Font.systemFont(textSize);
    remainingText.textColor = new Color("#FF9800");

    widget.addSpacer(spacing / 3);

    // Deadline countdown
    const totalHoursUntilDeadline = Math.floor(hoursData.timeRemaining / (1000 * 60 * 60));
    const deadlineText = widget.addText(`${formatTimeRemaining(hoursData.timeRemaining)} until deadline (${totalHoursUntilDeadline}h)`);
    deadlineText.font = Font.systemFont(smallTextSize);
    deadlineText.textColor = new Color("#FF5722");
  } else {
    // Goal reached!
    const goalText = widget.addText(`✓ 40 hour goal reached!`);
    goalText.font = Font.systemFont(textSize);
    goalText.textColor = new Color("#4CAF50");
  }

  widget.addSpacer(spacing);

  // Today's hours and earnings
  if (hoursData.today > 0) {
    const todayText = widget.addText(`Today: ${hoursData.today.toFixed(1)} hrs ($${hoursData.todayEarnings.toFixed(2)})`);
    todayText.font = Font.systemFont(textSize);
    todayText.textColor = new Color("#64B5F6");
  }

  widget.addSpacer(spacing / 2);

  // Average per day
  if (hoursData.average > 0) {
    const avgEarnings = hoursData.average * CONFIG.hourlyRate;
    const avgText = widget.addText(`Avg: ${hoursData.average.toFixed(1)} hrs/day ($${avgEarnings.toFixed(2)})`);
    avgText.font = Font.systemFont(smallTextSize);
    avgText.textColor = new Color("#999999");
  }

  // Daily bar chart (only for large widgets)
  if (widgetFamily === "large" && hoursData.daily && hoursData.daily.length > 0) {
    widget.addSpacer(3);

    const chartTitle = widget.addText("Daily");
    chartTitle.font = Font.boldSystemFont(smallTextSize - 1);
    chartTitle.textColor = new Color("#999999");

    widget.addSpacer(2);

    // Filter days with hours
    const workDays = hoursData.daily.filter(d => d.hours > 0);
    const maxHours = Math.max(...workDays.map(d => d.hours), 8); // At least 8 for scale

    workDays.forEach(day => {
      const date = new Date(day.date);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }); // Use UTC to prevent date shifting

      const rowStack = widget.addStack();
      rowStack.layoutHorizontally();
      rowStack.centerAlignContent();

      // Day label
      const dayLabel = rowStack.addText(dayName);
      dayLabel.font = Font.systemFont(smallTextSize - 3);
      dayLabel.textColor = Color.white();
      dayLabel.size = new Size(35, 0);

      rowStack.addSpacer(4);

      // Bar
      const barWidth = (day.hours / maxHours) * 100;
      const barStack = rowStack.addStack();
      barStack.size = new Size(barWidth, 8);
      barStack.backgroundColor = new Color("#4CAF50");
      barStack.cornerRadius = 2;

      rowStack.addSpacer(4);

      // Hours value
      const hoursLabel = rowStack.addText(`${day.hours.toFixed(1)}h`);
      hoursLabel.font = Font.systemFont(smallTextSize - 3);
      hoursLabel.textColor = new Color("#4CAF50");

      widget.addSpacer(1);
    });
  }

  widget.addSpacer();

  // Last updated
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Add debug info if enabled
  if (CONFIG.debugMode) {
    const debugText = widget.addText(`${dimensions.name.split('/')[0].trim()}`);
    debugText.font = Font.systemFont(smallTextSize - 3);
    debugText.textColor = new Color("#444444");
  }

  let updateLabel = `Updated: ${timeStr}`;
  let updateColor = "#666666";
  if (cachedAt) {
    const cachedTime = new Date(cachedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    updateLabel = `Cached: ${cachedTime}`;
    updateColor = "#FFA726";
  }
  const updateText = widget.addText(updateLabel);
  updateText.font = Font.systemFont(smallTextSize - 2);
  updateText.textColor = new Color(updateColor);

  return widget;
}

// Main execution
async function main() {
  try {
    // Load config (triggers onboarding on first run)
    const cfg = await getConfig();
    if (!cfg) {
      // User cancelled onboarding — show placeholder widget
      const widget = new ListWidget();
      widget.backgroundColor = new Color("#1a1a1a");
      const msg = widget.addText("Setup needed — tap to configure");
      msg.font = Font.systemFont(14);
      msg.textColor = Color.white();
      return widget;
    }
    initUrls(cfg);

    // Determine widget size and load appropriate logo
    const widgetFamily = config.widgetFamily || "large";
    const useSmallLogo = (widgetFamily === "small" ||
                          widgetFamily === "accessoryRectangular" ||
                          widgetFamily === "accessoryCircular" ||
                          widgetFamily === "accessoryInline");

    // Load logo (small for compact widgets, large for others)
    const logo = await loadLogo(useSmallLogo);

    // Get auth token
    let token = await getAuthToken();
    if (!token) {
      // Credentials expired or changed — re-onboard if in-app
      if (!config.runsInWidget) {
        clearConfig();
        const retryCfg = await runOnboarding();
        if (retryCfg) {
          initUrls(retryCfg);
          token = await getAuthToken();
        }
      }
      if (!token) {
        // Try cached data before showing error
        const cached = loadCache();
        if (cached) {
          const widget = await createWidget(cached.hoursData, logo, null, cached.cachedAt);
          return widget;
        }
        const widget = await createWidget(null, logo, "Auth failed — tap to reconfigure");
        return widget;
      }
    }

    // Get timesheet data
    const timesheetData = await getTimesheetData(token);
    if (!timesheetData) {
      // Try cached data before showing error
      const cached = loadCache();
      if (cached) {
        const widget = await createWidget(cached.hoursData, logo, null, cached.cachedAt);
        return widget;
      }
      const widget = await createWidget(null, logo, "Failed to fetch data");
      return widget;
    }

    // Calculate hours
    const hoursData = calculateHours(timesheetData);

    // Cache successful data for failover
    saveCache(hoursData);

    // Create widget
    const widget = await createWidget(hoursData, logo);
    return widget;

  } catch (error) {
    console.error("Widget error:", error);
    // Try cached data before showing error
    const cached = loadCache();
    if (cached) {
      const widget = await createWidget(cached.hoursData, null, null, cached.cachedAt);
      return widget;
    }
    const widget = await createWidget(null, null, error.message);
    return widget;
  }
}

// Run
const widget = await main();

// Display widget
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  // Show preview - change to presentMedium() or presentLarge() to test different sizes
  widget.presentLarge();
}

Script.complete();
