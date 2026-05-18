let timerInterval = null;

// Returns current local date as "YYYY-MM-DD"
function getLocalDateString(date = new Date()) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
}

// Formats badge text for the toolbar icon
function formatBadgeText(totalMinutes) {
  if (totalMinutes < 60) {
    return `${Math.floor(totalMinutes)}m`;
  } else {
    return `${(totalMinutes / 60).toFixed(1)}h`;
  }
}

async function checkAndTrackTime() {
  const now = new Date();
  const todayStr = getLocalDateString(now);
  const currentYear = now.getFullYear().toString();

  // Get active tab
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Fetch tracking history database
  const storage = await chrome.storage.local.get(["yt_history"]);
  let history = storage.yt_history || {};

  // If a brand new day, initialize it
  if (!history[todayStr]) {
    history[todayStr] = 0;
  }

  // Accumulate time if active on YouTube
  if (activeTab && activeTab.url && activeTab.url.includes("youtube.com")) {
    history[todayStr] += 1 / 60; // Add 1 second in minute fragments
    await chrome.storage.local.set({ yt_history: history });
  }

  // Calculate stats (Today, Last 7 Days, Year to Date)
  const todayMins = history[todayStr] || 0;
  let last7DaysMins = 0;
  let thisYearMins = 0;

  // Loop through history database to calculate aggregated sums
  for (const [dateStr, mins] of Object.entries(history)) {
    // Year Check
    if (dateStr.startsWith(currentYear)) {
      thisYearMins += mins;
    }
    
    // 7 Day Check
    const logDate = new Date(dateStr + 'T00:00:00');
    const timeDiff = now - logDate;
    const dayDiff = timeDiff / (1000 * 60 * 60 * 24);
    if (dayDiff >= 0 && dayDiff < 7) {
      last7DaysMins += mins;
    }
  }

  // Update browser badge icon
  chrome.action.setBadgeText({ text: formatBadgeText(todayMins) });
  chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });

  // Broadcast payload to content script script
  if (activeTab && activeTab.url && activeTab.url.includes("youtube.com")) {
    chrome.tabs.sendMessage(activeTab.id, { 
      action: "updateTime", 
      stats: {
        today: todayMins,
        last7Days: last7DaysMins,
        thisYear: thisYearMins
      }
    }).catch(() => { /* Catch safe initialization drops */ });
  }
}

function startTracking() {
  if (!timerInterval) {
    timerInterval = setInterval(checkAndTrackTime, 1000);
  }
}

chrome.runtime.onInstalled.addListener(startTracking);
chrome.runtime.onStartup.addListener(startTracking);
startTracking();