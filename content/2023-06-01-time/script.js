dayjs.extend(dayjs_plugin_utc);
dayjs.extend(dayjs_plugin_timezone);

const TIMEZONES = {
  pt:  { tz: 'America/Los_Angeles', label: 'PT',  city: 'Santa Clara', domId: 'pst' },
  kst: { tz: 'Asia/Seoul',          label: 'KST', city: 'Seoul',       domId: 'seoul' },
  et:  { tz: 'America/New_York',    label: 'ET',  city: 'New York',    domId: 'est' },
  ist: { tz: 'Asia/Kolkata',        label: 'IST', city: 'Mumbai',      domId: 'ist' },
  utc: { tz: 'UTC',                 label: 'UTC', city: 'World',       domId: 'utc' }
};

const TZ_BY_IANA = Object.fromEntries(
  Object.values(TIMEZONES).map(t => [t.tz, t])
);

const CLOCK = {
  cx: 140, cy: 140, r: 120,
  sleepStart: 5, sleepEnd: 13,
  workStart: 13, workEnd: 21,
  colors: { sleep: '#818cf8', work: '#f472b6', bg: '#e5e7eb' }
};

function svg(tag, attrs) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

function hourToRad(h) {
  return ((h - 6) / 24) * 2 * Math.PI;
}

function formatOffset(tz) {
  const offset = dayjs().tz(tz).utcOffset() / 60;
  return `${offset >= 0 ? '+' : ''}${offset}`;
}

