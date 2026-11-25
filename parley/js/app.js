const $ = (s) => document.querySelector(s);
const scenarios = JSON.parse(JSON.stringify(SCENARIOS)); // working copy, so edits never touch the templates
const COLORS = ["#7C6CFF", "#FF6B81", "#2DD4A7", "#FFC247", "#38BDF8"];
const EMOJIS = ["🧑‍💼", "🏢", "🛒", "🏷️", "🧑‍💻", "📣", "🛠️", "🧮", "⚖️", "🏥", "🎓", "🚚"];
const state = { step: 0, sc: null, mode: "sim", you: 0, pers: {} };
const STEPS = ["Scenario", "Agents", "Review"];
const sc = () => scenarios[state.sc];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const lines = (s) => String(s || "").split("\n").map((x) => x.trim()).filter(Boolean);

function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast.id); toast.id = setTimeout(() => t.classList.remove("show"), 2800); }
function ensurePers() { sc().agents.forEach((a, k) => { if (!state.pers[a.id]) state.pers[a.id] = ["aggressive", "collaborative", "risk"][k % 3]; }); }
function pickScenario(i) { state.sc = i; state.you = 0; state.pers = {}; ensurePers(); render(); }

/* ---------- dialog form ---------- */
function openForm(title, html, onSave) {
  const d = $("#dlg");
  d.innerHTML = `<form id="f"><h2>${title}</h2>${html}<p class="err" id="err" role="alert"></p><div class="acts"><button type="button" class="ghost" id="cancel">Cancel</button><button class="primary" type="submit">Save</button></div></form>`;
  d.showModal();
  $("#cancel").onclick = () => d.close();
  $("#f").onsubmit = (e) => { e.preventDefault(); const err = onSave(new FormData(e.target)); if (err) { $("#err").textContent = err; return; } d.close(); };
}

function newScenarioForm() {
  openForm("Create your own scenario", `
    <label>Scenario name<input name="name" maxlength="50" placeholder="e.g. Rent negotiation" required></label>
    <label>What is being negotiated?<input name="topic" maxlength="60" placeholder="e.g. Rent · lease length · deposit"></label>
    <label>Short description (optional)<textarea name="tag" rows="2" maxlength="120"></textarea></label>
    <label>Maximum rounds<select name="rounds"><option>6</option><option selected>8</option><option>10</option><option>12</option></select></label>
    <p class="note">You start with two roles. Edit them next, or add up to two more.</p>`, (f) => {
    const name = f.get("name").trim(); if (!name) return "Give the scenario a name.";
    const blank = (r, s) => ({ id: "c" + Date.now() + r, emoji: r === "a" ? "🧑‍💼" : "🏢", role: "Party " + r.toUpperCase(), side: s, color: COLORS[r === "a" ? 0 : 1], wants: ["Add your goals"], limits: ["Add your limits"], fallback: "Add a fallback option" });
    scenarios.push({ id: "custom-" + Date.now(), icon: "✨", name, color: "#FFC247", tagline: f.get("tag").trim() || "Your own negotiation setup.", topic: f.get("topic").trim() || "Custom topic", level: "Custom", rounds: +f.get("rounds"), agents: [blank("a", "Side A"), blank("b", "Side B")] });
    state.step = 1; pickScenario(scenarios.length - 1); toast("Now edit each role to set its goals.");
  });
}

function roleForm(idx) {
  const s = sc(), a = idx === null ? { emoji: EMOJIS[0], role: "", side: "", wants: [], limits: [], fallback: "" } : s.agents[idx];
  openForm(idx === null ? "Add a role" : "Edit role", `
    <div class="emo" role="radiogroup" aria-label="Avatar">${EMOJIS.map((e) => `<label><input type="radio" name="emoji" value="${e}" ${e === a.emoji ? "checked" : ""}><span>${e}</span></label>`).join("")}</div>
    <label>Role title<input name="role" maxlength="40" value="${esc(a.role)}" placeholder="e.g. Landlord" required></label>
    <label>Side<input name="side" maxlength="30" value="${esc(a.side)}" placeholder="e.g. Property owner"></label>
    <label>Goals, one per line<textarea name="wants" rows="3" placeholder="Monthly rent near $900">${esc(a.wants.join("\n"))}</textarea></label>
    <label>Hard limits, one per line<textarea name="limits" rows="3" placeholder="Never below $800">${esc(a.limits.join("\n"))}</textarea></label>
    <label>Fallback if talks fail<input name="fb" maxlength="80" value="${esc(a.fallback)}" placeholder="e.g. List the flat to other tenants"></label>`, (f) => {
    const role = f.get("role").trim(), wants = lines(f.get("wants"));
    if (!role) return "Give the role a title."; if (!wants.length) return "Add at least one goal.";
    const next = { id: idx === null ? "c" + Date.now() : a.id, color: idx === null ? COLORS[s.agents.length % COLORS.length] : a.color, emoji: f.get("emoji") || EMOJIS[0], role, side: f.get("side").trim() || "Party", wants, limits: lines(f.get("limits")), fallback: f.get("fb").trim() || "Walk away" };
    if (idx === null) s.agents.push(next); else s.agents[idx] = next;
    ensurePers(); render();
  });
}

