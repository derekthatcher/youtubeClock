// Create the overlay element
const overlay = document.createElement('div');
overlay.id = 'yt-tracker-overlay';
overlay.innerText = '0m';
document.body.appendChild(overlay);

// Format minutes for the on-screen display
function formatDisplayTime(totalMinutes) {
  const mins = Math.floor(totalMinutes);
  const secs = Math.floor((totalMinutes % 1) * 60);
  return `${mins}m ${secs}s`;
}

// Listen for updates from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateTime") {
    overlay.innerText = formatDisplayTime(request.time);
  }
});