function drawArc(parent, startHour, endHour, color) {
  const { cx, cy, r } = CLOCK;
  const rInner = r * 0.5, rOuter = r * 0.9;
  const start = hourToRad(startHour), end = hourToRad(endHour);
  const largeArc = (endHour - startHour) > 12 ? 1 : 0;
  const pt = (radius, angle) => [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
  const [x1, y1] = pt(rInner, start), [x2, y2] = pt(rOuter, start);
  const [x3, y3] = pt(rOuter, end), [x4, y4] = pt(rInner, end);
  parent.appendChild(svg('path', {
    d: `M${x1},${y1} L${x2},${y2} A${rOuter},${rOuter} 0 ${largeArc} 1 ${x3},${y3} L${x4},${y4} A${rInner},${rInner} 0 ${largeArc} 0 ${x1},${y1}`,
    fill: color
  }));
}

function drawTimeRange(el, startPT, endPT, color, diff) {
  let start = (startPT + diff) % 24;
  let end = (endPT + diff) % 24;
  if (start < 0) start += 24;
  if (end < 0) end += 24;
  if (end < start) {
    drawArc(el, start, 24, color);
    drawArc(el, 0, end, color);
  } else {
    drawArc(el, start, end, color);
  }
}

function drawClock(el, tz, now) {
  el.innerHTML = '';
  const { cx, cy, r, colors, sleepStart, sleepEnd, workStart, workEnd } = CLOCK;
  
  const ptOffset = dayjs().tz(TIMEZONES.pt.tz).utcOffset() / 60;
  const thisOffset = dayjs().tz(tz).utcOffset() / 60;
  const diff = thisOffset - ptOffset;
  
  el.appendChild(svg('circle', { cx, cy, r, fill: colors.bg }));
  
  drawTimeRange(el, sleepStart, sleepEnd, colors.sleep, diff);
  drawTimeRange(el, workStart, workEnd, colors.work, diff);
  
  el.appendChild(svg('circle', { cx, cy, r: r * 0.5, fill: '#fff' }));
  
  for (let h = 0; h < 24; h++) {
    const angle = hourToRad(h);
    el.appendChild(svg('line', {
      x1: cx + (r - 8) * Math.cos(angle), y1: cy + (r - 8) * Math.sin(angle),
      x2: cx + r * Math.cos(angle), y2: cy + r * Math.sin(angle),
      stroke: '#6b7280', 'stroke-width': h % 6 === 0 ? 2 : 1
    }));
    if (h % 3 === 0) {
      const lbl = svg('text', {
        x: cx + (r + 14) * Math.cos(angle), y: cy + (r + 14) * Math.sin(angle),
        'text-anchor': 'middle', 'dominant-baseline': 'middle', 'font-size': 16, 'font-weight': 600, fill: '#374151'
      });
      lbl.textContent = h;
      el.appendChild(lbl);
    }
  }
  
  const tzNow = now.tz(tz);
  const currentHour = tzNow.hour() + tzNow.minute() / 60;
  const handAngle = hourToRad(currentHour);
  el.appendChild(svg('line', {
    x1: cx, y1: cy,
    x2: cx + (r * 0.4) * Math.cos(handAngle), y2: cy + (r * 0.4) * Math.sin(handAngle),
    stroke: '#1f2937', 'stroke-width': 3, 'stroke-linecap': 'round'
  }));
  el.appendChild(svg('circle', { cx, cy, r: 5, fill: '#1f2937' }));
}

function updateClocks() {
  const now = dayjs();
  
  Object.values(TIMEZONES).forEach(({ tz, domId, label, city }) => {
    const t = now.tz(tz);
    document.getElementById(`${domId}Date`).textContent = t.format('YYYY-MM-DD');
    document.getElementById(`${domId}Clock`).textContent = t.format('HH:mm:ss');
    const labelEl = document.getElementById(`${label.toLowerCase()}Label`);
    if (labelEl) labelEl.textContent = `${city} (${label} ${formatOffset(tz)})`;
  });
  
  ['fromTz', 'toTz'].forEach(id => {
    const select = document.getElementById(id);
    Array.from(select.options).forEach(opt => {
      const info = TZ_BY_IANA[opt.value];
      if (info) {
        opt.textContent = `${info.city} (${info.label} ${formatOffset(info.tz)})`;
      }
    });
  });
  
  drawClock(document.getElementById('clockPT'), TIMEZONES.pt.tz, now);
  drawClock(document.getElementById('clockKST'), TIMEZONES.kst.tz, now);
}

function populateDropdowns() {
  ['fromTz', 'toTz'].forEach(id => {
    const select = document.getElementById(id);
    const defaultKey = select.dataset.default;
    select.innerHTML = '';
    Object.entries(TIMEZONES).forEach(([key, info]) => {
      const opt = document.createElement('option');
      opt.value = info.tz;
      opt.textContent = `${info.city} (${info.label} ${formatOffset(info.tz)})`;
      if (key === defaultKey) opt.selected = true;
      select.appendChild(opt);
    });
  });
}

function convertTime() {
  const fromTz = document.getElementById('fromTz').value;
  const toTz = document.getElementById('toTz').value;
  const timeStr = document.getElementById('fromTime').value;
  if (!/^(\d|[01]\d|2[0-3]):[0-5]\d$/.test(timeStr)) {
    document.getElementById('convertResult').textContent = '--:--';
    return;
  }
  
  const [hours, minutes] = timeStr.split(':').map(Number);
  const today = dayjs().tz(fromTz).hour(hours).minute(minutes).second(0);
  const converted = today.tz(toTz);
  
  const dayDiff = converted.startOf('day').diff(today.startOf('day'), 'day');
  const resultStr = converted.format('HH:mm');
  let dayStr = '';
  if (dayDiff > 0) dayStr = ` (+${dayDiff}d)`;
  else if (dayDiff < 0) dayStr = ` (${dayDiff}d)`;
  
  document.getElementById('convertResult').textContent = resultStr + dayStr;
}

document.addEventListener('DOMContentLoaded', () => {
  ['fromTz', 'toTz'].forEach(id => document.getElementById(id).addEventListener('change', convertTime));
  document.getElementById('fromTime').addEventListener('input', convertTime);
  populateDropdowns();
  document.getElementById('fromTime').value = dayjs().tz(TIMEZONES.pt.tz).format('HH:mm');
  updateClocks();
  convertTime();
  setInterval(updateClocks, 1000);
});
