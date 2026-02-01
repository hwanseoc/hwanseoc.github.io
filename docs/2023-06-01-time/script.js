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
  updatePieClock(now);
}

function getTimezoneOffset(date, tz) {
  const utc = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const local = new Date(date.toLocaleString('en-US', { timeZone: tz }));
  return (local - utc) / 3600000;
}

function drawPieClock(svg, cx, cy, r, startHour, endHour, color, isOuter) {
  const toRad = (h) => ((h - 6) / 24) * 2 * Math.PI;
  const rInner = isOuter ? r * 0.65 : r * 0.35;
  const rOuter = isOuter ? r : r * 0.65;
  const start = toRad(startHour);
  const end = toRad(endHour);
  const x1 = cx + rInner * Math.cos(start);
  const y1 = cy + rInner * Math.sin(start);
  const x2 = cx + rOuter * Math.cos(start);
  const y2 = cy + rOuter * Math.sin(start);
  const x3 = cx + rOuter * Math.cos(end);
  const y3 = cy + rOuter * Math.sin(end);
  const x4 = cx + rInner * Math.cos(end);
  const y4 = cy + rInner * Math.sin(end);
  const largeArc = (endHour - startHour) > 12 ? 1 : 0;
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', `M${x1},${y1} L${x2},${y2} A${rOuter},${rOuter} 0 ${largeArc} 1 ${x3},${y3} L${x4},${y4} A${rInner},${rInner} 0 ${largeArc} 0 ${x1},${y1}`);
  path.setAttribute('fill', color);
  svg.appendChild(path);
}

function updatePieClock(now) {
  const svg = document.getElementById('pieClock');
  svg.innerHTML = '';
  const cx = 140, cy = 140, r = 120;
  
  const pstOffset = getTimezoneOffset(now, 'America/Los_Angeles');
  const kstOffset = getTimezoneOffset(now, 'Asia/Seoul');
  const diff = kstOffset - pstOffset;
  
  const bgOuter = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  bgOuter.setAttribute('cx', cx);
  bgOuter.setAttribute('cy', cy);
  bgOuter.setAttribute('r', r);
  bgOuter.setAttribute('fill', '#e5e7eb');
  svg.appendChild(bgOuter);
  
  const bgInner = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  bgInner.setAttribute('cx', cx);
  bgInner.setAttribute('cy', cy);
  bgInner.setAttribute('r', r * 0.65);
  bgInner.setAttribute('fill', '#f3f4f6');
  svg.appendChild(bgInner);
  
  drawPieClock(svg, cx, cy, r, 9, 18, '#818cf8', true);
  
  let kstStart = (9 + diff) % 24;
  let kstEnd = (18 + diff) % 24;
  if (kstStart < 0) kstStart += 24;
  if (kstEnd < 0) kstEnd += 24;
  if (kstEnd < kstStart) {
    drawPieClock(svg, cx, cy, r, kstStart, 24, '#f472b6', false);
    drawPieClock(svg, cx, cy, r, 0, kstEnd, '#f472b6', false);
  } else {
    drawPieClock(svg, cx, cy, r, kstStart, kstEnd, '#f472b6', false);
  }
  
  const centerBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  centerBg.setAttribute('cx', cx);
  centerBg.setAttribute('cy', cy);
  centerBg.setAttribute('r', r * 0.35);
  centerBg.setAttribute('fill', '#fff');
  svg.appendChild(centerBg);
  
  for (let h = 0; h < 24; h++) {
    const angle = ((h - 6) / 24) * 2 * Math.PI;
    const x1 = cx + (r - 8) * Math.cos(angle);
    const y1 = cy + (r - 8) * Math.sin(angle);
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    tick.setAttribute('x1', x1);
    tick.setAttribute('y1', y1);
    tick.setAttribute('x2', x2);
    tick.setAttribute('y2', y2);
    tick.setAttribute('stroke', '#6b7280');
    tick.setAttribute('stroke-width', h % 6 === 0 ? 2 : 1);
    svg.appendChild(tick);
    
    if (h % 3 === 0) {
      const lx = cx + (r + 12) * Math.cos(angle);
      const ly = cy + (r + 12) * Math.sin(angle);
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', lx);
      label.setAttribute('y', ly);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('dominant-baseline', 'middle');
      label.setAttribute('font-size', '10');
      label.setAttribute('fill', '#374151');
      label.textContent = h;
      svg.appendChild(label);
    }
  }
  
  const pstHour = parseInt(new Intl.DateTimeFormat('en-CA', { hour: '2-digit', hour12: false, timeZone: 'America/Los_Angeles' }).format(now));
  const pstMin = parseInt(new Intl.DateTimeFormat('en-CA', { minute: '2-digit', timeZone: 'America/Los_Angeles' }).format(now));
  const currentHour = pstHour + pstMin / 60;
  const handAngle = ((currentHour - 6) / 24) * 2 * Math.PI;
  const hx = cx + (r * 0.55) * Math.cos(handAngle);
  const hy = cy + (r * 0.55) * Math.sin(handAngle);
  const hand = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  hand.setAttribute('x1', cx);
  hand.setAttribute('y1', cy);
  hand.setAttribute('x2', hx);
  hand.setAttribute('y2', hy);
  hand.setAttribute('stroke', '#1f2937');
  hand.setAttribute('stroke-width', 3);
  hand.setAttribute('stroke-linecap', 'round');
  svg.appendChild(hand);
  
  const centerDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  centerDot.setAttribute('cx', cx);
  centerDot.setAttribute('cy', cy);
  centerDot.setAttribute('r', 5);
  centerDot.setAttribute('fill', '#1f2937');
  svg.appendChild(centerDot);
}

updateClocks();
setInterval(updateClocks, 1000);
