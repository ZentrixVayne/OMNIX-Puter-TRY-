// ==========================================
// OMNIX CORE v36.0 (Puter.js AI + Detailed Views)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {

    // --- SUPABASE INITIALIZATION ---
    const SUPABASE_URL = 'https://gpxknxzigncdpvxisoaq.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdweGtueHppZ25jZHB2eGlzb2FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4ODg4NDQsImV4cCI6MjEwMDQ2NDg0NH0.ftVXt9kTUneeuOZnXAdL2wyDp56ZYdg5wzDl7tuRfuU';
    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    try { if (window.puter) puter.quiet = true; } catch (e) {}

    const LOGO_URL = 'logo.png';
    let realtimeChannel = null;
    let tourStep = 0;

    const getDefaultDB = () => ({
      onboardingComplete: false, tourCompleted: false, theme: 'blue', 
      lastNotifCheck: Date.now(), updatedAt: Date.now(),
      logs: [
        { time: new Date().toLocaleTimeString(), text: "System initialized successfully." },
        { time: new Date().toLocaleTimeString(), text: "AI Engine Puter.js connected." }
      ],
      missions: [], 
      workers: [
        { id: 'W-01', name: 'ATLAS', role: 'Research Specialist', load: 45, status: 'Active', tasks: 4 },
        { id: 'W-02', name: 'ECHO', role: 'Synthesis Engine', load: 92, status: 'Active', tasks: 9 },
        { id: 'W-03', name: 'NOVA', role: 'Strategy AI', load: 28, status: 'Idle', tasks: 1 },
        { id: 'W-04', name: 'ORION', role: 'Verification Bot', load: 67, status: 'Active', tasks: 6 },
        { id: 'W-05', name: 'PULSE', role: 'Analytics Core', load: 50, status: 'Active', tasks: 3 }
      ],
      approvals: [], notifications: [] 
    });

    let db = getDefaultDB();
    let sessionUser = null; 
    let isLoginMode = true; 
    let currentRoute = 'dashboard', currentTitle = 'Overview', currentProjectId = null, autoExecInterval = null;
    const app = document.getElementById('app');
    const modalContainer = document.getElementById('modal-container');

    // ==========================================
    // ONBOARDING TOUR LOGIC
    // ==========================================
    const tourSteps = [
        { selector: null, title: "Welcome to OMNIX", text: "Welcome, Director. I am your OMNIX Guide. I'll walk you through your new Mission Control. Let's start by exploring the interface.", position: "center" },
        { selector: "#search-bar-trigger", title: "Command Palette", text: "Press Ctrl+K or click here to instantly search for pages, missions, or actions. Your central command hub.", position: "bottom" },
        { selector: "button[onclick*=\"navigate('create'\"]", title: "Create Mission", text: "Click here to define your mission. The AI will analyze your parameters, extract the Mission DNA, and build a structured task plan.", position: "left" },
        { selector: ".nav-item[data-route='workers']", title: "Digital Workforce", text: "Meet your autonomous digital workers (ATLAS, ECHO, NOVA). Once your mission is generated, assign tasks to them and watch them execute.", position: "right" },
        { selector: ".nav-item[data-title='System Preferences']", title: "System Preferences", text: "Customize your interface here. Try the Dark or Light themes. You are now ready to execute the impossible. Tour complete!", position: "right" }
    ];

    function startTour() {
        const overlay = document.getElementById('tour-overlay');
        if (!overlay) return;
        overlay.style.display = 'block';
        setTimeout(() => { overlay.classList.add('active'); }, 10);
        tourStep = 0; renderTourStep();
    }

    function renderTourStep() {
        const step = tourSteps[tourStep];
        const spotlight = document.getElementById('tour-spotlight');
        const tooltip = document.getElementById('tour-tooltip');
        if (!step || !spotlight || !tooltip) { endTour(); return; }
        if (step.selector) {
            const el = document.querySelector(step.selector);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                setTimeout(() => { updateTourPositions(step, el, spotlight, tooltip); }, 300);
                return;
            }
        }
        updateTourPositions(step, null, spotlight, tooltip);
    }

    function updateTourPositions(step, el, spotlight, tooltip) {
        let rect = { top: window.innerHeight/2, left: window.innerWidth/2, width: 0, height: 0 };
        let pos = step.position;
        if (el) {
            const r = el.getBoundingClientRect(); const padding = 8;
            rect = { top: r.top - padding, left: r.left - padding, width: r.width + (padding * 2), height: r.height + (padding * 2) };
        } else { pos = "center"; }
        spotlight.style.top = rect.top + 'px'; spotlight.style.left = rect.left + 'px';
        spotlight.style.width = rect.width + 'px'; spotlight.style.height = rect.height + 'px';
        spotlight.style.display = el ? 'block' : 'none';
        tooltip.innerHTML = `<div class="tour-guide-avatar">AI</div><div class="tour-title">${step.title}</div><div class="tour-text">${step.text}</div><div class="tour-actions"><a class="tour-skip" onclick="endTour()">Skip Tour</a><button class="btn btn-primary-sm" onclick="nextTourStep()">${tourStep === tourSteps.length - 1 ? 'Finish' : 'Next'}</button></div>`;
        const tooltipWidth = 320; const tooltipHeight = 220; let top, left;
        if (pos === 'center') { top = (window.innerHeight / 2) - (tooltipHeight / 2); left = (window.innerWidth / 2) - (tooltipWidth / 2); } 
        else if (pos === 'bottom') { top = rect.top + rect.height + 15; left = rect.left + (rect.width / 2) - (tooltipWidth / 2); } 
        else if (pos === 'top') { top = rect.top - tooltipHeight - 15; left = rect.left + (rect.width / 2) - (tooltipWidth / 2); } 
        else if (pos === 'right') { top = rect.top + (rect.height / 2) - (tooltipHeight / 2); left = rect.left + rect.width + 15; } 
        else if (pos === 'left') { top = rect.top + (rect.height / 2) - (tooltipHeight / 2); left = rect.left - tooltipWidth - 15; }
        if (left < 10) left = 10;
        if (left + tooltipWidth > window.innerWidth - 10) left = window.innerWidth - tooltipWidth - 10;
        if (top < 10) top = 10;
        if (top + tooltipHeight > window.innerHeight - 10) top = window.innerHeight - tooltipHeight - 10;
        tooltip.style.top = top + 'px'; tooltip.style.left = left + 'px';
        tooltip.className = 'tour-tooltip active arrow-' + pos;
        if (pos === 'center') tooltip.className = 'tour-tooltip active'; 
    }

    window.nextTourStep = function() { tourStep++; renderTourStep(); };
    window.endTour = function() {
        const overlay = document.getElementById('tour-overlay');
        if (!overlay) return;
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.style.display = 'none';
            const spotlight = document.getElementById('tour-spotlight');
            const tooltip = document.getElementById('tour-tooltip');
            if(spotlight) spotlight.style.display = 'none';
            if(tooltip) tooltip.classList.remove('active');
        }, 500); 
        db.tourCompleted = true; save();
    };

    // ==========================================
    // URL STATE & DB SYNC
    // ==========================================
    function updateUrlUID(uid) {
      try {
        const url = new URL(window.location.href);
        if (uid) url.searchParams.set('uid', uid); else url.searchParams.delete('uid');
        window.history.replaceState({}, '', url);
      } catch (e) {}
    }

    async function fetchDB() {
      if (!sessionUser) return null;
      const { data, error } = await sb.from('omnix_data').select('state').eq('user_id', sessionUser.id).single();
      if (data && data.state) return data.state;
      return null;
    }

    async function saveDB() {
      if (!sessionUser) return;
      db.updatedAt = Date.now();
      const { error } = await sb.from('omnix_data').upsert({ user_id: sessionUser.id, state: { ...db } }, { onConflict: 'user_id' });
      if (error) console.error("Save error:", error);
    }
    const save = () => { saveDB(); };

    function addLog(text) {
      if (!db.logs) db.logs = [];
      db.logs.unshift({ time: new Date().toLocaleTimeString(), text });
      if (db.logs.length > 50) db.logs.pop();
      save();
    }

    // ==========================================
    // UTILITIES & CURSOR
    // ==========================================
    const confettiCanvas = document.getElementById('confetti-canvas');
    let ctx = null;
    if (confettiCanvas) { ctx = confettiCanvas.getContext('2d'); confettiCanvas.width = window.innerWidth; confettiCanvas.height = window.innerHeight; }
    let confettiParticles = [];
    function launchConfetti() {
      if (!ctx || !confettiCanvas) return;
      confettiParticles = [];
      const colors = ['#3b82f6', '#1d4ed8', '#db2777', '#10b981', '#f59e0b'];
      for (let i = 0; i < 150; i++) confettiParticles.push({ x: Math.random() * confettiCanvas.width, y: Math.random() * confettiCanvas.height - confettiCanvas.height, w: 10, h: 10, c: colors[Math.floor(Math.random() * colors.length)], v: 2 + Math.random() * 4, r: Math.random() * 360 });
      animateConfetti();
    }
    function animateConfetti() {
      if (!ctx || !confettiCanvas) return;
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      confettiParticles.forEach(p => { p.y += p.v; p.r += 1; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r * Math.PI / 180); ctx.fillStyle = p.c; ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h); ctx.restore(); });
      if (confettiParticles.some(p => p.y < confettiCanvas.height)) requestAnimationFrame(animateConfetti);
      else ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }

    const cmdPalette = document.getElementById('command-palette');
    const cmdSearch = document.getElementById('cmd-search');
    const cmdResults = document.getElementById('cmd-results');
    const cmdItems = [
      { label: 'Go to Dashboard', icon: 'dashboard', action: () => navigate('dashboard', 'Overview') },
      { label: 'Create New Mission', icon: 'mission', action: () => navigate('create', 'Create Mission') },
      { label: 'View Active Missions', icon: 'control', action: () => navigate('ops', 'Active Missions') },
      { label: 'View Team Members', icon: 'team', action: () => navigate('workers', 'Team Members') },
      { label: 'Open Approvals', icon: 'verify', action: () => navigate('approve', 'Approvals') },
      { label: 'Open Analytics', icon: 'analytics', action: () => navigate('analytics', 'Performance Reports') },
      { label: 'Toggle Dark Theme', icon: 'settings', action: () => changeTheme(db.theme === 'dark' ? 'blue' : 'dark') },
      { label: 'Toggle Light Theme', icon: 'settings', action: () => changeTheme(db.theme === 'light' ? 'blue' : 'light') },
      { label: 'Open Help Center', icon: 'help', action: () => navigate('help', 'Help Center') },
      { label: 'Open Activity Log', icon: 'menu', action: () => navigate('logs', 'Activity Log') }
    ];

    if (cmdPalette) {
      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault(); cmdPalette.classList.toggle('active');
          if (cmdPalette.classList.contains('active')) { if(cmdSearch) cmdSearch.value = ''; renderCmdResults(''); if(cmdSearch) cmdSearch.focus(); }
        }
        if (e.key === 'Escape') { cmdPalette.classList.remove('active'); closeModal(); }
      });
      cmdPalette.addEventListener('click', (e) => { if (e.target === cmdPalette) cmdPalette.classList.remove('active'); });
      if (cmdSearch) cmdSearch.addEventListener('input', (e) => renderCmdResults(e.target.value));
    }

    function renderCmdResults(query) {
      if (!cmdResults) return;
      const filtered = cmdItems.filter(item => item.label.toLowerCase().includes(query.toLowerCase()));
      cmdResults.innerHTML = filtered.map((item, idx) => `<div class="cmd-item ${idx === 0 ? 'selected' : ''}" onclick="executeCmd('${item.label}')">${icons[item.icon]} <span>${item.label}</span></div>`).join('');
    }
    window.executeCmd = function(label) { const item = cmdItems.find(i => i.label === label); if (item) { item.action(); if (cmdPalette) cmdPalette.classList.remove('active'); } };

    const dot = document.getElementById('cursor-dot');
    const outline = document.getElementById('cursor-outline');
    let mouseX = 0, mouseY = 0, outlineX = 0, outlineY = 0;
    if (dot && outline) {
      document.body.classList.add('custom-cursor-active');
      document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; dot.style.left = mouseX + 'px'; dot.style.top = mouseY + 'px'; });
      function animateCursor() { outlineX += (mouseX - outlineX) * 0.2; outlineY += (mouseY - outlineY) * 0.2; outline.style.left = outlineX + 'px'; outline.style.top = outlineY + 'px'; requestAnimationFrame(animateCursor); }
      animateCursor();
      const interactiveSelector = 'button, a, input, select, textarea, .nav-item, .theme-card, .help-category, .cmd-item, .search-bar, .hobby-chip, .tour-tooltip, .tour-skip';
      document.addEventListener('mouseover', e => {
        if (e.target.closest(interactiveSelector)) outline.classList.add('hover');
        if (e.target.closest('iframe')) { document.body.classList.remove('custom-cursor-active'); if(dot) dot.style.display = 'none'; if(outline) outline.style.display = 'none'; }
      });
      document.addEventListener('mouseout', e => {
        if (e.target.closest(interactiveSelector)) outline.classList.remove('hover');
        if (e.target.closest('iframe')) { document.body.classList.add('custom-cursor-active'); if(dot) dot.style.display = 'block'; if(outline) outline.style.display = 'block'; }
      });
    }

    function applyTheme(theme) { document.body.classList.remove('theme-dark', 'theme-light', 'theme-blue'); document.body.classList.add('theme-' + theme); db.theme = theme; save(); }

    function updateBadges() {
      const unreadCount = db.notifications.filter(n => !n.read).length;
      const sidebarItem = document.querySelector('.nav-item[data-title="Alerts & Updates"]');
      if (sidebarItem) {
        let badge = sidebarItem.querySelector('.nav-badge');
        if (unreadCount > 0) { if (!badge) { badge = document.createElement('span'); badge.className = 'nav-badge'; sidebarItem.appendChild(badge); } badge.textContent = unreadCount; badge.style.display = 'inline-flex'; } 
        else if (badge) badge.style.display = 'none';
      }
      const topbarBtn = document.querySelector('.icon-btn[onclick*="notifications"]');
      if (topbarBtn) {
        let dot = topbarBtn.querySelector('.dot-notif');
        if (unreadCount > 0 && !dot) { dot = document.createElement('div'); dot.className = 'dot-notif'; topbarBtn.appendChild(dot); } 
        else if (unreadCount === 0 && dot) dot.remove();
      }
    }

    window.navigate = function(route, title) {
      currentRoute = route; if(title) currentTitle = title;
      if(route !== 'project' && autoExecInterval) clearInterval(autoExecInterval);
      renderRouteContent();
      document.querySelector('.content')?.scrollTo({ top: 0, behavior: 'smooth' });
      document.querySelector('.sidebar')?.classList.remove('open');
      document.getElementById('mobile-backdrop')?.classList.remove('active');
    }

    function renderApp() {
      if (!app) return;
      if (!sessionUser) { app.innerHTML = renderLogin(); attachLoginEvents(); } 
      else if (!db.onboardingComplete) { renderSetup(); } 
      else {
        app.innerHTML = renderShell(); attachShellEvents(); renderRouteContent();
        if (!db.tourCompleted) setTimeout(() => startTour(), 500);
      }
    }

    function renderRouteContent() {
      const content = document.querySelector('.content');
      if (!content) return;
      document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.route === currentRoute && el.dataset.title === currentTitle));
      const titleEl = document.querySelector('.topbar-title'); if (titleEl) titleEl.textContent = currentTitle;
      content.classList.remove('view-enter'); void content.offsetWidth; content.classList.add('view-enter');
      switch(currentRoute) {
        case 'dashboard': if(currentTitle === 'Mission Statistics') content.innerHTML = viewStats(); else if(currentTitle === 'Recent Activities') content.innerHTML = viewActivities(); else content.innerHTML = viewOverview(); break;
        case 'create': content.innerHTML = viewCreate(); attachCreateEvents(); break;
        case 'ops': content.innerHTML = viewOps(); break;
        case 'archive': content.innerHTML = viewArchive(); break;
        case 'workers': content.innerHTML = viewWorkers(); break;
        case 'verify': content.innerHTML = viewVerify(); break;
        case 'approve': content.innerHTML = viewApprove(); attachApproveEvents(); break;
        case 'analytics': content.innerHTML = viewAnalytics(); break;
        case 'results': content.innerHTML = viewResults(); break;
        case 'notifications': content.innerHTML = viewNotifications(); attachNotifEvents(); break;
        case 'admin': content.innerHTML = viewAdmin(); break;
        case 'help': content.innerHTML = viewHelp(); break;
        case 'about': content.innerHTML = viewAbout(); break;
        case 'logs': content.innerHTML = viewLogs(); break;
        case 'settings': if(currentTitle === 'System Preferences') content.innerHTML = viewSystemPreferences(); else content.innerHTML = viewAccountSettings(); break;
        case 'project': content.innerHTML = viewProjectDashboard(); break;
        default: content.innerHTML = viewOverview();
      }
    }

    // ==========================================
    // ONBOARDING SETUP VIEW
    // ==========================================
    function renderSetup() {
      const googleAvatar = sessionUser?.user_metadata?.avatar_url || '';
      const googleName = sessionUser?.user_metadata?.full_name || sessionUser?.email || 'New User';
      if(!db.user) db.user = {}; if(!db.user.hobbies) db.user.hobbies = [];
      const hobbies = ['AI & ML', 'FinTech & Crypto', 'Climate Tech', 'HealthTech', 'Space & Aero', 'EdTech'];
      app.innerHTML = `<div class="setup-shell"><div class="setup-card"><div class="setup-header"><img src="${LOGO_URL}" class="setup-logo" alt="OMNIX" onerror="this.style.display='none'"><div class="setup-title">Complete Your Profile</div><div class="setup-subtitle">Let's personalize your mission control experience.</div></div><img src="${googleAvatar}" class="setup-avatar-preview" alt="Avatar" onerror="this.style.display='none'"><div class="field"><label class="field-label">Full Name</label><input type="text" id="setup-name" class="field-input" value="${googleName}"></div><div class="field"><label class="field-label">Organization</label><input type="text" id="setup-org" class="field-input" placeholder="e.g., Omnix Corp"></div><div class="field"><label class="field-label">Select Role</label><select id="setup-role" class="field-input"><option>Mission Director</option><option>Engineer</option><option>Analyst</option><option>Observer</option><option>Student</option></select></div><div class="field"><label class="field-label">Favorite Hobbies / Interests (Optional)</label><div class="hobby-grid" id="hobby-grid">${hobbies.map(h => `<div class="hobby-chip" onclick="toggleHobbySelection(this, '${h}')">${h}</div>`).join('')}</div></div><button class="btn-primary" onclick="completeSetup()">Save & Continue</button></div></div>`;
    }
    window.toggleHobbySelection = function(el, hobby) { if (!db.user.hobbies) db.user.hobbies = []; const index = db.user.hobbies.indexOf(hobby); if (index > -1) { db.user.hobbies.splice(index, 1); el.classList.remove('selected'); } else { db.user.hobbies.push(hobby); el.classList.add('selected'); } };
    window.completeSetup = function() { db.user.name = document.getElementById('setup-name').value; db.user.organization = document.getElementById('setup-org').value; db.user.role = document.getElementById('setup-role').value; db.user.avatar = sessionUser?.user_metadata?.avatar_url || ''; db.user.joinedDate = new Date().toLocaleDateString(); db.onboardingComplete = true; save(); showToast('Profile setup complete! Welcome to OMNIX.', 'success'); renderApp(); };

    // ==========================================
    // SPLIT SCREEN LOGIN VIEW
    // ==========================================
    function renderLogin() {
      return `<div class="login-shell"><div class="viz-side"><div class="viz-grid"></div><div class="viz-header"><div class="viz-status">SYSTEM ONLINE</div><div class="viz-time" id="vizTime">00:00:00 UTC</div></div><div class="flow-container"><svg class="flow-svg" viewBox="0 0 500 500"><line x1="250" y1="250" x2="250" y2="100" class="flow-line-active" /><line x1="250" y1="250" x2="400" y2="250" class="flow-line-active" /><line x1="250" y1="250" x2="250" y2="400" class="flow-line-active" /><line x1="250" y1="250" x2="100" y2="250" class="flow-line-active" /></svg><div class="ai-core"><div class="ai-core-text">OMNIX<br>CORE</div></div><div class="flow-node node-pos-1"><div class="flow-node-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div><div class="flow-node-title">1. Define Mission</div><div class="flow-node-desc">Input business parameters</div></div><div class="flow-node node-pos-2"><div class="flow-node-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m17.4-6.4l-4.2 4.2m-6.4 6.4l-4.2 4.2m0-14.8l4.2 4.2m6.4 6.4l4.2 4.2"/></svg></div><div class="flow-node-title">2. AI Reacts</div><div class="flow-node-desc">Extracts Mission DNA</div></div><div class="flow-node node-pos-3"><div class="flow-node-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></div><div class="flow-node-title">3. Execution</div><div class="flow-node-desc">Digital workers deployed</div></div><div class="flow-node node-pos-4"><div class="flow-node-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div><div class="flow-node-title">4. Plan Done</div><div class="flow-node-desc">Verification & reporting</div></div></div></div><div class="login-side"><div class="login-form-box"><div class="login-brand"><div class="brand-mark"><img src="${LOGO_URL}" alt="OMNIX Logo" onerror="this.style.display='none'"></div><div class="brand-name">OMNIX</div><div class="login-desc">Next-Generation Intelligent Mission Management. Plan, execute, and verify complex objectives with an autonomous digital workforce.</div></div><div class="eyebrow">SECURE ACCESS // PROTOCOL 7.2</div><form id="auth-form"><div class="field"><label class="field-label">Email Address</label><input type="email" id="login-email" class="field-input" placeholder="you@example.com" required></div><div class="field"><label class="field-label">Password</label><input type="password" id="login-pass" class="field-input" placeholder="••••••••" required></div><div class="field" id="login-pass-confirm-field" style="display: none;"><label class="field-label">Confirm Password</label><input type="password" id="login-pass-confirm" class="field-input" placeholder="••••••••"></div><div class="field" id="login-phone-field" style="display: none;"><label class="field-label">Phone Number (Optional)</label><div class="phone-input-group"><select id="login-country" class="field-input"><option value="+92" data-flag="🇵🇰">🇵🇰 +92</option><option value="+1" data-flag="🇺🇸">🇺🇸 +1</option><option value="+44" data-flag="🇬🇧">🇬🇧 +44</option><option value="+91" data-flag="🇮🇳">🇮🇳 +91</option><option value="+971" data-flag="🇦🇪">🇦🇪 +971</option><option value="+61" data-flag="🇦🇺">🇦🇺 +61</option></select><input type="tel" id="login-phone" class="field-input" placeholder="300 1234567"></div></div><button type="submit" class="btn-primary" id="submit-btn"><span class="spinner"></span><span class="btn-text">Sign In</span></button></form><div style="display: flex; align-items: flex-start; gap: 10px; margin-top: 20px; margin-bottom: 10px;"><input type="checkbox" id="terms-check" style="margin-top: 4px; width: 16px; height: 16px; accent-color: var(--accent); cursor: pointer;"><label for="terms-check" style="font-size: 12.5px; color: var(--text-dim); cursor: pointer; line-height: 1.5;">I have read and agree to the <a onclick="openTermsModal()" style="color: var(--accent); text-decoration: none; font-weight: 600; cursor: pointer;">Terms of Service and Privacy Policy</a>.</label></div><div class="auth-toggle"><span id="toggle-text">Don't have an account?</span> <a id="toggle-link">Sign Up</a></div><div class="auth-divider">OR</div><button class="btn-google" id="google-login-btn"><svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg><span class="btn-text">Sign in with Google</span></button></div></div></div>`;
    }

    function attachLoginEvents() {
      const toggleLink = document.getElementById('toggle-link'); const toggleText = document.getElementById('toggle-text'); const submitBtn = document.getElementById('submit-btn'); const confirmField = document.getElementById('login-pass-confirm-field'); const phoneField = document.getElementById('login-phone-field');
      if (toggleLink) {
        toggleLink.onclick = (e) => {
          e.preventDefault(); isLoginMode = !isLoginMode;
          if (isLoginMode) { submitBtn.querySelector('.btn-text').textContent = 'Sign In'; toggleText.textContent = "Don't have an account?"; toggleLink.textContent = 'Sign Up'; confirmField.style.display = 'none'; phoneField.style.display = 'none'; } 
          else { submitBtn.querySelector('.btn-text').textContent = 'Create Account'; toggleText.textContent = "Already have an account?"; toggleLink.textContent = 'Sign In'; confirmField.style.display = 'block'; phoneField.style.display = 'block'; }
        };
      }
      const authForm = document.getElementById('auth-form');
      if (authForm) {
        authForm.onsubmit = async (e) => {
          e.preventDefault();
          const termsCheck = document.getElementById('terms-check');
          if (!termsCheck || !termsCheck.checked) { showToast('You must agree to the Terms of Service to continue.', 'error'); return; }
          const email = document.getElementById('login-email').value; const password = document.getElementById('login-pass').value;
          submitBtn.classList.add('loading');
          try {
            if (isLoginMode) { const { data, error } = await sb.auth.signInWithPassword({ email, password }); if (error) throw error; } 
            else {
              const confirmPassword = document.getElementById('login-pass-confirm').value;
              if (password !== confirmPassword) { showToast('Passwords do not match', 'error'); submitBtn.classList.remove('loading'); return; }
              const phoneCountry = document.getElementById('login-country').value; const phoneNumber = document.getElementById('login-phone').value; const fullPhone = phoneNumber ? `${phoneCountry} ${phoneNumber}` : '';
              const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name: email.split('@')[0], phone: fullPhone } } });
              if (error) throw error;
              if (data.user && !data.session) { showToast('Account created! Check your email for the verification link to log in.', 'success'); isLoginMode = true; submitBtn.querySelector('.btn-text').textContent = 'Sign In'; toggleText.textContent = "Don't have an account?"; toggleLink.textContent = 'Sign Up'; confirmField.style.display = 'none'; phoneField.style.display = 'none'; }
            }
          } catch (error) { showToast(error.message, 'error'); } 
          finally { submitBtn.classList.remove('loading'); }
        };
      }
      const googleBtn = document.getElementById('google-login-btn');
      if(googleBtn) {
        googleBtn.onclick = async () => {
          const termsCheck = document.getElementById('terms-check');
          if (!termsCheck || !termsCheck.checked) { showToast('You must agree to the Terms of Service to continue.', 'error'); return; }
          await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
        };
      }
    }

    window.openTermsModal = function() { modalContainer.innerHTML = `<div class="modal-overlay" onclick="if(event.target === this) closeModal()"><div class="modal-content" style="max-width: 600px; text-align: left; max-height: 80vh; display: flex; flex-direction: column;"><div class="modal-title" style="text-align: center; margin-bottom: 20px;">Terms of Service & Privacy Policy</div><div style="overflow-y: auto; padding-right: 15px; font-size: 13px; color: var(--text-dim); line-height: 1.6; margin-bottom: 24px; flex-grow: 1;"><p><strong>1. ACCEPTANCE OF TERMS</strong><br>Welcome to the OMNIX Intelligent Mission Management System. By accessing or using the Service, you agree to be bound by these Terms of Service.</p><br><p><strong>2. USER RESPONSIBILITIES</strong><br>You are solely responsible for all content and data you input into OMNIX. You agree not to use the Service to violate any law or infringe on third-party rights.</p><br><p><strong>3. DATA PRIVACY</strong><br>OMNIX utilizes Supabase for authentication/database and Puter.js for AI processing. Your mission data is securely stored linked to your unique User ID.</p><br><p><strong>4. AI INTEGRATION</strong><br>AI-generated content may contain errors. Outputs should not be relied upon as professional advice. You are responsible for reviewing all AI-generated tasks.</p><br><p><strong>5. INTELLECTUAL PROPERTY</strong><br>The OMNIX platform is the intellectual property of its developers (Arshman Anil & Jaweria Irfan). You retain all rights to your User Data.</p><br><p><strong>6. LIMITATION OF LIABILITY</strong><br>OMNIX shall not be liable for indirect, incidental, or consequential damages resulting from use of the Service.</p><br><p><strong>7. CONTACT</strong><br>For questions about these Terms, contact support@omnix.io.</p></div><div class="modal-actions" style="justify-content: center; margin-top: auto;"><button class="btn" onclick="declineTerms()">Decline</button><button class="btn btn-primary-sm" onclick="acceptTerms()">I Agree</button></div></div></div>`; };
    window.acceptTerms = function() { const check = document.getElementById('terms-check'); if (check) check.checked = true; closeModal(); showToast('You have accepted the Terms of Service.', 'success'); };
    window.declineTerms = function() { const check = document.getElementById('terms-check'); if (check) check.checked = false; closeModal(); showToast('You declined the Terms of Service.', 'info'); };
    window.closeModal = function() { modalContainer.innerHTML = ''; };

    const icons = {
      dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
      mission: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
      control: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
      team: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      verify: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
      analytics: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/></svg>`,
      reports: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
      notif: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
      settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m17.4-6.4l-4.2 4.2m-6.4 6.4l-4.2 4.2m0-14.8l4.2 4.2m6.4 6.4l4.2 4.2"/></svg>`,
      menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
      search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
      logout: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
      help: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      about: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
      grip: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg>`,
      regen: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`
    };

    function renderShell() {
      const isActive = (r, t) => currentRoute === r && currentTitle === t ? 'active' : '';
      const navItem = (route, title, icon, label, badge = '') => `<div class="nav-item ${isActive(route, title)}" data-route="${route}" data-title="${title}">${icon}<span>${label}</span>${badge}</div>`;
      const isObserver = db.user?.role === 'Observer';
      const unreadCount = db.notifications.filter(n => !n.read).length;
      const userAvatar = db.user?.avatar ? `<img src="${db.user.avatar}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" onerror="this.style.display='none'">` : `${db.user?.name?.charAt(0) || 'U'}`;
      const userName = db.user?.name || 'User';
      return `<div class="app-shell"><aside class="sidebar"><div class="sidebar-header"><div class="brand-mark"><img src="${LOGO_URL}" alt="OMNIX Logo" style="width:100%; height:100%; object-fit:cover;" onerror="this.style.display='none'"></div><div class="brand-name">OMNIX</div></div><nav class="nav"><div class="nav-section"><div class="nav-section-title">Dashboard</div>${navItem('dashboard', 'Overview', icons.dashboard, 'Overview')}${navItem('dashboard', 'Mission Statistics', icons.analytics, 'Mission Statistics')}${navItem('dashboard', 'Recent Activities', icons.notif, 'Recent Activities')}</div>${!isObserver ? `<div class="nav-section"><div class="nav-section-title">Missions</div>${navItem('create', 'Create Mission', icons.mission, 'Create Mission')}${navItem('ops', 'Active Missions', icons.control, 'Active Missions')}${navItem('archive', 'Completed Missions', icons.verify, 'Completed Missions')}</div>` : ''}<div class="nav-section"><div class="nav-section-title">Mission Control</div>${navItem('ops', 'Live Monitoring', icons.control, 'Live Monitoring')}${navItem('verify', 'Task Status', icons.verify, 'Task Status')}</div><div class="nav-section"><div class="nav-section-title">Teams & Collaboration</div>${navItem('workers', 'Team Members', icons.team, 'Team Members')}${navItem('verify', 'Assignments', icons.verify, 'Assignments')}${navItem('notifications', 'Communication', icons.notif, 'Communication')}</div>${!isObserver ? `<div class="nav-section"><div class="nav-section-title">Verification Center</div>${navItem('verify', 'Task Verification', icons.verify, 'Task Verification')}${navItem('approve', 'Approvals', icons.verify, 'Approvals')}${navItem('verify', 'Quality Checks', icons.verify, 'Quality Checks')}</div>` : ''}<div class="nav-section"><div class="nav-section-title">Analytics & Reports</div>${navItem('analytics', 'Performance Reports', icons.analytics, 'Performance Reports')}${navItem('results', 'Generate Reports', icons.reports, 'Generate Reports')}</div><div class="nav-section"><div class="nav-section-title">System</div>${navItem('notifications', 'Alerts & Updates', icons.notif, 'Alerts & Updates', unreadCount > 0 ? `<span class="nav-badge">${unreadCount}</span>` : '')}${navItem('logs', 'Activity Log', icons.menu, 'Activity Log')}${navItem('settings', 'Account Settings', icons.settings, 'Account Settings')}${navItem('settings', 'System Preferences', icons.settings, 'System Preferences')}${navItem('help', 'Help Center', icons.help, 'Help Center')}${navItem('about', 'About OMNIX', icons.about, 'About OMNIX')}</div></nav><div class="sidebar-footer"><div class="avatar" onclick="navigate('settings', 'Account Settings')">${userAvatar}</div><div class="user-info" onclick="navigate('settings', 'Account Settings')"><div class="user-name">${userName}</div><div class="user-role">${db.user?.role || 'Mission Director'}</div></div><button class="logout-btn" id="logout-btn" title="Sign Out">${icons.logout}</button></div></aside><div class="main-area"><header class="topbar"><div class="topbar-left"><button class="icon-btn menu-toggle" id="menu-toggle">${icons.menu}</button><div class="search-bar" id="search-bar-trigger">${icons.search}<span>Search or type a command...</span><kbd>Ctrl K</kbd></div><div class="topbar-title">Overview</div></div><div class="topbar-right"><div class="status-pill"><div class="status-dot"></div> ALL SYSTEMS NOMINAL</div><button class="icon-btn" onclick="navigate('notifications', 'Alerts & Updates')">${icons.notif}${unreadCount > 0 ? `<div class="dot-notif"></div>` : ''}</button></div></header><main class="content view-enter"></main><footer class="global-footer"><span>OMNIX INTELLIGENT MISSION MANAGEMENT SYSTEM</span><span>STATUS: ONLINE &copy; ${new Date().getFullYear()}</span></footer></div></div>`;
    }

    function attachShellEvents() {
      document.querySelectorAll('.nav-item').forEach(el => el.onclick = () => navigate(el.dataset.route, el.dataset.title));
      const searchBar = document.getElementById('search-bar-trigger');
      if (searchBar) { searchBar.onclick = () => { if (cmdPalette) { cmdPalette.classList.add('active'); if (cmdSearch) { cmdSearch.value = ''; renderCmdResults(''); cmdSearch.focus(); } } }; }
      const logoutBtn = document.getElementById('logout-btn');
      if(logoutBtn) logoutBtn.onclick = async () => { await sb.auth.signOut(); sessionUser = null; db = getDefaultDB(); renderApp(); };
      const menuToggle = document.getElementById('menu-toggle'); const backdrop = document.getElementById('mobile-backdrop'); const sidebar = document.querySelector('.sidebar');
      if(menuToggle && backdrop && sidebar) { menuToggle.onclick = () => { sidebar.classList.add('open'); backdrop.classList.add('active'); }; backdrop.onclick = () => { sidebar.classList.remove('open'); backdrop.classList.remove('active'); }; }
    }

    // ==========================================
    // STANDARD VIEWS
    // ==========================================
    function viewOverview() {
      if (db.missions.length === 0) return `<div class="page-header"><div><div class="page-title">Welcome back, ${db.user?.name?.split(' ')[0] || 'Director'}</div><div class="page-subtitle">System overview and active mission status</div></div><button class="btn btn-primary-sm" onclick="navigate('create', 'Create Mission')">+ New Mission</button></div><div class="card empty-state"><p>No missions found. Create your first mission to get started.</p><button class="btn btn-primary-sm" onclick="navigate('create', 'Create Mission')">+ Create Mission</button></div>`;
      return `<div class="page-header"><div><div class="page-title">Welcome back, ${db.user?.name?.split(' ')[0] || 'Director'}</div><div class="page-subtitle">System overview and active mission status</div></div><button class="btn btn-primary-sm" onclick="navigate('create', 'Create Mission')">+ New Mission</button></div><div class="grid grid-auto" style="margin-bottom: 24px;"><div class="card"><div class="card-header"><div class="card-title">TOTAL MISSIONS</div></div><div class="card-value">${db.missions.length}</div><div style="font-size: 12px; color: var(--success); font-family: 'JetBrains Mono';">▲ 12% vs last week</div></div><div class="card"><div class="card-header"><div class="card-title">ACTIVE MISSIONS</div></div><div class="card-value">${db.missions.filter(m=>m.status==='Active').length}</div><div style="font-size: 12px; color: var(--success); font-family: 'JetBrains Mono';">▲ 2.1%</div></div><div class="card"><div class="card-header"><div class="card-title">COMPLETED</div></div><div class="card-value">${db.missions.filter(m=>m.status==='Completed').length}</div><div style="font-size: 12px; color: var(--success); font-family: 'JetBrains Mono';">▲ 1 new</div></div><div class="card"><div class="card-header"><div class="card-title">PENDING REVIEW</div></div><div class="card-value">${db.missions.filter(m=>m.status==='Verification').length}</div><div style="font-size: 12px; color: var(--danger); font-family: 'JetBrains Mono';">▼ 15%</div></div></div><div class="grid grid-2"><div class="card"><div class="card-header"><div class="card-title">RECENT MISSIONS & PROGRESS</div><button class="btn" onclick="navigate('ops', 'Active Missions')">View Ops</button></div><div class="table-wrap"><table class="table"><thead><tr><th>ID</th><th>Mission</th><th>Status</th><th>Progress</th></tr></thead><tbody>${db.missions.filter(m=>m.status!=='Completed').map(m => `<tr><td style="font-family:'JetBrains Mono'; color:var(--text-muted);">${m.id}</td><td>${m.name}</td><td><span class="badge badge-${m.priority.toLowerCase()}">${m.status}</span></td><td><div style="font-size:12px; color:var(--text-dim); margin-bottom: 4px;">${m.progress}%</div><div class="progress-bar" style="margin: 0;"><div class="progress-fill" style="width:${m.progress}%"></div></div></td></tr>`).join('')}</tbody></table></div></div><div class="card"><div class="card-header"><div class="card-title">PERFORMANCE OVERVIEW</div></div><div class="chart-container" style="height: 220px;"><div class="chart-row"><div class="chart-y-axis"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div><div class="chart-plot-area"><div class="chart-grid"><div class="chart-grid-line"></div><div class="chart-grid-line"></div><div class="chart-grid-line"></div><div class="chart-grid-line"></div><div class="chart-grid-line"></div></div><div class="bar-chart"><div class="bar-item"><div class="bar-value">40</div><div class="bar" style="height: 40%;"></div></div><div class="bar-item"><div class="bar-value">65</div><div class="bar" style="height: 65%;"></div></div><div class="bar-item"><div class="bar-value">50</div><div class="bar" style="height: 50%;"></div></div><div class="bar-item"><div class="bar-value">85</div><div class="bar" style="height: 85%;"></div></div><div class="bar-item"><div class="bar-value">100</div><div class="bar" style="height: 100%;"></div></div><div class="bar-item"><div class="bar-value">70</div><div class="bar" style="height: 70%;"></div></div><div class="bar-item"><div class="bar-value">55</div><div class="bar" style="height: 55%;"></div></div></div></div></div><div class="chart-x-axis"><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span></div></div></div></div>`;
    }

    function viewStats() { return `<div class="page-header"><div class="page-title">Mission Statistics</div><div class="page-subtitle">Deep dive into platform metrics</div></div><div class="grid grid-auto" style="margin-bottom: 24px;"><div class="card"><div class="card-title">SUCCESS RATE</div><div class="card-value">97.8%</div><div style="font-size: 12px; color: var(--success);">▲ 2%</div></div><div class="card"><div class="card-title">AVG DURATION</div><div class="card-value">4.2h</div><div style="font-size: 12px; color: var(--danger);">▼ 8%</div></div><div class="card"><div class="card-title">AI TOKENS SAVED</div><div class="card-value">12.4K</div><div style="font-size: 12px; color: var(--success);">▲ 28%</div></div></div><div class="card"><div class="card-header"><div class="card-title">WEEKLY MISSION VOLUME</div></div><div class="chart-container" style="height: 300px;"><div class="chart-row"><div class="chart-y-axis"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div><div class="chart-plot-area"><div class="chart-grid"><div class="chart-grid-line"></div><div class="chart-grid-line"></div><div class="chart-grid-line"></div><div class="chart-grid-line"></div><div class="chart-grid-line"></div></div><div class="bar-chart"><div class="bar-item"><div class="bar-value">45</div><div class="bar" style="height: 45%;"></div></div><div class="bar-item"><div class="bar-value">60</div><div class="bar" style="height: 60%;"></div></div><div class="bar-item"><div class="bar-value">75</div><div class="bar" style="height: 75%;"></div></div><div class="bar-item"><div class="bar-value">50</div><div class="bar" style="height: 50%;"></div></div></div></div></div><div class="chart-x-axis"><span>WEEK 1</span><span>WEEK 2</span><span>WEEK 3</span><span>WEEK 4</span></div></div></div>`; }
    function viewActivities() { return `<div class="page-header"><div class="page-title">Recent Activities</div><div class="page-subtitle">System alerts and mission logs</div></div><div class="card"><div class="timeline">${db.logs.slice(0, 6).map(log => `<div class="timeline-item"><div class="timeline-dot"></div><div class="timeline-content"><div class="timeline-title">${log.text}</div><div class="timeline-time">${log.time}</div></div></div>`).join('')}</div></div>`; }

    function viewOps() {
      if (db.missions.filter(m => m.status !== 'Completed').length === 0) return `<div class="page-header"><div class="page-title">Active Missions</div><div class="page-subtitle">Manage ongoing executions</div></div><div class="card empty-state"><p>No active missions. Create one to see it here.</p><button class="btn btn-primary-sm" onclick="navigate('create', 'Create Mission')">+ Create Mission</button></div>`;
      return `<div class="page-header"><div class="page-title">Active Missions</div><div class="page-subtitle">Manage ongoing executions</div></div><div class="card" style="margin-bottom: 24px;"><div class="card-header"><div class="card-title">SEARCH & FILTER</div></div><input type="text" id="ops-search" class="field-input" placeholder="Search by ID or Name..." oninput="filterOpsTable()"></div><div class="card" style="margin-bottom: 24px;"><div class="card-header"><div class="card-title">GANTT TIMELINE</div></div><div class="gantt-wrap">${db.missions.filter(m => m.status === 'Active').map(m => `<div class="gantt-row"><div class="gantt-label">${m.name}</div><div class="gantt-track"><div class="gantt-fill" style="width: ${m.progress}%;">${m.progress}%</div></div></div>`).join('')}</div></div><div class="card"><div class="card-header"><div class="card-title">MISSION LIST</div></div><div class="table-wrap"><table class="table" id="ops-table"><thead><tr><th>ID</th><th>Mission</th><th>Priority</th><th>Progress</th><th>Action</th></tr></thead><tbody>${db.missions.filter(m => m.status !== 'Completed').map(m => `<tr><td style="font-family:'JetBrains Mono'; color:var(--text-muted);">${m.id}</td><td>${m.name}</td><td><span class="badge badge-${m.priority.toLowerCase()}">${m.priority}</span></td><td style="min-width: 150px;"><div class="progress-bar" style="margin: 0;"><div class="progress-fill" style="width:${m.progress}%"></div></div></td><td><button class="btn" onclick="openProject('${m.id}')">Open</button></td></tr>`).join('')}</tbody></table></div></div>`;
    }
    window.filterOpsTable = function() { const input = document.getElementById('ops-search'); if(!input) return; const val = input.value.toLowerCase(); const rows = document.querySelectorAll('#ops-table tbody tr'); rows.forEach(row => { const text = row.textContent.toLowerCase(); row.style.display = text.includes(val) ? '' : 'none'; }); };

    function viewArchive() {
      const completedMissions = db.missions.filter(m => m.status === 'Completed');
      if (completedMissions.length === 0) return `<div class="page-header"><div class="page-title">Completed Missions</div><div class="page-subtitle">Historical mission data</div></div><div class="card empty-state"><p>No completed missions yet.</p></div>`;
      return `<div class="page-header"><div class="page-title">Completed Missions</div><div class="page-subtitle">Historical mission data</div></div><div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>ID</th><th>Mission Name</th><th>Completion Date</th><th>Success Rate</th><th>Actions</th></tr></thead><tbody>${completedMissions.map(m => `<tr><td style="font-family:'JetBrains Mono'">${m.id}</td><td>${m.name}</td><td>${m.deadline}</td><td><span class="badge badge-success">100%</span></td><td><button class="btn" onclick="openProject('${m.id}')">View Report</button></td></tr>`).join('')}</tbody></table></div></div>`;
    }
    function viewWorkers() { return `<div class="page-header"><div class="page-title">Team Members</div><div class="page-subtitle">Monitor AI agent load and status</div></div><div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>ID</th><th>Name</th><th>Role</th><th>Tasks</th><th>System Load</th><th>Status</th></tr></thead><tbody>${db.workers.map(w => `<tr><td style="font-family:'JetBrains Mono'; color:var(--text-muted);">${w.id}</td><td style="font-weight: 600;">${w.name}</td><td>${w.role}</td><td>${w.tasks}</td><td style="min-width: 150px;"><div style="display: flex; align-items: center; gap: 10px;"><div class="progress-bar" style="width: 100px; margin: 0; flex-shrink: 0;"><div class="progress-fill" style="width: ${w.load}%; background: ${w.load > 80 ? 'var(--danger)' : w.load > 50 ? 'var(--warning)' : 'var(--success)'};"></div></div><span style="font-family:'JetBrains Mono'; font-size: 12px;">${w.load}%</span></div></td><td><span class="badge badge-${w.status === 'Active' ? 'success' : 'low'}">${w.status}</span></td></tr>`).join('')}</tbody></table></div></div>`; }
    
    // FIXED VERIFY BUTTONS
    function viewVerify() { 
      return `<div class="page-header"><div class="page-title">Task Status</div><div class="page-subtitle">Quality assurance queue</div></div><div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>Task ID</th><th>Mission</th><th>Worker</th><th>Submission</th><th>Status</th><th>Actions</th></tr></thead><tbody><tr><td style="font-family:'JetBrains Mono'">T-902</td><td>Quantum Market Expansion</td><td>ATLAS</td><td>Data set compiled</td><td><span class="badge badge-medium">PENDING</span></td><td><button class="btn btn-success" onclick="verifyTask('T-902', this)">Verify</button></td></tr><tr><td style="font-family:'JetBrains Mono'">T-901</td><td>Neural Commerce</td><td>ECHO</td><td>Draft synthesized</td><td><span class="badge badge-medium">PENDING</span></td><td><button class="btn btn-success" onclick="verifyTask('T-901', this)">Verify</button></td></tr><tr><td style="font-family:'JetBrains Mono'">T-900</td><td>Cybersecurity Audit</td><td>NOVA</td><td>Initial report</td><td><span class="badge badge-success">VERIFIED</span></td><td><button class="btn" onclick="showToast('Task report viewed.', 'info')">View</button></td></tr></tbody></table></div></div>`; 
    }
    window.verifyTask = function(taskId, btn) {
      const row = btn.closest('tr');
      const statusCell = row.querySelector('td:nth-child(5)');
      statusCell.innerHTML = '<span class="badge badge-success">VERIFIED</span>';
      btn.outerHTML = '<button class="btn" onclick="showToast(\'Task report viewed.\', \'info\')">View</button>';
      showToast(`Task ${taskId} verified successfully!`, 'success');
      addLog(`Task ${taskId} manually verified by Director.`);
    };

    function viewApprove() { if (db.approvals.length === 0) return `<div class="page-header"><div class="page-title">Approvals</div><div class="page-subtitle">Critical decisions require your authorization</div></div><div class="card empty-state"><p>No approvals pending.</p></div>`; return `<div class="page-header"><div class="page-title">Approvals</div><div class="page-subtitle">Critical decisions require your authorization</div></div><div class="grid grid-auto">${db.approvals.map(a => `<div class="card" id="approval-${a.id}"><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 10px;"><span class="badge badge-${a.priority.toLowerCase()}">${a.priority}</span><span style="font-size: 12px; color: var(--text-muted); font-family:'JetBrains Mono';">${a.id}</span></div><div style="font-size: 16px; font-weight: 600; margin-bottom: 24px; line-height: 1.4;">${a.title}</div><div style="display: flex; gap: 12px;"><button class="btn btn-danger" style="flex:1;" onclick="rejectApproval('${a.id}')">Reject</button><button class="btn btn-success" style="flex:1;" onclick="approveApproval('${a.id}')">Approve</button></div></div>`).join('')}</div>`; }
    function attachApproveEvents() { window.approveApproval = function(id) { db.approvals = db.approvals.filter(a => a.id !== id); save(); addLog(`Approval ${id} granted.`); showToast('Mission phase approved', 'success'); renderRouteContent(); }; window.rejectApproval = function(id) { db.approvals = db.approvals.filter(a => a.id !== id); save(); addLog(`Approval ${id} rejected.`); showToast('Mission phase rejected', 'error'); renderRouteContent(); }; }

    function viewAnalytics() {
      const total = db.missions.length;
      const active = db.missions.filter(m => m.status === 'Active').length;
      const completed = db.missions.filter(m => m.status === 'Completed').length;
      const avgProgress = total > 0 ? Math.round(db.missions.reduce((acc, m) => acc + m.progress, 0) / total) : 0;
      const totalBudget = db.missions.reduce((acc, m) => acc + (m.budget || 0), 0);
      const usedBudget = db.missions.reduce((acc, m) => acc + (m.budgetUsed || 0), 0);
      return `<div class="page-header"><div class="page-title">Performance Reports</div><div class="page-subtitle">Platform performance metrics</div></div><div class="grid grid-auto" style="margin-bottom: 24px;"><div class="card"><div class="card-title">TOTAL MISSIONS</div><div class="card-value">${total}</div><div style="font-size: 12px; color: var(--success);">Active: ${active}</div></div><div class="card"><div class="card-title">COMPLETED</div><div class="card-value">${completed}</div><div style="font-size: 12px; color: var(--success);">Success Rate: ${total > 0 ? Math.round((completed/total)*100) : 0}%</div></div><div class="card"><div class="card-title">AVG PROGRESS</div><div class="card-value">${avgProgress}%</div><div style="font-size: 12px; color: var(--accent);">Across all missions</div></div><div class="card"><div class="card-title">BUDGET USED</div><div class="card-value">$${usedBudget.toLocaleString()}</div><div style="font-size: 12px; color: var(--warning);">of $${totalBudget.toLocaleString()}</div></div></div><div class="card"><div class="card-header"><div class="card-title">MISSION STATUS OVERVIEW</div></div><div style="display: flex; flex-direction: column; gap: 16px;">${db.missions.slice(0, 5).map(m => `<div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; padding-bottom: 10px; border-bottom: 1px solid var(--glass-border);"><span style="font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${m.name}</span><span style="font-family: 'JetBrains Mono'; font-size: 12px; color: ${m.status === 'Completed' ? 'var(--success)' : 'var(--warning)'};">${m.status} (${m.progress}%)</span></div>`).join('') || '<div style="text-align: center; color: var(--text-muted);">No missions to display.</div>'}</div></div>`;
    }

    function viewResults() {
      if (db.missions.filter(m=>m.status==='Completed').length === 0) return `<div class="page-header"><div class="page-title">Data Visualization</div><div class="page-subtitle">Mission outcomes and deliverables</div></div><div class="card empty-state"><p>No completed missions to generate reports yet.</p></div>`;
      return `<div class="page-header"><div class="page-title">Data Visualization</div><div class="page-subtitle">Mission outcomes and deliverables</div></div><div class="grid grid-auto" style="margin-bottom: 24px;"><div class="card"><div class="card-title">COMPLETED</div><div class="card-value">${db.missions.filter(m=>m.status==='Completed').length}</div><div style="font-size: 12px; color: var(--success);">▲ 12%</div></div><div class="card"><div class="card-title">SUCCESS RATE</div><div class="card-value">97.8%</div><div style="font-size: 12px; color: var(--success);">▲ 2%</div></div><div class="card"><div class="card-title">AVG DURATION</div><div class="card-value">4.2h</div><div style="font-size: 12px; color: var(--danger);">▼ 8%</div></div><div class="card"><div class="card-title">DISCOVERIES</div><div class="card-value">14,284</div><div style="font-size: 12px; color: var(--success);">▲ 28%</div></div></div><div class="card"><div class="card-header"><div class="card-title">RECENT MISSION REPORTS</div><button class="btn btn-primary-sm" onclick="exportCSV()">Export Data</button></div><div class="table-wrap"><table class="table"><thead><tr><th>ID</th><th>Mission</th><th>Duration</th><th>Discoveries</th><th>Result</th></tr></thead><tbody>${db.missions.filter(m=>m.status==='Completed').map(m => `<tr><td style="font-family:'JetBrains Mono'">${m.id}</td><td>${m.name}</td><td>3.8h</td><td>124</td><td><span class="badge badge-success">SUCCESS</span></td></tr>`).join('')}</tbody></table></div></div>`;
    }
    window.exportCSV = function() { let csv = "ID,Name,Status,Priority,Progress,Deadline\n"; db.missions.forEach(m => { csv += `${m.id},${m.name},${m.status},${m.priority},${m.progress}%,${m.deadline}\n`; }); const blob = new Blob([csv], { type: 'text/csv' }); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'omnix_missions.csv'; a.click(); window.URL.revokeObjectURL(url); showToast('CSV Exported Successfully', 'success'); };

    function viewAdmin() { return `<div class="page-header"><div class="page-title">Administrator Dashboard</div><div class="page-subtitle">System health and user management</div></div><div class="grid grid-auto" style="margin-bottom: 24px;"><div class="card"><div class="card-title">TOTAL USERS</div><div class="card-value">23</div></div><div class="card"><div class="card-title">ACTIVE LICENSES</div><div class="card-value">21</div></div><div class="card"><div class="card-title">API CALLS (24H)</div><div class="card-value">482K</div></div><div class="card"><div class="card-title">UPTIME</div><div class="card-value">99.97%</div></div></div><div class="grid grid-2"><div class="card"><div class="card-header"><div class="card-title">USER MANAGEMENT</div></div><div class="table-wrap"><table class="table"><thead><tr><th>Name</th><th>Role</th><th>Status</th></tr></thead><tbody><tr><td>Dr. James Sterling</td><td>Mission Director</td><td><span class="badge badge-success">ACTIVE</span></td></tr><tr><td>Aris Thorne</td><td>Engineer</td><td><span class="badge badge-success">ACTIVE</span></td></tr><tr><td>Lena Vance</td><td>Analyst</td><td><span class="badge badge-low">IDLE</span></td></tr></tbody></table></div></div><div class="card"><div class="card-header"><div class="card-title">SYSTEM HEALTH</div></div><div style="display: flex; flex-direction: column; gap: 16px;"><div style="display: flex; justify-content: space-between; align-items: center;"><span>API Gateway</span><span class="badge badge-success">NOMINAL</span></div><div style="display: flex; justify-content: space-between; align-items: center;"><span>Mission DNA Engine</span><span class="badge badge-success">NOMINAL</span></div><div style="display: flex; justify-content: space-between; align-items: center;"><span>Digital Worker Mesh</span><span class="badge badge-success">NOMINAL</span></div><div style="display: flex; justify-content: space-between; align-items: center;"><span>Database Cluster</span><span class="badge badge-success">NOMINAL</span></div></div></div></div>`; }
    function viewLogs() { if (db.logs.length === 0) return `<div class="page-header"><div class="page-title">Activity Log</div><div class="page-subtitle">Live system events and audit trail</div></div><div class="card empty-state"><p>No logs yet.</p></div>`; return `<div class="page-header"><div class="page-title">Activity Log</div><div class="page-subtitle">Live system events and audit trail</div></div><div class="card"><div class="log-container">${db.logs.map(log => `<div class="log-entry"><span class="log-time">[${log.time}]</span><span class="log-text">${log.text}</span></div>`).join('')}</div></div>`; }
    function viewNotifications() { return `<div class="page-header"><div><div class="page-title">Alerts & Updates</div><div class="page-subtitle">System alerts and project news</div></div><div style="display: flex; gap: 12px; flex-wrap: wrap;"><button class="btn" onclick="simulateIncomingNotif()">Simulate Incoming Alert</button><button class="btn btn-primary-sm" id="mark-all-read">Mark all as read</button></div></div><div class="notif-list">${db.notifications.length === 0 ? '<div class="card empty-state"><p>No notifications.</p></div>' : ''}${db.notifications.map(n => `<div class="notif-item ${n.read ? 'read' : ''}" data-id="${n.id}"><div class="notif-icon ${n.type}">${n.type === 'success' ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' : n.type === 'warning' ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'}</div><div class="notif-content"><div class="notif-text">${n.text}</div><div class="notif-time">${n.time}</div></div><div class="notif-actions">${!n.read ? `<button class="btn btn-xs btn-success" onclick="markAsRead('${n.id}')">Read</button>` : ''}<button class="btn btn-xs btn-danger" onclick="ignoreNotif('${n.id}')">Ignore</button></div></div>`).join('')}</div>`; }
    function attachNotifEvents() { const markAll = document.getElementById('mark-all-read'); if(markAll) markAll.onclick = () => { db.notifications.forEach(n => n.read = true); save(); renderRouteContent(); updateBadges(); showToast('All notifications marked as read', 'success'); }; }
    window.markAsRead = function(id) { const notif = db.notifications.find(n => n.id === id); if(notif) notif.read = true; save(); renderRouteContent(); updateBadges(); };
    window.ignoreNotif = function(id) { db.notifications = db.notifications.filter(n => n.id !== id); save(); renderRouteContent(); updateBadges(); showToast('Notification ignored.', 'info'); };
    window.simulateIncomingNotif = function() { const messages = ["Worker NOVA discovered an optimization for MX-4471.", "Weekly system backup completed successfully.", "New AI model update available for Llama 3.3.", "Mission MX-4468 report is ready for final review.", "System diagnostic completed. All modules operational."]; if (db.user?.hobbies && db.user.hobbies.length > 0) { const hobby = db.user.hobbies[Math.floor(Math.random() * db.user.hobbies.length)]; messages.push(`New trend detected in ${hobby}. Check Analytics for insights.`); messages.push(`AI suggests a new mission concept related to ${hobby}.`); } const newMsg = messages[Math.floor(Math.random() * messages.length)]; db.notifications.unshift({ id: 'N' + Date.now(), text: newMsg, time: 'Just now', read: false, type: 'info' }); save(); renderRouteContent(); updateBadges(); showToast('New notification received!', 'info'); };

    function viewHelp() { return `<div class="page-header"><div class="page-title">Help Center</div><div class="page-subtitle">Guides, documentation, and support</div></div><div class="grid grid-2"><div class="help-category" onclick="openHelpModal('getting-started')"><h3>🚀 Getting Started with OMNIX</h3><p>Learn how to create your first mission, navigate the dashboard, and understand the core philosophy of AI-driven task execution.</p></div><div class="help-category" onclick="openHelpModal('mission-dna')"><h3>🧬 Understanding Mission DNA</h3><p>Dive deep into how the AI extracts objectives, constraints, skills, and risks from your initial mission prompt to build a structured plan.</p></div><div class="help-category" onclick="openHelpModal('digital-workers')"><h3>🤖 Managing Digital Workers</h3><p>Learn how to assign tasks to specialized AI workers (ATLAS, ECHO, NOVA) and monitor their system load and performance.</p></div><div class="help-category" onclick="openHelpModal('analytics')"><h3>📊 Analytics & Reporting</h3><p>Understand how to read the performance metrics, export final mission reports, and utilize data visualization tools.</p></div><div class="help-category" onclick="openHelpModal('preferences')"><h3>⚙️ System Preferences</h3><p>Configure your account settings, manage API limits, and customize your mission control interface.</p></div><div class="help-category" onclick="openHelpModal('support')"><h3>💬 Contact Support</h3><p>Need more help? Reach out to our enterprise support team at support@omnix.io or call +1 (800) 555-OMNX.</p></div></div>`; }
    const helpContent = { 'getting-started': { title: "🚀 Getting Started with OMNIX", body: "OMNIX is an Intelligent Mission Management System. Instead of just chatting, you define a mission. The Mission DNA Engine breaks it down into constraints, skills, and risks, then assigns tasks to Digital Workers. Use the 'Create Mission' page to start your first project today." }, 'mission-dna': { title: "🧬 Understanding Mission DNA", body: "When you create a mission, our AI extracts the core DNA: Objectives, Constraints, Required Skills, and Risks. This DNA guides the digital workers and ensures the final deliverables match your exact requirements. You can manually edit the DNA at any time in the Project Dashboard." }, 'digital-workers': { title: "🤖 Managing Digital Workers", body: "Digital Workers (like ATLAS, ECHO, NOVA) are specialized AI agents. In the Project Dashboard, you can assign specific tasks to specific workers. Monitor their load in the 'Team Members' page to ensure optimal performance and prevent bottlenecks." }, 'analytics': { title: "📊 Analytics & Reporting", body: "Track success rates, task throughput, and AI compute hours in the Analytics section. When a mission reaches 100% completion, you can generate a comprehensive Final Report summarizing the outcomes and next steps." }, 'preferences': { title: "⚙️ System Preferences", body: "Customize your OMNIX experience in System Preferences. You can switch between Deep Blue, Dark, and Light themes. Your preferences and profile settings are saved locally to your browser for a persistent experience." }, 'support': { title: "💬 Contact Support", body: "Need enterprise support? Our team is available 24/7. Email us at support@omnix.io or call +1 (800) 555-OMNX. For AI rate limits and token usage queries, please refer to your enterprise contract documentation." } };
    window.openHelpModal = function(id) { const data = helpContent[id]; if (!data) return; modalContainer.innerHTML = `<div class="modal-overlay" onclick="if(event.target === this) closeModal()"><div class="modal-content" style="max-width: 600px; text-align: left;"><div class="modal-title" style="margin-bottom: 24px;">${data.title}</div><div style="font-size: 14px; color: var(--text-dim); line-height: 1.8; margin-bottom: 24px;">${data.body}</div><div class="modal-actions" style="justify-content: flex-end;"><button class="btn btn-primary-sm" onclick="closeModal()">Got it</button></div></div></div>`; };

    function viewAbout() { return `<div class="page-header" style="justify-content: center; text-align: center;"><div><div class="page-title">About OMNIX</div><div class="page-subtitle">Intelligent Mission Management System</div></div></div><div class="about-hero"><div class="about-motto">OMNIX: Intelligent Mission Management System</div><p class="about-desc">OMNIX is designed to revolutionize how organizations execute complex objectives. By shifting from traditional chat-based AI to a structured Intelligent Mission Management System, OMNIX breaks down your goals into actionable DNA, assigns them to specialized Digital Workers, and tracks progress in real-time. This platform was built with a vision to provide enterprise-grade automation and analytics, ensuring every mission is completed with precision and efficiency.</p></div><div class="card" style="margin-bottom: 24px;"><div class="card-header"><div class="card-title">DEVELOPING TEAM</div></div><div class="team-grid"><div class="team-card"><div class="team-avatar">AA</div><div class="team-name">Arshman Anil</div><div class="team-role">Developer</div><p class="team-bio">Architected the OMNIX platform, designing the core UI/UX and integrating the AI-driven Mission DNA engine for seamless task execution.</p></div><div class="team-card"><div class="team-avatar">JI</div><div class="team-name">Jaweria Irfan</div><div class="team-role">Developer</div><p class="team-bio">Developed the backend logic and data management systems, ensuring reliable performance, analytics integration, and a smooth user experience.</p></div></div></div><div class="about-footer">&copy; ${new Date().getFullYear()} OMNIX. All rights reserved.<br>Built with passion by Arshman Anil & Jaweria Irfan.</div>`; }
    
    // REFINED USER PROFILE / ACCOUNT SETTINGS
    function viewAccountSettings() { 
      const userName = db.user?.name || 'User'; 
      const userEmail = sessionUser?.email || ''; 
      const userAvatar = db.user?.avatar; 
      const userRole = db.user?.role || 'Mission Director'; 
      const userHobbies = db.user?.hobbies || []; 
      const userPhone = db.user?.phone || sessionUser?.user_metadata?.phone || 'Not provided'; 
      const userOrg = db.user?.organization || 'Not provided';
      const joinedDate = db.user?.joinedDate || new Date().toLocaleDateString();
      const completedMissions = db.missions.filter(m => m.status === 'Completed').length;
      const initials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(); 
      const hobbies = ['AI & ML', 'FinTech & Crypto', 'Climate Tech', 'HealthTech', 'Space & Aero', 'EdTech']; 
      const badges = [
        { name: "First Mission", unlocked: db.missions.length >= 1 },
        { name: "5 Missions", unlocked: db.missions.length >= 5 },
        { name: "First Completed", unlocked: completedMissions >= 1 },
        { name: "5 Completed", unlocked: completedMissions >= 5 }
      ];
      return `<div class="page-header"><div class="page-title">Account Settings</div><div class="page-subtitle">Manage your profile and security</div></div><div class="settings-grid"><div class="card"><div class="profile-header">${userAvatar ? `<img src="${userAvatar}" alt="Avatar" style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.1); box-shadow: 0 4px 20px rgba(0,0,0,0.2); object-fit: cover;" onerror="this.style.display='none'">` : `<div class="avatar-lg">${initials}</div>`}<div class="profile-header-info"><h2>${userName}</h2><p>${userEmail}</p><span class="badge badge-low">${userRole}</span><div class="badge-list">${badges.map(b => `<span class="profile-badge ${b.unlocked ? '' : 'locked'}">${b.unlocked ? '🏆' : '🔒'} ${b.name}</span>`).join('')}</div></div></div><div class="card-header"><div class="card-title">PROFILE INFORMATION</div></div><div class="field"><label class="field-label">Full Name</label><input type="text" id="settings-name" class="field-input" value="${userName}"></div><div class="field"><label class="field-label">Organization</label><input type="text" id="settings-org" class="field-input" value="${userOrg}"></div><div class="field"><label class="field-label">Phone Number</label><input type="text" id="settings-phone" class="field-input" value="${userPhone}" placeholder="e.g. +92 300 1234567"></div><div class="field"><label class="field-label">Role</label><select id="settings-role" class="field-input"><option ${userRole === 'Mission Director' ? 'selected' : ''}>Mission Director</option><option ${userRole === 'Engineer' ? 'selected' : ''}>Engineer</option><option ${userRole === 'Analyst' ? 'selected' : ''}>Analyst</option><option ${userRole === 'Observer' ? 'selected' : ''}>Observer</option><option ${userRole === 'Student' ? 'selected' : ''}>Student</option></select></div><div class="field"><label class="field-label">Favorite Hobbies / Interests</label><div class="hobby-grid">${hobbies.map(h => `<div class="hobby-chip ${userHobbies.includes(h) ? 'selected' : ''}" onclick="toggleHobbySelection(this, '${h}')">${h}</div>`).join('')}</div></div><button class="btn btn-primary-sm" style="width: 100%;" onclick="saveProfileSettings()">Save Changes</button></div><div class="card"><div class="card-header"><div class="card-title">USER PROFILE</div></div><div class="detail-list"><div class="detail-item"><span class="detail-label">Name</span><span class="detail-value">${userName}</span></div><div class="detail-item"><span class="detail-label">Role</span><span class="detail-value">${userRole}</span></div><div class="detail-item"><span class="detail-label">Organization</span><span class="detail-value">${userOrg}</span></div><div class="detail-item"><span class="detail-label">Email</span><span class="detail-value">${userEmail}</span></div><div class="detail-item"><span class="detail-label">Joined</span><span class="detail-value">${joinedDate}</span></div><div class="detail-item"><span class="detail-label">Completed Missions</span><span class="detail-value">${completedMissions}</span></div><div class="detail-item" style="flex-direction: column; align-items: flex-start;"><span class="detail-label">Badges</span><div class="badge-list" style="margin-top: 8px;">${badges.map(b => `<span class="profile-badge ${b.unlocked ? '' : 'locked'}">${b.unlocked ? '🏆' : '🔒'} ${b.name}</span>`).join('')}</div></div></div></div></div>`; 
    }
    window.saveProfileSettings = function() { db.user.name = document.getElementById('settings-name').value; db.user.organization = document.getElementById('settings-org').value; db.user.phone = document.getElementById('settings-phone').value; db.user.role = document.getElementById('settings-role').value; save(); showToast('Profile updated successfully', 'success'); renderApp(); navigate('settings', 'Account Settings'); };
    function viewSystemPreferences() { const themes = [{ id: 'blue', name: 'Deep Blue', desc: 'Immersive dark blue' }, { id: 'dark', name: 'Dark Mode', desc: 'Default deep black' }, { id: 'light', name: 'Light Mode', desc: 'Bright white and gray' }]; return `<div class="page-header"><div class="page-title">System Preferences</div><div class="page-subtitle">Customize your interface appearance</div></div><div class="card"><div class="card-header"><div class="card-title">APPEARANCE</div></div><div class="grid grid-3">${themes.map(t => `<div class="theme-card ${db.theme === t.id ? 'active' : ''}" onclick="changeTheme('${t.id}')"><div class="theme-preview theme-${t.id}-preview"><div></div><div></div></div><div class="theme-card-title">${t.name}</div><div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">${t.desc}</div></div>`).join('')}</div></div>`; }
    window.changeTheme = function(theme) { applyTheme(theme); renderRouteContent(); showToast('Theme updated successfully', 'success'); };

    // ==========================================
    // CREATE MISSION & AI INTEGRATION
    // ==========================================
    function viewCreate() { 
      return `<div class="page-header"><div class="page-title">Initialize New Mission</div><div class="page-subtitle">AI will generate a structured plan based on your details</div></div><div class="card"><div class="field"><label class="field-label">Mission Title</label><input type="text" id="m-name" class="field-input" placeholder="e.g., Eco-Friendly Sneaker Launch"></div><div class="field"><label class="field-label">Objective</label><input type="text" id="m-objective" class="field-input" placeholder="e.g., Launch a new brand targeting Gen Z"></div><div class="field"><label class="field-label">Business / Project Details (For AI)</label><textarea class="field-input" id="m-details" rows="4" placeholder="e.g., Launch an eco-friendly sneaker brand targeting Gen Z in urban markets. Budget is $50k."></textarea></div><div class="grid grid-auto" style="margin-bottom: 24px;"><div><label class="field-label">Priority</label><select class="field-input" id="m-pri"><option>HIGH</option><option>MEDIUM</option><option>CRITICAL</option><option>LOW</option></select></div><div><label class="field-label">Deadline</label><input type="date" class="field-input" id="m-date"></div></div><button class="btn btn-primary-sm" id="generate-ai-btn">⚡ Generate AI Mission Plan</button></div>`; 
    }
    function attachCreateEvents() { const btn = document.getElementById('generate-ai-btn'); if(btn) btn.onclick = showDisclaimerModal; }
    function showDisclaimerModal() { modalContainer.innerHTML = `<div class="modal-overlay" onclick="if(event.target === this) closeModal()"><div class="modal-content"><div class="modal-title">⚠️ AI Generation Warning</div><div class="modal-text">You can create only 30 projects per minute. AI token usage is strictly capped (Max 500 tokens). Do you wish to continue?</div><div class="modal-actions"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn btn-primary-sm" onclick="generateAIPlan()">Continue</button></div></div></div>`; }

    window.generateAIPlan = async function() {
      const detailsEl = document.getElementById('m-details'); 
      if(!detailsEl) return; 
      const details = detailsEl.value; 
      
      const nameEl = document.getElementById('m-name');
      const name = (nameEl && nameEl.value) ? nameEl.value : (details ? details.split('.')[0].substring(0, 40) + '...' : 'New Mission');
      
      const objEl = document.getElementById('m-objective');
      const objective = (objEl && objEl.value) ? objEl.value : 'Not specified';
      
      if(!details) { showToast('Please enter project details', 'error'); closeModal(); return; }
      modalContainer.innerHTML = `<div class="modal-overlay"><div class="modal-content"><div class="loader"></div><div class="modal-title">Generating Plan...</div><div class="modal-text">Puter.js AI is analyzing requirements and structuring Mission DNA.</div></div></div>`;
      
      let plan = null, dna = null, budget = 50000;
      try {
        const hobbyString = db.user?.hobbies && db.user.hobbies.length > 0 ? `\nUser Interests: ${db.user.hobbies.join(', ')}. Tailor the business ideas to align with these interests if possible.` : '';
        const finalDetails = `Mission Title: ${name}\nObjective: ${objective}\nDetails: ${details}${hobbyString}`;
        
        const response = await puter.ai.chat([
            { role: "system", content: "You are a mission planning AI. Generate a concise 4-phase project plan AND a Mission DNA breakdown. Output STRICTLY valid JSON. No markdown. Format: {\"phases\":[{\"title\":\"Phase 1: ...\",\"tasks\":[\"Task 1\",\"Task 2\"]}],\"dna\":{\"constraints\":\"Short string\",\"skills\":\"Short string\",\"risks\":\"Short string\",\"budget\":50000}}" },
            { role: "user", content: finalDetails }
        ]);
        
        let rawContent = "";
        if (typeof response === 'string') rawContent = response;
        else if (response?.message?.content) {
            rawContent = Array.isArray(response.message.content) ? response.message.content[0].text : response.message.content;
        } else if (response?.text) {
            rawContent = response.text;
        } else {
            rawContent = JSON.stringify(response);
        }
        
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.phases) plan = parsed.phases.map(p => ({ title: p.title, tasks: p.tasks.map(t => ({ text: t, done: false, assignedTo: null, note: '' })) }));
            if (parsed.dna) dna = parsed.dna;
            if (parsed.dna && parsed.dna.budget) budget = parsed.dna.budget;
        }
      } catch (e) { console.warn("Puter API call failed. Using fallback mock data.", e); }

      if (!plan) { plan = [ { title: "Phase 1: Research & Discovery", tasks: [{text: "Analyze market requirements", done: false, assignedTo: null, note: ''}, {text: "Identify key competitors", done: false, assignedTo: null, note: ''}] }, { title: "Phase 2: Strategy & Planning", tasks: [{text: "Develop go-to-market strategy", done: false, assignedTo: null, note: ''}, {text: "Allocate budget resources", done: false, assignedTo: null, note: ''}] }, { title: "Phase 3: Execution", tasks: [{text: "Launch initial prototype", done: false, assignedTo: null, note: ''}, {text: "Execute marketing campaign", done: false, assignedTo: null, note: ''}] }, { title: "Phase 4: Verification & Launch", tasks: [{text: "Quality assurance testing", done: false, assignedTo: null, note: ''}, {text: "Official public launch", done: false, assignedTo: null, note: ''}] } ]; }
      if (!dna) { dna = { constraints: "Strict budget limit of $50k.\nMust launch by Q3 2024.", skills: "Digital Marketing\nSupply Chain Management", risks: "Competitor undercutting prices.\nSupply chain delays." }; }

      const priEl = document.getElementById('m-pri');
      const dateEl = document.getElementById('m-date');
      
      const newId = 'MX-' + (4472 + db.missions.length);
      const newMission = { 
          id: newId, 
          name: name, 
          objective: objective, 
          description: details, 
          status: 'Active', 
          progress: 0, 
          phase: 'Planning', 
          priority: (priEl && priEl.value) ? priEl.value : 'HIGH', 
          deadline: (dateEl && dateEl.value) ? dateEl.value : '2024-12-31', 
          plan: plan, 
          dna: dna, 
          report: null, 
          budget: budget, 
          budgetUsed: 0, 
          advisor: null 
      };
      db.missions.unshift(newMission); 
      save(); 
      addLog(`Mission ${newId} created successfully. Budget allocated: $${budget.toLocaleString()}`); 
      closeModal(); 
      showToast('Mission plan generated successfully!', 'success'); 
      openProject(newId);
    };

    // ==========================================
    // MISSION DETAILS PAGE (PROJECT DASHBOARD)
    // ==========================================
    window.openProject = function(id) { currentProjectId = id; navigate('project', 'Project Dashboard'); const content = document.querySelector('.content'); if(content) { content.innerHTML = `<div class="skeleton-card" style="height: 100px;"></div><div class="grid grid-2"><div class="skeleton-card"><div class="skeleton-line short"></div><div class="skeleton-line long"></div><div class="skeleton-line long"></div></div><div class="skeleton-card"><div class="skeleton-line short"></div><div class="skeleton-line long"></div></div></div><div class="skeleton-card" style="height: 300px;"></div>`; } setTimeout(() => { renderRouteContent(); }, 800); };

    function viewProjectDashboard() {
      const m = db.missions.find(x => x.id === currentProjectId); if(!m) return `<div class="card">Project not found.</div>`;
      let totalTasks = 0, completedTasks = 0; if (m.plan && m.plan.length > 0) { m.plan.forEach(phase => { phase.tasks.forEach(task => { totalTasks++; if (task.done) completedTasks++; }); }); }
      const displayProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      if (displayProgress === 100 && m.status !== 'Completed') { m.status = 'Completed'; m.phase = 'Completed'; launchConfetti(); addLog(`Mission ${m.id} reached 100% completion!`); }
      const budgetUsed = m.budgetUsed || 0; const budgetTotal = m.budget || 50000; const budgetPercent = budgetTotal > 0 ? ((budgetUsed / budgetTotal) * 100).toFixed(1) : 0;

      const steps = [
        { name: 'Planning', phase: 'Planning' },
        { name: 'Approval', phase: 'Approval' },
        { name: 'Execution', phase: 'Execution' },
        { name: 'Verification', phase: 'Verification' },
        { name: 'Completed', phase: 'Completed' }
      ];
      const currentStepIndex = steps.findIndex(s => s.phase === m.phase);
      const timelineHtml = `<div class="mission-timeline">${steps.map((s, i) => `<div class="timeline-step ${i < currentStepIndex ? 'completed' : i === currentStepIndex ? 'active' : ''}"><div class="timeline-dot">${i < currentStepIndex ? '✓' : i + 1}</div><div class="timeline-label">${s.name}</div></div>`).join('')}</div>`;

      const assignedWorkers = db.workers.filter(w => m.plan?.some(p => p.tasks.some(t => t.assignedTo === w.id))).map(w => w.name).join(', ') || 'None assigned yet';

      return `
        <div class="page-header"><div><div class="page-title">${m.name}</div><div class="page-subtitle">ID: ${m.id} | Status: ${m.status} | Priority: ${m.priority}</div></div><div style="display: flex; gap: 10px; flex-wrap: wrap;"><button class="btn btn-danger" onclick="deleteMission('${m.id}')">Delete Mission</button><button class="btn btn-warning" id="auto-exec-btn" onclick="autoExecuteMission()" ${m.progress === 100 ? 'disabled' : ''}>⚡ Auto-Execute</button><button class="btn" onclick="navigate('ops', 'Active Missions')">Back</button></div></div>
        
        ${timelineHtml}
        
        <div class="card" style="margin-bottom: 24px;">
          <div class="card-header"><div class="card-title">MISSION PROGRESS</div><div style="font-size: 14px; font-weight: 600; color: var(--accent);">${displayProgress}% (${completedTasks}/${totalTasks} Tasks)</div></div>
          <div class="progress-bar progress-bar-lg"><div class="progress-fill" style="width: ${displayProgress}%;"></div></div>
        </div>

        <div class="grid grid-2" style="margin-bottom: 24px;">
          <div class="card">
            <div class="card-header"><div class="card-title">MISSION DETAILS</div></div>
            <div class="detail-list">
              <div class="detail-item"><span class="detail-label">Mission ID</span><span class="detail-value" style="font-family:'JetBrains Mono';">${m.id}</span></div>
              <div class="detail-item"><span class="detail-label">Title</span><span class="detail-value">${m.name}</span></div>
              <div class="detail-item"><span class="detail-label">Description</span><span class="detail-value" style="max-width: 250px; text-align: right;">${m.description || 'Not specified'}</span></div>
              <div class="detail-item"><span class="detail-label">Objective</span><span class="detail-value" style="max-width: 250px; text-align: right;">${m.objective || 'Not specified'}</span></div>
              <div class="detail-item"><span class="detail-label">Priority</span><span class="detail-value"><span class="badge badge-${m.priority.toLowerCase()}">${m.priority}</span></span></div>
              <div class="detail-item"><span class="detail-label">Status</span><span class="detail-value">${m.status}</span></div>
              <div class="detail-item"><span class="detail-label">Progress</span><span class="detail-value">${m.progress}%</span></div>
              <div class="detail-item"><span class="detail-label">Assigned Members</span><span class="detail-value" style="max-width: 250px; text-align: right;">${assignedWorkers}</span></div>
              <div class="detail-item"><span class="detail-label">Deadline</span><span class="detail-value">${m.deadline}</span></div>
              <div class="detail-item"><span class="detail-label">Files</span><span class="detail-value" style="color: var(--text-muted);">No files uploaded</span></div>
            </div>
          </div>
          <div class="card">
            <div class="card-header"><div class="card-title">BUDGET UTILIZATION</div><div style="font-size: 14px; font-weight: 600; color: var(--warning);">$${budgetUsed.toLocaleString()} / $${budgetTotal.toLocaleString()}</div></div>
            <div class="progress-bar progress-bar-lg"><div class="progress-fill" style="width: ${budgetPercent}%; background: linear-gradient(90deg, var(--warning), var(--danger));"></div></div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">${budgetPercent}% of mission budget consumed.</div>
          </div>
        </div>

        <div class="grid grid-2" style="margin-bottom: 24px;">
          <div class="card">
            <div class="card-header"><div class="card-title">AI MISSION ADVISOR</div></div>
            <div id="advisor-content" style="min-height: 100px;">
              ${m.advisor ? `<div style="display: flex; flex-direction: column; gap: 16px;">
                  <div><strong>Mission Risk:</strong> <span class="badge badge-${m.advisor.risk_level === 'High' ? 'high' : m.advisor.risk_level === 'Medium' ? 'medium' : 'low'}">${m.advisor.risk_level}</span></div>
                  <div><strong>Reason:</strong> ${m.advisor.reason}</div>
                  <div><strong>Recommendation:</strong> ${m.advisor.recommendation}</div>
              </div>` : `<p style="color: var(--text-muted); text-align: center; padding: 20px 0;">Click below to analyze risks and get recommendations.</p><button class="btn btn-primary-sm" style="width: 100%;" onclick="generateAIAdvisor()">⚡ Generate Recommendations</button>`}
            </div>
          </div>
          <div class="card">
            <div class="card-header"><div class="card-title">FINAL REPORT</div></div>
            ${displayProgress === 100 ? (m.report ? `<textarea class="dna-textarea" style="min-height: 120px;" onchange="updateReport(this.value)">${m.report}</textarea>` : `<div style="text-align: center; padding: 20px;"><p style="margin-bottom: 20px; color: var(--text-dim);">Mission completed! Generate your final report.</p><button class="btn btn-primary-sm" onclick="generateFinalReport()">📄 Generate Final Report</button></div>`) : `<p style="color: var(--text-muted); text-align: center; padding: 40px 0;">Complete all tasks to unlock final report generation.</p>`}
          </div>
        </div>

        <div class="grid grid-2" style="margin-bottom: 24px;">
          <div class="card">
            <div class="card-header"><div class="card-title">MISSION DNA</div><div class="badge badge-low">Editable</div></div>
            <div class="dna-item"><label>Constraints</label><textarea class="dna-textarea" onchange="updateDNA('constraints', this.value)">${m.dna?.constraints || ''}</textarea></div>
            <div class="dna-item"><label>Required Skills</label><textarea class="dna-textarea" onchange="updateDNA('skills', this.value)">${m.dna?.skills || ''}</textarea></div>
            <div class="dna-item"><label>Risks</label><textarea class="dna-textarea" onchange="updateDNA('risks', this.value)">${m.dna?.risks || ''}</textarea></div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">AI GENERATED MISSION PLAN</div><div class="badge badge-low">Drag & Drop to Reorder</div></div>
          ${m.plan && m.plan.length > 0 ? m.plan.map((phase, pi) => `<div style="margin-bottom: 24px;"><div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;"><h3 style="font-size: 16px; color: var(--accent);" id="phase-title-${pi}">${phase.title}</h3><button class="edit-btn" onclick="editPhaseTitle(${pi}, this)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z"/></svg></button></div>${phase.tasks.map((task, ti) => `<div class="mission-plan-item ${task.done ? 'task-done' : ''}" draggable="true" ondragstart="dragStart(event, ${pi}, ${ti})" ondragover="dragOver(event)" ondrop="drop(event, ${pi}, ${ti})" ondragend="dragEnd()"><div class="task-grip">${icons.grip}</div><div class="task-content-wrapper"><div class="task-content" id="task-${pi}-${ti}">${task.text}</div><input type="text" class="task-note-input" placeholder="Add verification note..." value="${task.note || ''}" onchange="updateTaskNote(${pi}, ${ti}, this.value)"></div><select class="field-input" style="width: 140px; height: 36px; font-size: 12px; padding: 0 30px 0 10px; background-color: var(--input-bg);" onchange="assignWorker(${pi}, ${ti}, this.value)"><option value="">Assign...</option>${db.workers.map(w => `<option value="${w.id}" ${task.assignedTo === w.id ? 'selected' : ''}>${w.name}</option>`).join('')}</select><button class="regen-btn" onclick="regenerateTask(${pi}, ${ti})" title="Regenerate Task">${icons.regen}</button><button class="edit-btn" onclick="editTask(${pi}, ${ti}, this)" title="Edit Task"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z"/></svg></button>${task.done ? `<button class="btn btn-danger btn-xs" onclick="toggleTaskStatus(${pi}, ${ti})">Undo</button>` : `<button class="btn btn-success btn-xs" onclick="toggleTaskStatus(${pi}, ${ti})">Done</button>`}</div>`).join('')}</div>`).join('') : '<div>No AI plan generated. Manual mission.</div>'}
        </div>
      `;
    }

    let dragSrcEl = null;
    window.dragStart = function(e, pi, ti) { dragSrcEl = e.target; e.target.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', JSON.stringify({pi, ti})); };
    window.dragOver = function(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (e.target.closest('.mission-plan-item') && e.target.closest('.mission-plan-item') !== dragSrcEl) e.target.closest('.mission-plan-item').classList.add('drag-over'); };
    window.drop = function(e, pi, ti) { e.preventDefault(); e.stopPropagation(); const srcData = JSON.parse(e.dataTransfer.getData('text/plain')); const m = db.missions.find(x => x.id === currentProjectId); if (m && srcData.pi === pi) { const task = m.plan[srcData.pi].tasks.splice(srcData.ti, 1)[0]; m.plan[pi].tasks.splice(ti, 0, task); save(); renderRouteContent(); showToast('Task reordered', 'success'); } };
    window.dragEnd = function(e) { e.target.classList.remove('dragging'); document.querySelectorAll('.mission-plan-item').forEach(el => el.classList.remove('drag-over')); };

    window.regenerateTask = async function(pi, ti) { 
      const m = db.missions.find(x => x.id === currentProjectId); if (!m) return; 
      showToast('Regenerating task...', 'info'); 
      let newTaskText = m.plan[pi].tasks[ti].text; 
      try { 
        const response = await puter.ai.chat([
            { role: "system", content: "Rewrite this project task to be more actionable and professional. Output only the task text." },
            { role: "user", content: newTaskText }
        ]);
        if (typeof response === 'string') newTaskText = response;
        else if (response?.message?.content) newTaskText = Array.isArray(response.message.content) ? response.message.content[0].text : response.message.content;
        else if (response?.text) newTaskText = response.text;
      } catch (e) { console.warn("Regenerate failed, using fallback."); } 
      m.plan[pi].tasks[ti].text = newTaskText; save(); renderRouteContent(); showToast('Task regenerated!', 'success'); 
    };

    // UPDATED ADVISOR LOGIC
    window.generateAIAdvisor = async function() {
        const m = db.missions.find(x => x.id === currentProjectId);
        if (!m) return;
        const advisorContent = document.getElementById('advisor-content');
        if (advisorContent) advisorContent.innerHTML = `<div class="loader" style="margin: 20px auto;"></div>`;
        try {
            const response = await puter.ai.chat([
                { role: "system", content: "Analyze this mission and provide risk and recommendations. Output STRICTLY valid JSON. Format: {\"risk_level\":\"Medium\",\"reason\":\"Short reason\",\"recommendation\":\"Short action\"}" },
                { role: "user", content: `Mission Name: ${m.name}\nDetails: ${m.description}\nDNA: ${JSON.stringify(m.dna)}` }
            ]);
            
            let rawContent = "";
            if (typeof response === 'string') rawContent = response;
            else if (response?.message?.content) rawContent = Array.isArray(response.message.content) ? response.message.content[0].text : response.message.content;
            else if (response?.text) rawContent = response.text;
            else rawContent = JSON.stringify(response);

            const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const advisor = JSON.parse(jsonMatch[0]);
                m.advisor = advisor;
                save();
                renderRouteContent();
                showToast('AI Advisor complete!', 'success');
            } else {
                throw new Error("Invalid JSON");
            }
        } catch (e) {
            console.error("Advisor Error:", e);
            // Fallback advisor data matching the partner's requested example
            m.advisor = {
                risk_level: "Medium",
                reason: "Weather delay predicted.",
                recommendation: "Increase team size by 2.\nDelay final inspection by 1 day."
            };
            save();
            renderRouteContent();
            showToast('AI Advisor generated (using fallback).', 'info');
        }
    };

    window.updateTaskNote = function(pi, ti, value) { const m = db.missions.find(x => x.id === currentProjectId); if (!m || !m.plan) return; m.plan[pi].tasks[ti].note = value; save(); showToast('Verification note saved', 'success'); };
    window.updateDNA = function(field, value) { const m = db.missions.find(x => x.id === currentProjectId); if (!m) return; if (!m.dna) m.dna = {}; m.dna[field] = value; save(); showToast('Mission DNA updated', 'success'); };
    window.updateReport = function(value) { const m = db.missions.find(x => x.id === currentProjectId); if (!m) return; m.report = value; save(); showToast('Report saved', 'success'); };
    window.assignWorker = function(phaseIndex, taskIndex, workerId) { const m = db.missions.find(x => x.id === currentProjectId); if (!m || !m.plan) return; const task = m.plan[phaseIndex].tasks[taskIndex]; const previousWorkerId = task.assignedTo; task.assignedTo = workerId === "" ? null : workerId; if (previousWorkerId) { const prevWorker = db.workers.find(w => w.id === previousWorkerId); if (prevWorker) { prevWorker.tasks = Math.max(0, prevWorker.tasks - 1); prevWorker.load = Math.max(0, prevWorker.load - 5); } } if (task.assignedTo) { const newWorker = db.workers.find(w => w.id === task.assignedTo); if (newWorker) { newWorker.tasks += 1; newWorker.load = Math.min(100, newWorker.load + 5); } } save(); addLog(`Worker assigned to task in ${m.id}.`); showToast('Worker assigned', 'success'); };
    window.toggleTaskStatus = function(phaseIndex, taskIndex) { const m = db.missions.find(x => x.id === currentProjectId); if (!m || !m.plan || !m.plan[phaseIndex] || !m.plan[phaseIndex].tasks[taskIndex]) return; const task = m.plan[phaseIndex].tasks[taskIndex]; task.done = !task.done; if (task.done && m.budget > 0) { const cost = Math.floor(Math.random() * 5000) + 1000; m.budgetUsed = (m.budgetUsed || 0) + cost; if (m.budgetUsed > m.budget) m.budgetUsed = m.budget; addLog(`Task completed: ${task.text} (Cost: $${cost.toLocaleString()})`); } let t = 0, c = 0; m.plan.forEach(p => p.tasks.forEach(tk => { t++; if(tk.done) c++; })); m.progress = t > 0 ? Math.round((c / t) * 100) : 0; save(); renderRouteContent(); if(task.done) { showToast('Task marked as done!', 'success'); } else { showToast('Task reverted.', 'info'); } };
    window.deleteMission = function(id) { db.missions = db.missions.filter(m => m.id !== id); save(); addLog(`Mission ${id} deleted.`); showToast('Mission deleted successfully', 'success'); navigate('ops', 'Active Missions'); };
    window.autoExecuteMission = async function() { const m = db.missions.find(x => x.id === currentProjectId); if (!m || !m.plan || m.progress === 100) return; const btn = document.getElementById('auto-exec-btn'); if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner" style="width:14px; height:14px; margin-right:8px;"></span> Executing...'; } showToast('Auto-execution started...', 'info'); for (let pi = 0; pi < m.plan.length; pi++) { for (let ti = 0; ti < m.plan[pi].tasks.length; ti++) { if (!m.plan[pi].tasks[ti].done) { const task = m.plan[pi].tasks[ti]; const worker = db.workers.find(w => w.id === task.assignedTo) || db.workers[Math.floor(Math.random() * db.workers.length)]; addLog(`${worker.name} started: ${task.text}`); showToast(`${worker.name} is working on: ${task.text}`, 'info'); await new Promise(resolve => setTimeout(resolve, 2500)); task.done = true; if (m.budget && m.budget > 0) { const cost = Math.floor(Math.random() * 5000) + 1000; m.budgetUsed = (m.budgetUsed || 0) + cost; if (m.budgetUsed > m.budget) m.budgetUsed = m.budget; addLog(`${worker.name} completed: ${task.text} (Cost: $${cost.toLocaleString()})`); } else { addLog(`${worker.name} completed: ${task.text}`); } let t = 0, c = 0; m.plan.forEach(p => p.tasks.forEach(tk => { t++; if(tk.done) c++; })); m.progress = t > 0 ? Math.round((c / t) * 100) : 0; save(); renderRouteContent(); } } } showToast('Mission auto-executed successfully!', 'success'); };
    
    window.generateFinalReport = async function() { 
      const m = db.missions.find(x => x.id === currentProjectId); if(!m) return; 
      modalContainer.innerHTML = `<div class="modal-overlay"><div class="modal-content"><div class="loader"></div><div class="modal-title">Generating Report...</div><div class="modal-text">Puter.js AI is synthesizing the final mission report.</div></div></div>`; 
      let report = null; 
      try { 
        const response = await puter.ai.chat([
            { role: "system", content: "You are a mission reporting AI. Generate a brief 2-paragraph final report summarizing the success and recommendations. Plain text only." },
            { role: "user", content: `Mission Name: ${m.name}\nDetails: ${m.description}` }
        ]);
        if (typeof response === 'string') report = response;
        else if (response?.message?.content) report = Array.isArray(response.message.content) ? response.message.content[0].text : response.message.content;
        else if (response?.text) report = response.text;
      } catch (e) { console.warn("AI call failed. Using fallback report."); } 
      if (!report) { report = "Mission completed successfully. All phases were executed within the defined constraints. Deliverables match the required quality standards. Recommendation: Archive project and proceed to next strategic objective."; } 
      m.report = report; save(); addLog(`Final report generated for ${m.id}.`); closeModal(); renderRouteContent(); showToast('Final report generated!', 'success'); 
    };
    
    window.editPhaseTitle = function(phaseIndex, btn) { const m = db.missions.find(x => x.id === currentProjectId); const h3 = document.getElementById(`phase-title-${phaseIndex}`); if(!h3) return; const currentText = h3.textContent; h3.outerHTML = `<input type="text" class="field-input" style="margin-bottom: 12px; width: 100%;" value="${currentText}" id="edit-phase-${phaseIndex}">`; btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`; btn.onclick = () => { const input = document.getElementById(`edit-phase-${phaseIndex}`); if(input) m.plan[phaseIndex].title = input.value; save(); renderRouteContent(); }; };
    window.editTask = function(phaseIndex, taskIndex, btn) { const m = db.missions.find(x => x.id === currentProjectId); const taskDiv = document.getElementById(`task-${phaseIndex}-${taskIndex}`); if(!taskDiv) return; const currentText = taskDiv.textContent; taskDiv.innerHTML = `<textarea class="field-input" style="width: 100%;" id="edit-task-${phaseIndex}-${taskIndex}">${currentText}</textarea>`; btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`; btn.onclick = () => { const input = document.getElementById(`edit-task-${phaseIndex}-${taskIndex}`); if(input) m.plan[phaseIndex].tasks[taskIndex].text = input.value; save(); renderRouteContent(); }; };

    window.showToast = function(message, type = 'info') { const container = document.getElementById('toast-container'); if(!container) return; const toast = document.createElement('div'); toast.className = `toast ${type}`; toast.textContent = message; container.appendChild(toast); setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(120%)'; setTimeout(() => toast.remove(), 300); }, 3000); };

    function setupRealtime() {
      if (realtimeChannel) sb.removeChannel(realtimeChannel);
      realtimeChannel = sb.channel('omnix-realtime')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'omnix_data', filter: `user_id=eq.${sessionUser.id}` }, payload => {
          const incomingState = payload.new.state;
          if (incomingState) {
            if (db.updatedAt !== incomingState.updatedAt) {
              db = { ...getDefaultDB(), ...incomingState };
              if(!db.user) db.user = {};
              db.user.name = db.user.name || sessionUser?.user_metadata?.full_name || sessionUser?.email;
              renderRouteContent(); 
            }
          }
        })
        .subscribe();
    }

    async function init() {
      const initLoader = document.getElementById('init-loader');
      try { if (initLoader) setTimeout(() => { initLoader.style.opacity = '0'; setTimeout(() => initLoader.remove(), 500); }, 600); } catch (e) {}

      const { data: { session } } = await sb.auth.getSession();
      if (session) {
        sessionUser = session.user;
        updateUrlUID(sessionUser.id);

        const dbState = await fetchDB();
        if (dbState) {
          db = { ...getDefaultDB(), ...dbState };
          if (!db.user) db.user = {};
          db.user.name = db.user.name || sessionUser?.user_metadata?.full_name || sessionUser?.email || 'User';
        } else {
          db.user = {
            name: sessionUser?.user_metadata?.full_name || sessionUser?.email || 'User',
            avatar: sessionUser?.user_metadata?.avatar_url || '',
            role: 'Mission Director',
            organization: '',
            hobbies: [],
            joinedDate: new Date().toLocaleDateString()
          };
          db.onboardingComplete = false;
        }

        applyTheme(db.theme || 'blue');
        setupRealtime();
      } else {
        applyTheme('blue');
      }

      sb.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          sessionUser = session.user;
          updateUrlUID(sessionUser.id);
          (async () => {
            const state = await fetchDB();
            if (state) {
              db = { ...getDefaultDB(), ...state };
              if (!db.user) db.user = {};
              db.user.name = db.user.name || sessionUser?.user_metadata?.full_name || sessionUser?.email || 'User';
            } else {
              db.user = {
                name: sessionUser?.user_metadata?.full_name || sessionUser?.email || 'User',
                avatar: sessionUser?.user_metadata?.avatar_url || '',
                role: 'Mission Director',
                organization: '',
                hobbies: [],
                joinedDate: new Date().toLocaleDateString()
              };
              db.onboardingComplete = false;
            }
            applyTheme(db.theme || 'blue');
            setupRealtime();
            renderApp();
          })();
        } else if (event === 'SIGNED_OUT') {
          sessionUser = null;
          db = getDefaultDB();
          if (realtimeChannel) { sb.removeChannel(realtimeChannel); realtimeChannel = null; }
          updateUrlUID(null);
          applyTheme('blue');
          renderApp();
        }
      });

      renderApp();
    }

    init().catch(err => console.error("OMNIX Init Error:", err));

})();
