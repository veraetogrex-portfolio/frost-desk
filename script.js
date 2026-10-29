// Frost Desk — github.com/veraetogrex-portfolio · zero dependencies
// Every page blurs into the next: the content layer dissolves into the frosted glass,
// swaps, and comes back into focus while its numbers count up and its charts draw.

const desk    = document.querySelector('#desk');
const content = desk.querySelector('.fd-content');
const pages   = [...desk.querySelectorAll('.fd-page')];
const navs    = [...desk.querySelectorAll('.fd-nav button')];
const glint   = desk.querySelector('.fd-glint');
const $ = s => desk.querySelector(s);

// data
const WEEK = [['Mon', .52], ['Tue', .74], ['Wed', .61], ['Thu', .93], ['Fri', .8], ['Sat', .3], ['Sun', .22]];
const PROJECTS = [['ATL', 'Atlas · web app', 84, 'Due Nov 14'], ['NWD', 'Northwind · mobile', 62, 'Due Nov 28'],
                  ['HLO', 'Halo · UI kit', 47, 'Due Dec 05'], ['ORB', 'Orbit · platform', 31, 'Due Dec 19']];
const VELOCITY = [[0, 250], [60, 236], [120, 246], [182, 200], [240, 214], [300, 168], [364, 176], [420, 128], [480, 112], [540, 70]];
const TIME = [['#7c6cff', 38], ['#3fe0d0', 27], ['#c9c2ff', 21], ['rgba(255,255,255,.45)', 14]];

// tiny tween → resolves true when done; every page switch bumps `gen` and cancels the rest
const ease = { in: t => t ** 3, out: t => 1 - (1 - t) ** 3, io: t => t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2,
               back: t => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2 };
let gen = 0;
const tween = (ms, fn, e = ease.io, delay = 0) => new Promise(done => {
  const g = gen, t0 = performance.now() + delay;
  const step = now => {
    if (g !== gen) return done(false);
    const p = Math.max(0, Math.min(1, (now - t0) / ms));
    if (now >= t0) fn(e(p));
    p < 1 ? requestAnimationFrame(step) : done(true);
  };
  requestAnimationFrame(step);
});
const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// build the widgets
$('.fd-bars').innerHTML = WEEK.map(([d, v], i) => `<div class="${i === 3 ? 'is-hi' : ''}"><i style="height:${v * 150}px"></i>${d}</div>`).join('');
$('.fd-projects').innerHTML = PROJECTS.map(([code, name, , due]) => `<div class="fd-card fd-project"><b>${code}</b><p class="fd-muted">${name}</p>
  <div class="fd-ring"><svg viewBox="0 0 164 164"><circle cx="82" cy="82" r="66"/><circle cx="82" cy="82" r="66" pathLength="100"/></svg><span>0%</span></div>
  <p class="fd-muted">${due}</p></div>`).join('');
const line = VELOCITY.reduce((d, [x, y], i, a) => i ? d + `C${(a[i - 1][0] + x) / 2},${a[i - 1][1]} ${(a[i - 1][0] + x) / 2},${y} ${x},${y}` : `M${x},${y}`, '');
$('.fd-stroke').setAttribute('d', line);
$('.fd-area').setAttribute('d', line + 'L540,300L0,300Z');
const donut = $('.fd-donut svg');
TIME.forEach(([color]) => donut.insertAdjacentHTML('beforeend', `<circle cx="120" cy="120" r="94" pathLength="100" stroke="${color}"/>`));

function zero(i) {   // put a page back to its empty state before it comes in
  if (i === 0) { $('[data-count]').textContent = '0'; desk.querySelectorAll('.fd-bars i').forEach(b => b.style.transform = 'scaleY(0)'); }
  if (i === 1) desk.querySelectorAll('.fd-ring circle:last-child').forEach((c, k) => {
    c.style.stroke = PROJECTS[k][2] >= 80 ? '#3fe0d0' : '#7c6cff'; c.setAttribute('stroke-dasharray', '0 100'); });
  if (i === 2) { $('.fd-stroke').setAttribute('stroke-dashoffset', 1); $('.fd-area').style.opacity = 0; $('.fd-dot').style.opacity = 0;
    donut.querySelectorAll('circle:not(:first-child)').forEach(c => c.setAttribute('stroke-dasharray', '0 100')); }
}