/* ---------- views ---------- */
const scene = (s, cls = "") => `<div class="scene ${cls}">${s.agents.map((a) => `<span class="av" style="--c:${a.color}">${esc(a.emoji)}</span>`).join('<span class="vs"></span>')}</div>`;

function viewScenario() {
  return `<section class="page"><h1>Choose a negotiation scenario</h1>
  <p class="sub">Start from a ready-made template, or create your own with custom roles.</p>
  <div class="cards">${scenarios.map((s, i) => `
    <button class="scn" style="--c:${s.color}" aria-pressed="${state.sc === i}" data-sc="${i}"><span class="check">✓</span>${scene(s)}
      <h2>${esc(s.name)}</h2><p>${esc(s.tagline)}</p>
      <div class="facts"><span>${s.agents.length} agents</span><span>${s.level}</span><span>≈ ${s.rounds} rounds</span></div>
      <div class="topic">${esc(s.topic)}</div></button>`).join("")}
    <button class="scn new" data-new="1"><span class="plus">+</span><h2>Create your own</h2><p>Name your scenario, define the roles, goals and limits.</p></button></div></section>`;
}

function roleCard(a, i) {
  const prac = state.mode === "prac", you = prac && state.you === i, p = PERSONALITIES[state.pers[a.id]], n = sc().agents.length;
  const li = (arr) => arr.map((x) => `<li>${esc(x)}</li>`).join("");
  return `<article class="role${you ? " you" : ""}" style="--c:${a.color}">
    <div class="rh"><span class="av lg">${esc(a.emoji)}</span><div><h3>${esc(a.role)}${you ? '<em class="badge">You</em>' : ""}</h3><small>${esc(a.side)}</small></div>
      <div class="racts">${prac && !you ? `<button class="ghost" data-you="${i}">Play this role</button>` : ""}<button class="ghost" data-edit="${i}">Edit</button>${n > 2 ? `<button class="ghost" data-del="${i}" aria-label="Remove ${esc(a.role)}">✕</button>` : ""}</div></div>
    <div class="blk"><h4>Wants</h4><ul class="ok">${li(a.wants)}</ul></div>
    ${a.limits.length ? `<div class="blk"><h4>Won’t cross</h4><ul class="no">${li(a.limits)}</ul></div>` : ""}
    <div class="blk"><h4>Fallback if talks fail</h4><ul class="fb">${li([a.fallback])}</ul></div>
    ${you ? `<div class="human">You will type your own offers in the arena, so no AI personality is needed for this role.</div>` : `
    <div class="blk"><h4>Negotiation personality</h4>
      <div class="seg" role="radiogroup">${Object.entries(PERSONALITIES).map(([k, v]) => `<button role="radio" aria-checked="${state.pers[a.id] === k}" data-a="${a.id}" data-p="${k}">${v.icon}<span>${v.name}</span></button>`).join("")}</div>
      <p class="pd">${p.text}</p>${METERS.map(([l, k]) => `<div class="m"><span>${l}</span><i><b style="width:${p[k]}%"></b></i></div>`).join("")}
      <blockquote>“${p.line}”</blockquote></div>`}</article>`;
}

