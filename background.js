let timerInterval = null;

function getLocalDateString(date = new Date()) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
}

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

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  const storage = await chrome.storage.local.get(["yt_history"]);
  let history = storage.yt_history || {};

  if (!history[todayStr]) {
    history[todayStr] = 0;
  }

  if (activeTab && activeTab.url && activeTab.url.includes("youtube.com")) {
    history[todayStr] += 1 / 60; // Add precisely one second
    await chrome.storage.local.set({ yt_history: history });
  }

  const todayMins = history[todayStr] || 0;
  let last7DaysMins = 0;
  let thisYearMins = 0;

  for (const [dateStr, mins] of Object.entries(history)) {
    if (dateStr.startsWith(currentYear)) {
      thisYearMins += mins;
    }
    
    const logDate = new Date(dateStr + 'T00:00:00');
    const timeDiff = now - logDate;
    const dayDiff = timeDiff / (1000 * 60 * 60 * 24);
    if (dayDiff >= 0 && dayDiff < 7) {
      last7DaysMins += mins;
    }
  }

  chrome.action.setBadgeText({ text: formatBadgeText(todayMins) });
  chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });

  if (activeTab && activeTab.url && activeTab.url.includes("youtube.com")) {
    chrome.tabs.sendMessage(activeTab.id, { 
      action: "updateTime", 
      stats: {
        today: todayMins,
        last7Days: last7DaysMins,
        thisYear: thisYearMins
      }
    }).catch(() => {});
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