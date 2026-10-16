"use strict";
const MILESTONES = [
  {t:"Boshlanish", d:"2008-10-19", p:"Tug'ildim. 19-oktabr, 2008."},
  {t:"PDP Academy: Foundation", d:"Poydevor", p:"Dasturlash asoslarini PDP Academy'ning foundation kursida o'rgandim."},
  {t:"PDP Junior: Frontend", d:"Bitirdim", p:"Frontend yo'nalishini tugatib, sertifikat oldim."},
  {t:"PDP University", d:"Hozir", p:"Universitet talabasiman va frontend ko'nikmalarimni chuqurlashtiryapman."}
];
const SKILLS = [
  ["HTML", 90, "Semantik va qulay markup"],
  ["CSS", 85, "Flex, Grid, animatsiyalar"],
  ["JavaScript", 75, "DOM, ES6+, API bilan ishlash"],
  ["Python", 55, "Serverlar va skriptlar"]
];

const $ = (s) => document.querySelector(s);
$("#yr").textContent = new Date().getFullYear();

/* Yosh */
(() => {
  const b = new Date(2008, 9, 19), n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n < new Date(n.getFullYear(), 9, 19)) a--;
  $("#age").textContent = a + " yosh";
})();

/* Blok zanjiri: har bir blok hash'i oldingisiga bog'liq (SHA-256) */
async function sha256(s){
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2,"0")).join("");
}
async function buildChain(){
  const ol = $("#blocks");
  let prev = "0".repeat(64);
  for (let i = 0; i < MILESTONES.length; i++){
    const m = MILESTONES[i];
    let hash;
    try { hash = await sha256(prev + m.t + m.d + m.p); }
    catch { hash = "hash faqat https yoki localhost'da hisoblanadi"; }
    const li = document.createElement("li");
    li.className = "block";
    li.innerHTML = `<button type="button" aria-expanded="false">
      <span class="when">#${i} · ${m.d}</span><h3>${m.t}</h3><p>${m.p}</p>
      <div class="hash">oldingi: <b>${prev.slice(0,24)}…</b><br>hash: <b>${hash.slice(0,48)}…</b></div></button>`;
    const btn = li.querySelector("button");
    btn.addEventListener("click", () => {
      const open = li.classList.toggle("open");
      btn.setAttribute("aria-expanded", open);
    });
    ol.appendChild(li);
    prev = hash;
  }
}
buildChain();

/* Ko'nikmalar */
const sl = $("#skillList");
SKILLS.forEach(([n, v, d]) => {
  const li = document.createElement("li");
  li.innerHTML = `<strong>${n}</strong><div class="bar"><i data-w="${v}"></i></div><small>${v}% · ${d}</small>`;
  sl.appendChild(li);
});
new IntersectionObserver((es, o) => es.forEach(e => {
  if (e.isIntersecting){ e.target.querySelectorAll("i").forEach(i => i.style.width = i.dataset.w + "%"); o.unobserve(e.target); }
}), {threshold:.3}).observe(sl);

/* "Hamyon" tugmasi: ulangan holat (namuna) */
const w = $("#wallet");
w.addEventListener("click", async () => {
  if (w.classList.toggle("on")){
    const id = (await sha256("abdulaziz" + navigator.userAgent)).slice(0,6);
    w.textContent = "0x" + id + "…ulandi";
  } else w.textContent = "Ulanish";
});

/* Rasm uchun yengil 3D egilish */
const tilt = $("#tilt");
if (matchMedia("(hover:hover) and (prefers-reduced-motion:no-preference)").matches){
  tilt.addEventListener("pointermove", e => {
    const r = tilt.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    tilt.style.transform = `perspective(900px) rotateY(${x*8}deg) rotateX(${-y*8}deg)`;
  });
  tilt.addEventListener("pointerleave", () => tilt.style.transform = "");
}

/* Fon: tugunlar tarmog'i */
(() => {
  const c = $("#net"), g = c.getContext("2d");
  if (matchMedia("(prefers-reduced-motion:reduce)").matches) return;
  let W, H, pts = [];
  const size = () => { W = c.width = innerWidth; H = c.height = innerHeight;
    pts = Array.from({length: Math.min(70, Math.floor(W*H/22000))}, () =>
      ({x:Math.random()*W, y:Math.random()*H, vx:(Math.random()-.5)*.3, vy:(Math.random()-.5)*.3})); };
  size(); addEventListener("resize", size);
  (function loop(){
    g.clearRect(0,0,W,H);
    for (const p of pts){
      p.x += p.vx; p.y += p.vy;
      if (p.x<0||p.x>W) p.vx*=-1; if (p.y<0||p.y>H) p.vy*=-1;
    }
    for (let i=0;i<pts.length;i++){
      g.fillStyle="#2cf2c0"; g.fillRect(pts[i].x,pts[i].y,2,2);
      for (let j=i+1;j<pts.length;j++){
        const d = Math.hypot(pts[i].x-pts[j].x, pts[i].y-pts[j].y);
        if (d<140){ g.strokeStyle=`rgba(124,92,255,${1-d/140})`; g.beginPath();
          g.moveTo(pts[i].x,pts[i].y); g.lineTo(pts[j].x,pts[j].y); g.stroke(); }
      }
    }
    requestAnimationFrame(loop);
  })();
})();

/* Aloqa formasi → Python serveri; ishlamasa Telegram'ga yo'naltiradi */
$("#form").addEventListener("submit", async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  const msg = $("#formMsg");
  try {
    const r = await fetch("/api/contact", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data)});
    if (!r.ok) throw 0;
    msg.textContent = "Xabar yuborildi. Rahmat!"; e.target.reset();
  } catch {
    msg.textContent = "Server ishlamayapti. Telegram orqali yozing: @oo7_AAB";
    window.open("https://t.me/oo7_AAB?text=" + encodeURIComponent(data.message || ""), "_blank");
  }
});
