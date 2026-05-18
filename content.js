// Create the main overlay
const overlay = document.createElement('div');
overlay.id = 'yt-tracker-overlay';

// Create a span just for the live counter
const liveTimeSpan = document.createElement('span');
liveTimeSpan.id = 'yt-tracker-live';
liveTimeSpan.innerText = '0m 0s';
overlay.appendChild(liveTimeSpan);

// Create the dropdown history container
const dropdown = document.createElement('div');
dropdown.id = 'yt-tracker-dropdown';
dropdown.innerHTML = `
  <div id="yt-stat-7day">Last 7 Days: <strong>0h</strong></div>
  <div id="yt-stat-year">This Year: <strong>0h</strong></div>
`;
overlay.appendChild(dropdown);
document.body.appendChild(overlay);

let lastPulseMilestone = 0;

// Toggle stats dropdown on click
overlay.addEventListener('click', (e) => {
  if (dropdown.style.display === 'block') {
    dropdown.style.display = 'none';
  } else {
    dropdown.style.display = 'block';
  }
});

function formatDisplayTime(totalMinutes) {
  const mins = Math.floor(totalMinutes);
  const secs = Math.floor((totalMinutes % 1) * 60);
  return `${mins}m ${secs}s`;
}

function formatHours(totalMinutes) {
  return `${(totalMinutes / 60).toFixed(1)}h`;
}

overlay.addEventListener('animationend', () => {
  overlay.classList.remove('pulse-red');
});

// Listen for updates from the background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateTime") {
    const stats = request.stats;
    
    // Update Today's live time
    liveTimeSpan.innerText = formatDisplayTime(stats.today);

    // Update the dropdown statistics
    document.getElementById('yt-stat-7day').innerHTML = `Last 7 Days: <strong>${formatHours(stats.last7Days)}</strong>`;
    document.getElementById('yt-stat-year').innerHTML = `This Year: <strong>${formatHours(stats.thisYear)}</strong>`;

    // Keep the 10-minute pulse working
    const currentMilestone = Math.floor(stats.today / 10);
    if (currentMilestone > lastPulseMilestone && currentMilestone > 0) {
      lastPulseMilestone = currentMilestone;
      overlay.classList.add('pulse-red');
    }
  }
});