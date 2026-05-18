// Create the overlay element
const overlay = document.createElement('div');
overlay.id = 'yt-tracker-overlay';
overlay.innerText = '0m';
document.body.appendChild(overlay);

let lastPulseMilestone = 0;

overlay.addEventListener('animationend', () => {
  overlay.classList.remove('pulse-red');
});

// Format minutes for the on-screen display
function formatDisplayTime(totalMinutes) {
  const mins = Math.floor(totalMinutes);
  const secs = Math.floor((totalMinutes % 1) * 60);
  return `${mins}m ${secs}s`;
}

// Listen for updates from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateTime") {
    const currentMinutes = request.time;
    overlay.innerText = formatDisplayTime(currentMinutes);

    // Check if we hit a new 10-minute mark (e.g., 10, 20, 30...)
    const currentMilestone = Math.floor(currentMinutes / 10);
    
    if (currentMilestone > lastPulseMilestone && currentMilestone > 0) {
      lastPulseMilestone = currentMilestone;
      
      // Fire the pulse!
      overlay.classList.add('pulse-red');
    }
  }
});