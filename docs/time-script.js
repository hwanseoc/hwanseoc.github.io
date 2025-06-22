function updateClocks() {
  const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
  const seoulTime = new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'Asia/Seoul' }).format(new Date());
  const pstTime = new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'America/Los_Angeles' }).format(new Date());
  document.getElementById('seoulClock').textContent = seoulTime;
  document.getElementById('pstClock').textContent = pstTime;
}
updateClocks();
setInterval(updateClocks, 1000);
