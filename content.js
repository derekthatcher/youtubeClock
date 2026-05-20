// Create the main overlay
const overlay = document.createElement('div');
overlay.id = 'yt-tracker-overlay';

// Create a span for the live counter
const liveTimeSpan = document.createElement('span');
liveTimeSpan.id = 'yt-tracker-live';
liveTimeSpan.innerText = '0d 0h 0m 0s';
overlay.appendChild(liveTimeSpan);

// Create the dropdown history container
const dropdown = document.createElement('div');
dropdown.id = 'yt-tracker-dropdown';
dropdown.innerHTML = `
  <div id="yt-stat-7day">Last 7 Days: <strong>0d 0h 0m 0s</strong></div>
  <div id="yt-stat-year">This Year: <strong>0d 0h 0m 0s</strong></div>
`;
overlay.appendChild(dropdown);
document.body.appendChild(overlay);

let lastPulseMilestone = 0;
let isDragging = false; 

// --- HIGH-PERFORMANCE DRAG LOGIC ---
let offsetX = 0;
let offsetY = 0;

overlay.addEventListener('mousedown', (e) => {
  e.preventDefault();
  isDragging = false;
  offsetX = e.clientX - overlay.getBoundingClientRect().left;
  offsetY = e.clientY - overlay.getBoundingClientRect().top;
  window.addEventListener('mousemove', elementDrag);
  window.addEventListener('mouseup', closeDragElement);
});

function elementDrag(e) {
  isDragging = true;
  overlay.style.left = (e.clientX - offsetX) + 'px';
  overlay.style.top = (e.clientY - offsetY) + 'px';
}

function closeDragElement() {
  window.removeEventListener('mousemove', elementDrag);
  window.removeEventListener('mouseup', closeDragElement);
}

// --- DROPDOWN TOGGLE LOGIC ---
overlay.addEventListener('click', (e) => {
  if (!isDragging) {
    if (dropdown.style.display === 'block') {
      dropdown.style.display = 'none';
    } else {
      dropdown.style.display = 'block';
    }
  }
});

// --- MASTER TIME PARSER WITH DYNAMIC HIDING rules ---
function formatToFullDHMS(totalMinutes) {
  const totalSeconds = Math.floor(totalMinutes * 60);
  
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let parts = [];

  // Rule 1: Only add a unit if its value is greater than 0
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  // Rule 2: Only show seconds if total time is LESS than 1 hour (3600 seconds)
  if (totalSeconds < 3600) {
    if (seconds > 0 || parts.length === 0) {
      parts.push(`${seconds}s`);
    }
  }

  // Fallback if everything is literally 0 (e.g., brand new day)
  if (parts.length === 0) {
    return "0s";
  }

  return parts.join(' ');
}

// --- LISTEN FOR BACKGOUND TIME SCRIPT UPDATES ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateTime" && request.stats) {
    const stats = request.stats;
    
    // 1. Extract values safely (defaulting to 0 if null)
    const todayTime = stats.today || 0;
    const last7Time = stats.last7Days || 0;
    const yearTime = stats.thisYear || 0;

    // 2. Update the main screen element text dynamically
    liveTimeSpan.innerText = formatToFullDHMS(todayTime);
    
    // 3. Update the inner dropdown values
    const day7Elem = document.getElementById('yt-stat-7day');
    const yearElem = document.getElementById('yt-stat-year');
    
    if (day7Elem) {
      day7Elem.innerHTML = `Last 7 Days: <strong>${formatToFullDHMS(last7Time)}</strong>`;
    }
    if (yearElem) {
      yearElem.innerHTML = `This Year: <strong>${formatToFullDHMS(yearTime)}</strong>`;
    }

    // 4. Handle the 10-minute visual screen pulse
    const currentMilestone = Math.floor(todayTime / 10);
    if (currentMilestone > lastPulseMilestone && currentMilestone > 0) {
      lastPulseMilestone = currentMilestone;
      overlay.classList.add('pulse-red');
    }
  }
});