function viewAgents() {
  const s = sc();
  return `<section class="page"><h1>Set up the agents</h1>
  <p class="sub">${esc(s.icon)} ${esc(s.name)}. Choose how the session runs, edit the roles, then give each agent a personality.</p>
  <div class="modes">${[["sim", "Simulation mode", "Watch AI agents negotiate with each other.", "👀"], ["prac", "Practice mode", "Play one role against the AI.", "🎮"]].map((m) => `
    <button class="mode" aria-pressed="${state.mode === m[0]}" data-m="${m[0]}"><span>${m[3]}</span><div><b>${m[1]}</b><small>${m[2]}</small></div></button>`).join("")}</div>
  <div class="roles n${s.agents.length}">${s.agents.map(roleCard).join("")}
    ${s.agents.length < 4 ? `<button class="add" data-addrole="1"><span class="plus">+</span>Add a role</button>` : ""}</div></section>`;
}

function viewReview() {
  const s = sc(), prac = state.mode === "prac";
  const who = (a, i) => (prac && state.you === i) ? "You (human)" : PERSONALITIES[state.pers[a.id]].icon + " " + PERSONALITIES[state.pers[a.id]].name + " AI";
  const names = s.agents.map((a) => `<b>${esc(a.role)}</b>`);
  const list = names.length > 1 ? names.slice(0, -1).join(", ") + " and " + names[names.length - 1] : names[0];
  const li = (arr) => arr.length ? `<ul>${arr.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "–";
  return `<section class="page"><h1>Setup summary</h1><p class="sub">Check the details, then start the negotiation.</p>
  <div class="brief" style="--c:${s.color}">
    <h2>${esc(s.icon)} ${esc(s.name)}</h2>
    <p>${prac ? "In <b>Practice mode</b>, you negotiate against AI agents." : "In <b>Simulation mode</b>, AI agents negotiate with each other while you watch."} The parties are ${list}, negotiating over <b>${esc(s.topic.toLowerCase())}</b>. The session runs for up to <b>${s.rounds} rounds</b> and ends earlier if someone accepts or rejects a deal.</p>
  </div>
  <div class="tbl"><table>
    <thead><tr><th>Role</th><th>Played by</th><th>Wants</th><th>Won’t cross</th><th>Fallback</th></tr></thead>
    <tbody>${s.agents.map((a, i) => `<tr style="--c:${a.color}"><td class="rl"><span class="dot">${esc(a.emoji)}</span><div><b>${esc(a.role)}</b><small>${esc(a.side)}</small></div></td><td>${who(a, i)}</td><td>${li(a.wants)}</td><td>${li(a.limits)}</td><td>${esc(a.fallback)}</td></tr>`).join("")}</tbody>
  </table></div></section>`;
}

function renderBar() {
  const off = state.step === 0 && state.sc === null, labels = ["Continue to agents", "Review setup", "Start negotiation"];
  $("#bar").innerHTML = `${state.step > 0 ? `<button class="ghost" data-nav="-1">Back</button>` : "<span></span>"}<span class="hint">${off ? "Select a scenario to continue" : state.step === 2 ? "Everything looks good? Start when ready" : ""}</span><button class="primary" data-nav="1" ${off ? "disabled" : ""}>${labels[state.step]}</button>`;
}

function render() {
  $("#steps").innerHTML = STEPS.map((l, i) => `<li class="${i === state.step ? "cur" : i < state.step ? "done" : ""}"><span>${i < state.step ? "✓" : i + 1}</span>${l}</li>`).join("");
  $("#view").innerHTML = [viewScenario, viewAgents, viewReview][state.step]();
  renderBar();
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("button"); if (!t || t.closest("dialog")) return;
  const d = t.dataset;
  if (d.sc) return pickScenario(+d.sc);
  if (d.new) return newScenarioForm();
  if (d.addrole) return roleForm(null);
  if (d.edit) return roleForm(+d.edit);
  if (d.del) { const i = +d.del; sc().agents.splice(i, 1); if (state.you === i) state.you = 0; else if (state.you > i) state.you--; return render(); }
  if (d.m) { state.mode = d.m; return render(); }
  if (d.you) { state.you = +d.you; return render(); }
  if (d.p) { state.pers[d.a] = d.p; return render(); }
  if (d.nav) {
    if (state.step === 2 && d.nav === "1") return toast("Setup complete. The Negotiation Arena opens here.");
    state.step += +d.nav; render(); window.scrollTo({ top: 0, behavior: "smooth" });
  }
});
render();
