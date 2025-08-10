// ===========================
// Countdown Timer
// ===========================
const countdownDate = new Date("October 18, 2025 00:00:00").getTime();

const timer = setInterval(() => {
  const now = new Date().getTime();
  const distance = countdownDate - now;

  if (distance <= 0) {
    clearInterval(timer);
    document.querySelector(".countdown").innerHTML = "We are live!";
    return;
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  document.getElementById("days").textContent = String(days).padStart(2, '0');
  document.getElementById("hours").textContent = String(hours).padStart(2, '0');
  document.getElementById("minutes").textContent = String(minutes).padStart(2, '0');
  document.getElementById("seconds").textContent = String(seconds).padStart(2, '0');
}, 1000);


// ===========================
// Smooth Scroll
// ===========================
function scrollToSection() {
  document.getElementById("contact").scrollIntoView({ behavior: "smooth" });
}


 const ABSTRACT_API_KEY = "127070b86cd84667a510bf17880c59c0"; // Replace with your key

const customerForm = document.getElementById("customer-form");
const vendorForm = document.getElementById("vendor-form");

const submitCustomerBtn = customerForm.querySelector("button");
const submitVendorBtn = vendorForm.querySelector("button");

// ===========================
// Email Format Validator
// ===========================
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// ===========================
// Show Popup
// ===========================
function showPopup(type, message = "Something happened.") {
  const popupId = type === "success" ? "success-popup" : "error-popup";
  const popup = document.getElementById(popupId);
  if (!popup) return;
  popup.querySelector("p").textContent = message;
  popup.classList.remove("hidden");
  if (type === "success") playSuccessSound();
  setTimeout(() => popup.classList.add("hidden"), 4000);
}

// ===========================
// Play Success Sound
// ===========================
function playSuccessSound() {
  const audio = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3");
  audio.play();
}

// ===========================
// Toggle Forms
// ===========================
let currentActive = null;
function toggleForm(userType) {
  const customerBtn = document.getElementById("customerBtn");
  const vendorBtn = document.getElementById("vendorBtn");

  customerForm.classList.add("hidden");
  vendorForm.classList.add("hidden");
  customerBtn.classList.remove("active-btn");
  vendorBtn.classList.remove("active-btn");

  if (userType === currentActive) {
    currentActive = null;
  } else {
    currentActive = userType;
    if (userType === "customer") {
      customerForm.classList.remove("hidden");
      customerBtn.classList.add("active-btn");
    } else {
      vendorForm.classList.remove("hidden");
      vendorBtn.classList.add("active-btn");
    }
  }
}

// ===========================
// CUSTOMER FORM SUBMISSION
// ===========================
customerForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();

  if (!validateEmail(email)) {
    showPopup("error", "Invalid email format.");
    return;
  }

  submitCustomerBtn.disabled = true;
  submitCustomerBtn.textContent = "Submitting...";

  try {
    const res = await fetch("https://escrawl-backend.onrender.com/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const result = await res.json();

    if (!res.ok) {
      showPopup("error", result.error || result.message || "Failed");
      return;
    }

    await fetch("https://formspree.io/f/mdkdwovo", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email })
    });

    showPopup("success", "✅ You're on the waitlist!");
    customerForm.reset();
  } catch (err) {
    console.error(err);
    showPopup("error", "Submission failed. Try again.");
  } finally {
    submitCustomerBtn.disabled = false;
    submitCustomerBtn.textContent = "Notify Me";
  }
});

