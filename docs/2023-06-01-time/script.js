dayjs.extend(dayjs_plugin_utc);
dayjs.extend(dayjs_plugin_timezone);

const TIMEZONES = {
  pt:  { tz: 'America/Los_Angeles', label: 'PT',  city: 'Santa Clara', domId: 'pst',   labelId: 'ptLabel' },
  kst: { tz: 'Asia/Seoul',          label: 'KST', city: 'Seoul',       domId: 'seoul', labelId: 'kstLabel' },
  et:  { tz: 'America/New_York',    label: 'ET',  city: 'New York',    domId: 'est',   labelId: 'etLabel' },
  cst: { tz: 'Asia/Shanghai',       label: 'CST', city: 'Shanghai',    domId: 'cst',   labelId: 'cstLabel' },
  ist: { tz: 'Asia/Kolkata',        label: 'IST', city: 'Mumbai',      domId: 'ist',   labelId: 'istLabel' },
  utc: { tz: 'UTC',                 label: 'UTC', city: 'World',       domId: 'utc',   labelId: 'utcLabel' }
};

const TZ_BY_IANA = Object.fromEntries(
  Object.values(TIMEZONES).map(t => [t.tz, t])
);

const ACTIVITY_COLORS = {
  work: '#f472b6',
  lunch: '#f59e0b',
  free: '#34d399',
  dinner: '#fb7185',
  sleep: '#818cf8'
};

const SCHEDULE = [
  {
    name: 'Work',
    start: 5,
    end: 12,
    color: ACTIVITY_COLORS.work
  },
  {
    name: 'Lunch',
    start: 12,
    end: 13,
    color: ACTIVITY_COLORS.lunch
  },
  {
    name: 'Free',
    start: 13,
    end: 18,
    color: ACTIVITY_COLORS.free
  },
  {
    name: 'Dinner',
    start: 18,
    end: 19,
    color: ACTIVITY_COLORS.dinner
  },
  {
    name: 'Free',
    start: 19,
    end: 20,
    color: ACTIVITY_COLORS.free
  },
  {
    name: 'Sleep',
    start: 20,
    end: 5,
    color: ACTIVITY_COLORS.sleep
  }
];

const CLOCK = {
  cx: 140,
  cy: 140,
  r: 120,
  bg: '#263029',
  inner: '#171c18',
  tick: '#6f7a70',
  text: '#d6ddd4',
  hand: '#f4f1ea'
};

const ZONE_FORMATTERS = new Map();

function $(id) {
  return document.getElementById(id);
}

function svg(tag, attrs) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

function hourToRad(h) {
  return ((h - 6) / 24) * 2 * Math.PI;
}

function formatOffset(tz, at = dayjs()) {
  const totalMinutes = at.tz(tz).utcOffset();
  const sign = totalMinutes >= 0 ? '+' : '-';
  const absMinutes = Math.abs(totalMinutes);
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;
  return minutes === 0
    ? `${sign}${hours}`
    : `${sign}${hours}:${String(minutes).padStart(2, '0')}`;
}

function intlZoneName(tz, at = dayjs()) {
  if (!ZONE_FORMATTERS.has(tz)) {
    ZONE_FORMATTERS.set(tz, new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'short'
    }));
  }

  const parts = ZONE_FORMATTERS.get(tz).formatToParts(at.toDate());
  return parts.find(part => part.type === 'timeZoneName')?.value;
}

function zoneAbbr(info, at = dayjs()) {
  const name = intlZoneName(info.tz, at);
  return name && !/^GMT[+-]/.test(name) ? name : info.label;
}

