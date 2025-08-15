// ===========================
// CONFIG
// ===========================
const CONFIG = {
  launchDate: new Date("October 18, 2025 00:00:00").getTime(),
  backendUrl:
    location.hostname.includes("localhost") || location.hostname === "127.0.0.1"
      ? "http://localhost:5000"
      : "https://escrawl-backend.onrender.com", // ← set your prod API origin
  defaultVideos: [
    "https://www.youtube.com/embed/k4UNU0dDvMA?autoplay=1&mute=1&controls=0&loop=1&playlist=k4UNU0dDvMA&rel=0",
    "https://www.youtube.com/embed/sEwdYLadc_Q?autoplay=1&mute=1&controls=0&loop=1&playlist=sEwdYLadc_Q&rel=0",
    "https://www.youtube.com/embed/PPt220id6KM?autoplay=1&mute=1&controls=0&loop=1&playlist=PPt220id6KM&rel=0"
  ]
};

// Optionally expose dataLayer for marketing/analytics
window.dataLayer = window.dataLayer || [];
const track = (event, payload = {}) =>
  window.dataLayer.push({ event, ...payload });

// ===========================
// UTILS
// ===========================
const qs = (s) => document.querySelector(s);
const qsa = (s) => Array.from(document.querySelectorAll(s));
const byId = (id) => document.getElementById(id);

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const setBtnLoading = (btn, loading) => {
  if (!btn) return;
  if (loading) {
    btn.dataset.label = btn.textContent.trim();
    btn.innerHTML = '<span class="spinner" aria-hidden="true"></span>';
    btn.disabled = true;
  } else {
    btn.textContent = btn.dataset.label || btn.textContent;
    btn.disabled = false;
  }
};

const openModal = (id) => {
  const m = byId(id);
  if (!m) return;
  m.classList.add("open");
  m.setAttribute("aria-hidden", "false");
  track("modal_open", { id });
};
const closeModal = (id) => {
  const m = byId(id);
  if (!m) return;
  m.classList.remove("open");
  m.setAttribute("aria-hidden", "true");
  track("modal_close", { id });
};

const showToast = (msg, kind = "info", autoCloseMs = 3500) => {
  const wrap = byId("popup");
  const card = byId("popupCard");
  if (!wrap || !card) return;
  card.textContent = msg;
  card.style.background =
    kind === "error"
      ? "rgba(200,40,40,.97)"
      : "rgba(30,70,80,.97)";
  wrap.classList.add("open");
  card.setAttribute("tabindex", "-1");
  card.focus({ preventScroll: true });
  setTimeout(() => wrap.classList.remove("open"), autoCloseMs);
};

const showThankYou = () => {
  const t = byId("thankYou");
  if (!t) return;
  t.classList.add("open");
  setTimeout(() => t.classList.remove("open"), 2500);
};

// Close with backdrop click or buttons bearing data-close
window.addEventListener("click", (e) => {
  const tgt = e.target;
  if (tgt.classList.contains("modal")) closeModal(tgt.id);
});
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-close]");
  if (btn) {
    e.preventDefault();
    closeModal(btn.dataset.close);
  }
});

// ===========================
// HEADER audience buttons → open modals
// ===========================
byId("customerBtn")?.addEventListener("click", () => {
  openModal("customerModal");
  track("cta_click", { cta: "customer" });
});
byId("vendorBtn")?.addEventListener("click", () => {
  openModal("vendorModal");
  track("cta_click", { cta: "vendor" });
});

// ===========================
// COUNTDOWN
// ===========================
(function initCountdown() {
  const daysEl = byId("days"),
    hoursEl = byId("hours"),
    minsEl = byId("minutes"),
    secsEl = byId("seconds");
  if (!daysEl) return;
  const timer = setInterval(() => {
    const now = Date.now();
    const d = CONFIG.launchDate - now;
    if (d <= 0) {
      clearInterval(timer);
      qs(".countdown").textContent = "We are live!";
      return;
    }
    const days = Math.floor(d / 86400000);
    const hours = Math.floor((d % 86400000) / 3600000);
    const minutes = Math.floor((d % 3600000) / 60000);
    const seconds = Math.floor((d % 60000) / 1000);
    daysEl.textContent = String(days).padStart(2, "0");
    hoursEl.textContent = String(hours).padStart(2, "0");
    minsEl.textContent = String(minutes).padStart(2, "0");
    secsEl.textContent = String(seconds).padStart(2, "0");
  }, 1000);
})();

// ===========================
// VIDEO ROTATION (with backend fallback)
// ===========================
(async function initVideos() {
  const hero = byId("hero-video");
  if (!hero) return;
  let list = [];
  try {
    const res = await fetch(`${CONFIG.backendUrl}/api/hero-videos`);
    if (res.ok) {
      const data = await res.json();
      list = Array.isArray(data) ? data : data.videos || [];
    }
  } catch {
    /* ignore */
  }
  if (!list.length) list = CONFIG.defaultVideos;

  let idx = 0;
  const load = (i) => {
    hero.src = list[i % list.length];
  };
  load(0);
  setInterval(() => {
    idx = (idx + 1) % list.length;
    load(idx);
  }, 20000);
})();

// ===========================
// FORMS (send only to backend)
// ===========================
byId("customer-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = byId("email").value.trim();
  const btn = byId("customerSubmit");
  if (!validateEmail(email)) return showToast("Invalid email format", "error");
  try {
    setBtnLoading(btn, true);
    const res = await fetch(`${CONFIG.backendUrl}/api/customers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || "Failed to save");
    closeModal("customerModal");
    showToast("✅ You're on the waitlist!");
    e.target.reset();
    track("lead_submit", { type: "customer" });
  } catch (err) {
    showToast(err.message || "Submission failed. Try again.", "error");
  } finally {
    setBtnLoading(btn, false);
  }
});

byId("vendor-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const business = byId("business").value.trim();
  const category = byId("category").value.trim();
  const website = byId("website").value.trim();
  const gst = byId("gst").value.trim();
  const email = byId("vendor-email").value.trim();
  const btn = byId("vendorSubmit");

  if (!business) return showToast("Please add your business name", "error");
  if (!validateEmail(email)) return showToast("Please enter a valid email", "error");

  try {
    setBtnLoading(btn, true);
    const res = await fetch(`${CONFIG.backendUrl}/api/vendors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business, category, website, gst, email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || "Registration failed");

    closeModal("vendorModal");
    showToast("🎉 Vendor registered successfully!");
    e.target.reset();
    track("lead_submit", { type: "vendor" });
  } catch (err) {
    showToast(err.message || "Something went wrong. Please try again.", "error");
  } finally {
    setBtnLoading(btn, false);
  }
});

// FEEDBACK
byId("feedbackBtn")?.addEventListener("click", () => openModal("feedbackModal"));
byId("feedbackForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = byId("feedbackText").value.trim();
  const btn = byId("feedbackSubmit");
  if (!text) return showToast("Please write some feedback first.", "error");
  try {
    setBtnLoading(btn, true);
    const res = await fetch(`${CONFIG.backendUrl}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Failed to submit feedback");
    byId("feedbackText").value = "";
    closeModal("feedbackModal");
    showThankYou();
    track("feedback_submit");
  } catch (err) {
    showToast(err.message || "Something went wrong.", "error");
  } finally {
    setBtnLoading(btn, false);
  }
});

// Optional: smooth scroll helper
function scrollToContact() {
  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
}
window.scrollToContact = scrollToContact;

