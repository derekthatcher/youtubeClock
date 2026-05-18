let timerInterval = null;

// Helper to get today's date string (e.g., "2026-05-18")
function getTodayDateString() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// Format minutes into a clean badge string (e.g., "15m", "1.2h")
function formatBadgeText(totalMinutes) {
  if (totalMinutes < 60) {
    return `${Math.floor(totalMinutes)}m`;
  } else {
    return `${(totalMinutes / 60).toFixed(1)}h`;
  }
}

// Core function to check tabs and update time
async function checkAndTrackTime() {
  const todayStr = getTodayDateString();
  
  // Get active tab
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Fetch current stats from storage
  const data = await chrome.storage.local.get([todayStr]);
  let currentMinutes = data[todayStr] || 0;

  if (activeTab && activeTab.url && activeTab.url.includes("youtube.com")) {
    // Add 1 second (1/60 of a minute)
    currentMinutes += 1 / 60;
    
    const updateData = {};
    updateData[todayStr] = currentMinutes;
    await chrome.storage.local.set(updateData);
  }

  // Always update the badge display so it stays permanent
  chrome.action.setBadgeText({ text: formatBadgeText(currentMinutes) });
  chrome.action.setBadgeBackgroundColor({ color: "#FF0000" }); // YouTube Red
  if (activeTab && activeTab.url && activeTab.url.includes("youtube.com")) {
    chrome.tabs.sendMessage(activeTab.id, { action: "updateTime", time: currentMinutes }).catch(() => {
      // Catch errors if the tab is loading or doesn't have the content script ready yet
    });
  }
}

// Start tracking loop
function startTracking() {
  if (!timerInterval) {
    timerInterval = setInterval(checkAndTrackTime, 1000); // Check every second
  }
}

// Initialize on startup/install
chrome.runtime.onInstalled.addListener(() => {
  startTracking();
});

chrome.runtime.onStartup.addListener(() => {
  startTracking();
});

// Ensure tracker starts up if background worker wakes up
startTracking();