function zoneText(info, at = dayjs()) {
  return `${info.city} (${zoneAbbr(info, at)} ${formatOffset(info.tz, at)})`;
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

function drawTimeRange(el, startKST, endKST, color, diff) {
  let start = (startKST + diff) % 24;
  let end = (endKST + diff) % 24;
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
  const { cx, cy, r, bg, inner, tick, text, hand } = CLOCK;

  const kstOffset = now.tz(TIMEZONES.kst.tz).utcOffset() / 60;
  const thisOffset = now.tz(tz).utcOffset() / 60;
  const diff = thisOffset - kstOffset;

  el.appendChild(svg('circle', { cx, cy, r, fill: bg }));

  SCHEDULE.forEach(({ start, end, color }) => {
    drawTimeRange(el, start, end, color, diff);
  });

  el.appendChild(svg('circle', { cx, cy, r: r * 0.5, fill: inner }));

  for (let h = 0; h < 24; h++) {
    const angle = hourToRad(h);
    el.appendChild(svg('line', {
      x1: cx + (r - 8) * Math.cos(angle), y1: cy + (r - 8) * Math.sin(angle),
      x2: cx + r * Math.cos(angle), y2: cy + r * Math.sin(angle),
      stroke: tick, 'stroke-width': h % 3 === 0 ? 2 : 1
    }));
    if (h % 3 === 0) {
      const lbl = svg('text', {
        x: cx + (r + 14) * Math.cos(angle), y: cy + (r + 14) * Math.sin(angle),
        'text-anchor': 'middle', 'dominant-baseline': 'middle', 'font-size': 16, 'font-weight': 600, fill: text
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
    stroke: hand, 'stroke-width': 3, 'stroke-linecap': 'round'
  }));
  el.appendChild(svg('circle', { cx, cy, r: 5, fill: hand }));
}

function isInRange(hour, start, end) {
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

function updateCurrentActivity(now) {
  const current = now.tz(TIMEZONES.kst.tz);
  const hour = current.hour() + current.minute() / 60 + current.second() / 3600;
  const block = SCHEDULE.find(({ start, end }) => isInRange(hour, start, end));
  const el = $('currentActivity');
  if (!block || !el) return;

  const ptNow = now.tz(TIMEZONES.pt.tz);
  el.innerHTML = `<span class="font-semibold" style="color: ${block.color}">${block.name}</span> now: ${current.format('HH:mm')} KST / ${ptNow.format('HH:mm')} ${zoneAbbr(TIMEZONES.pt, now)}`;
}

function updateClocks() {
  const now = dayjs();

  Object.values(TIMEZONES).forEach((info) => {
    const t = now.tz(info.tz);
    $(`${info.domId}Date`).textContent = t.format('YYYY-MM-DD');
    $(`${info.domId}Clock`).textContent = t.format('HH:mm:ss');
    const labelEl = $(info.labelId);
    if (labelEl) labelEl.textContent = zoneText(info, now);
  });

  ['fromTz', 'toTz'].forEach(id => {
    const select = $(id);
    Array.from(select.options).forEach(opt => {
      const info = TZ_BY_IANA[opt.value];
      if (info) opt.textContent = zoneText(info, now);
    });
  });

  drawClock($('clockPT'), TIMEZONES.pt.tz, now);
  drawClock($('clockKST'), TIMEZONES.kst.tz, now);
  updateCurrentActivity(now);
}

function populateDropdowns() {
  ['fromTz', 'toTz'].forEach(id => {
    const select = $(id);
    const defaultKey = select.dataset.default;
    select.innerHTML = '';
    Object.entries(TIMEZONES).forEach(([key, info]) => {
      const opt = document.createElement('option');
      opt.value = info.tz;
      opt.textContent = zoneText(info);
      if (key === defaultKey) opt.selected = true;
      select.appendChild(opt);
    });
  });
}

function convertTime() {
  const fromTz = $('fromTz').value;
  const toTz = $('toTz').value;
  const timeStr = $('fromTime').value;
  if (!/^(\d|[01]\d|2[0-3]):[0-5]\d$/.test(timeStr)) {
    $('convertResult').textContent = '--:--';
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

  $('convertResult').textContent = resultStr + dayStr;
}

function renderLegend() {
  const legend = $('scheduleLegend');
  const unique = SCHEDULE.filter((item, index) => (
    SCHEDULE.findIndex(candidate => candidate.name === item.name) === index
  ));
  legend.innerHTML = unique.map(item => `
    <span class="flex items-center whitespace-nowrap">
      <span class="inline-block w-3 h-3 rounded mr-1" style="background: ${item.color}"></span>
      <span>${item.name}</span>
    </span>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  ['fromTz', 'toTz'].forEach(id => $(id).addEventListener('change', convertTime));
  $('fromTime').addEventListener('input', convertTime);
  renderLegend();
  populateDropdowns();
  $('fromTime').value = dayjs().tz(TIMEZONES.pt.tz).format('HH:mm');
  updateClocks();
  convertTime();
  setInterval(updateClocks, 1000);
});