// ===========================
// VENDOR FORM SUBMISSION
// ===========================
vendorForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const business = document.getElementById("business").value.trim();
  const category = document.getElementById("category").value.trim();
  const website = document.getElementById("website").value.trim();
  const gst = document.getElementById("gst").value.trim();
  const vendorEmail = document.getElementById("vendor-email").value.trim();

  if (!validateEmail(vendorEmail)) {
    showPopup("error", "Please enter a valid email address.");
    return;
  }

  submitVendorBtn.disabled = true;
  submitVendorBtn.textContent = "Submitting...";

  try {
    // Step 1: Abstract API Validation
    const verifyRes = await fetch(
      `https://emailvalidation.abstractapi.com/v1/?api_key=${ABSTRACT_API_KEY}&email=${vendorEmail}`
    );

    if (verifyRes.status === 429) {
      showPopup("error", "Email validation limit exceeded. Try again later.");
      return;
    }

    const verifyData = await verifyRes.json();
    const isDeliverable = verifyData.deliverability === "DELIVERABLE";
    const isGmail = verifyData.is_free_email?.value && vendorEmail.endsWith("@gmail.com");

    if (!isDeliverable || !isGmail) {
      showPopup("error", "Please use a valid and deliverable Gmail address.");
      return;
    }

    // Step 2: Save to backend (MongoDB)
    const backendRes = await fetch("https://escrawl-backend.onrender.com/api/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business, category, website, gst, email: vendorEmail })
    });

    const backendData = await backendRes.json();

    if (!backendRes.ok) {
      showPopup("error", backendData.message || backendData.error || "Registration failed");
      return;
    }

    // Step 3: Send to Formspree
    await fetch("https://formspree.io/f/mdkdwovo", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email: vendorEmail })
    });

    showPopup("success", "🎉 Vendor registered successfully!");
    vendorForm.reset();
  } catch (err) {
    console.error("Vendor Submission Error:", err);
    showPopup("error", "Something went wrong. Please try again.");
  } finally {
    submitVendorBtn.disabled = false;
    submitVendorBtn.textContent = "Join Vendor Waitlist";
  }
});



// =============================
// DOM Elements
// =============================
const feedbackBtn = document.getElementById("feedbackBtn");
const feedbackModal = document.getElementById("feedbackModal");
const feedbackClose = document.getElementById("feedbackClose");
const feedbackForm = document.getElementById("feedbackForm");
const feedbackText = document.getElementById("feedbackText");

// Auto-switch backend URL
const BACKEND_URL = "https://escrawl-backend.onrender.com";
 // <-- replace with your live backend URL

// =============================
// Open Modal
// =============================
feedbackBtn.addEventListener("click", () => {
  feedbackModal.classList.remove("hidden");
});

// =============================
// Close Modal
// =============================
feedbackClose.addEventListener("click", () => {
  feedbackModal.classList.add("hidden");
});

// Close when clicking outside content
window.addEventListener("click", (e) => {
  if (e.target === feedbackModal) {
    feedbackModal.classList.add("hidden");
  }
});

// =============================
// Handle Form Submission
// =============================
feedbackForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  const text = feedbackText.value.trim();

  if (!text) {
    alert("Please write some feedback before submitting.");
    return;
  }

  try {
    // Send to backend
    const res = await fetch(`${BACKEND_URL}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to submit feedback.");
      return;
    }

    // Reset form & close modal
    feedbackText.value = "";
    feedbackModal.classList.add("hidden");

    // Show thank-you popup
    showThankYouPopup();

  } catch (error) {
    console.error("Feedback submit error:", error);
    alert("Something went wrong. Please try again.");
  }
});

// =============================
// Thank-You Popup
// =============================
function showThankYouPopup() {
  const popup = document.getElementById("thankYouPopup");
  popup.classList.remove("hidden");
  setTimeout(() => {
    popup.classList.add("hidden");
  }, 4000);
}

function closeThankYouPopup() {
  document.getElementById("thankYouPopup").classList.add("hidden");
}



  const videos = [
   //Shorts and regular YouTube videos
  "https://www.youtube.com/embed/k4UNU0dDvMA?autoplay=1&mute=1&controls=0&loop=1&playlist=k4UNU0dDvMA&rel=0",
  "https://www.youtube.com/embed/sEwdYLadc_Q?autoplay=1&mute=1&controls=0&loop=1&playlist=sEwdYLadc_Q&rel=0",
  "https://www.youtube.com/embed/PPt220id6KM?autoplay=1&mute=1&controls=0&loop=1&playlist=PPt220id6KM&rel=0"
];

let currentVideo = 0;
const heroVideo = document.getElementById("hero-video");

function loadNextVideo() {
  heroVideo.classList.remove("slideUp");
  currentVideo = (currentVideo + 1) % videos.length;
  heroVideo.src = videos[currentVideo];

  // Animation restart trick
  void heroVideo.offsetWidth; // Force reflow
  heroVideo.classList.add("slideUp");
}

// Load first video
heroVideo.src = videos[0];

// Change every 20 seconds
setInterval(loadNextVideo, 20000);








