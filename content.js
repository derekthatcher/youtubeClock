// Create the main overlay
const overlay = document.createElement('div');
overlay.id = 'yt-tracker-overlay';

// Create a span for the live counter
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
let isDragging = false; 

// --- HIGH-PERFORMANCE DRAG LOGIC ---
let offsetX = 0;
let offsetY = 0;

overlay.addEventListener('mousedown', (e) => {
  e.preventDefault();
  isDragging = false;

  // Calculate exactly where inside the element the user clicked
  offsetX = e.clientX - overlay.getBoundingClientRect().left;
  offsetY = e.clientY - overlay.getBoundingClientRect().top;

  // Attach listeners to the global window so it tracks perfectly even at high speed
  window.addEventListener('mousemove', elementDrag);
  window.addEventListener('mouseup', closeDragElement);
});

function elementDrag(e) {
  isDragging = true; // Mouse moved, toggle drag mode

  // Directly assign the element's position to the cursor coordinates minus the click offset
  overlay.style.left = (e.clientX - offsetX) + 'px';
  overlay.style.top = (e.clientY - offsetY) + 'px';
}

function closeDragElement() {
  // Clean up global listeners when mouse is released
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

// --- TRACKING CODE ---
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
    
    liveTimeSpan.innerText = formatDisplayTime(stats.today);
    document.getElementById('yt-stat-7day').innerHTML = `Last 7 Days: <strong>${formatHours(stats.last7Days)}</strong>`;
    document.getElementById('yt-stat-year').innerHTML = `This Year: <strong>${formatHours(stats.thisYear)}</strong>`;

    const currentMilestone = Math.floor(stats.today / 10);
    if (currentMilestone > lastPulseMilestone && currentMilestone > 0) {
      lastPulseMilestone = currentMilestone;
      overlay.classList.add('pulse-red');
    }
  }
});