let current = 0, busy = false, queued = null;

async function go(i) {
  if (i === current && !busy) return;
  if (busy) { queued = i; return; }
  busy = true; gen++;
  navs.forEach((b, k) => b.classList.toggle('is-on', k === i));
  $('.fd-pill').style.transform = `translateY(${i * 84}px)`;

  // 1 · blur the content out: only the scene shows through the glass
  await tween(380, t => {
    content.style.filter = `blur(${26 * t}px)`;
    content.style.opacity = 1 - t;
    content.style.transform = `scale(${1 - .02 * t})`;
  }, ease.in);

  // 2 · swap the page while nothing is readable
  pages.forEach((p, k) => p.classList.toggle('is-on', k === i));
  zero(i); current = i;
  ENTER[i]();

  // 3 · bring it back into focus while its widgets animate in
  await tween(380, t => {
    content.style.filter = `blur(${26 * (1 - t)}px)`;
    content.style.opacity = t;
    content.style.transform = `scale(${1.02 - .02 * t})`;
  }, ease.out);
  content.style.filter = content.style.transform = '';
  busy = false;
  if (queued !== null && queued !== current) { const q = queued; queued = null; go(q); }
  queued = null;
}

// page entrances, run while the blur clears
const ENTER = [
  // 4 · Overview: count up to 1 284 while the bars grow 120 ms apart
  () => {
    desk.querySelectorAll('.fd-bars i').forEach((b, k) =>
      tween(420, t => b.style.transform = `scaleY(${t})`, ease.back, 60 + k * 120));
    tween(920, t => $('[data-count]').textContent = fmt(Math.round(1284 * t)), ease.out);
  },
  // 5 · Projects: progress rings fill one after another
  () => desk.querySelectorAll('.fd-ring').forEach((ring, k) => tween(900, t => {
    const v = PROJECTS[k][2] * t;
    ring.querySelector('circle:last-child').setAttribute('stroke-dasharray', `${v} 100`);
    ring.querySelector('span').textContent = Math.round(v) + '%';
  }, ease.out, k * 110)),
  // 6 · Reports: the donut assembles, the velocity line draws itself
  async () => {
    let from = 0;
    donut.querySelectorAll('circle:not(:first-child)').forEach((c, k) => {
      const [, v] = TIME[k], off = from; from += v;
      tween(420, t => {
        c.setAttribute('stroke-dasharray', `${Math.max(0, v * t - .8)} 100`);
        c.setAttribute('stroke-dashoffset', -off);
      }, ease.out, 200 + k * 170);
    });
    tween(1000, t => $('[data-hours]').textContent = Math.round(312 * t), ease.out);
    const drawn = await tween(900, t => {
      $('.fd-stroke').setAttribute('stroke-dashoffset', 1 - t);
      $('.fd-area').style.opacity = t * t;
    });
    if (!drawn) return;
    // 7 · the line lands: a glint sweeps across the glass
    $('.fd-dot').style.opacity = 1;
    glint.classList.remove('is-on'); void glint.offsetWidth; glint.classList.add('is-on');
    await tween(220, t => $('.fd-dot').setAttribute('r', 4 + 5 * ease.back(t)));
  },
  // 8 · Settings: form rows rise in 70 ms apart
  () => pages[3].querySelectorAll('label, .fd-save').forEach((row, k) => row.animate(
    [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }],
    { duration: 420, delay: k * 70, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' })),
];

navs.forEach((b, i) => b.addEventListener('click', () => go(i)));
addEventListener('keydown', e => {
  if (e.target.matches('input')) return;
  if (e.key >= '1' && e.key <= '4') go(+e.key - 1);
});

[0, 1, 2].forEach(zero);
ENTER[0]();
