function updateClocks() {
  const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
  const dateOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
  const now = new Date();
  const seoulTime = new Intl.DateTimeFormat('en-CA', { ...timeOptions, timeZone: 'Asia/Seoul' }).format(now);
  const seoulDate = new Intl.DateTimeFormat('en-CA', { ...dateOptions, timeZone: 'Asia/Seoul' }).format(now);
  const pstTime = new Intl.DateTimeFormat('en-CA', { ...timeOptions, timeZone: 'America/Los_Angeles' }).format(now);
  const pstDate = new Intl.DateTimeFormat('en-CA', { ...dateOptions, timeZone: 'America/Los_Angeles' }).format(now);
  document.getElementById('seoulDate').textContent = seoulDate;
  document.getElementById('seoulClock').textContent = seoulTime;
  document.getElementById('pstDate').textContent = pstDate;
  document.getElementById('pstClock').textContent = pstTime;
}
updateClocks();
setInterval(updateClocks, 1000);
