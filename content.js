let enabled = false;
let activeHighlights = [];

chrome.runtime.onMessage.addListener((request) => {
  if (request.toggle) {
    enabled = !enabled;
    if (enabled) {
      showOverlay();
      showLegendBox();
      autoScrollPage(() => {
        highlightLCP();
        highlightCLS();
        highlightFID();
        highlightINP();
        highlightFCP();
      });
    } else {
      hideOverlay();
      removeLegendBox();
      document.querySelectorAll(".cwv-highlight").forEach(el => {
        el.style.outline = "";
        el.removeAttribute("title");
        el.classList.remove("cwv-highlight");
      });
      document.querySelectorAll(".cwv-label").forEach(el => el.remove());
      activeHighlights = [];
    }
  }
});

function showOverlay() {
  const overlay = document.createElement("div");
  overlay.id = "cwv-active";
  overlay.textContent = "CWV Highlighting Active";
  overlay.style.position = "fixed";
  overlay.style.top = "10px";
  overlay.style.right = "10px";
  overlay.style.background = "#000";
  overlay.style.color = "#fff";
  overlay.style.padding = "5px 10px";
  overlay.style.zIndex = "99999";
  document.body.appendChild(overlay);
}

function hideOverlay() {
  const el = document.getElementById("cwv-active");
  if (el) el.remove();
}

function showLegendBox() {
  if (document.getElementById("cwv-legend")) return;
  const box = document.createElement("div");
  box.id = "cwv-legend";
  box.innerHTML = `
    <strong>Core Web Vitals Legend</strong><br>
    🟥 <b>LCP</b>: Largest Contentful Paint<br>
    🟧 <b>CLS</b>: Layout Shifted Elements<br>
    🟢 <b>FID</b>: First Input Delay Target<br>
    🔵 <b>INP</b>: Interaction Target<br>
    🟣 <b>FCP</b>: First Contentful Paint<br>
  `;
  box.style.position = "fixed";
  box.style.top = "10px";
  box.style.left = "10px";
  box.style.background = "#fff";
  box.style.border = "1px solid #ccc";
  box.style.padding = "10px";
  box.style.zIndex = "99999";
  box.style.fontSize = "12px";
  box.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
  box.style.borderRadius = "6px";
  document.body.appendChild(box);
}

function removeLegendBox() {
  const box = document.getElementById("cwv-legend");
  if (box) box.remove();
}

function highlightElement(el, label, color) {
  if (!el || activeHighlights.includes(el)) return;
  el.style.outline = `3px dashed ${color}`;
  el.setAttribute("title", label);
  el.classList.add("cwv-highlight");
  labelElement(el, label.split(" ")[0]);
  activeHighlights.push(el);
}

function labelElement(el, text) {
  const tag = document.createElement("span");
  tag.textContent = text;
  tag.className = "cwv-label";
  const rect = el.getBoundingClientRect();
  tag.style.top = `${window.scrollY + rect.top}px`;
  tag.style.left = `${window.scrollX + rect.left}px`;
  tag.style.position = "absolute";
  document.body.appendChild(tag);
}

function highlightLCP() {
  try {
    const po = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry && lastEntry.element) {
        highlightElement(lastEntry.element, "LCP Element", "red");
      }
    });
    po.observe({ type: "largest-contentful-paint", buffered: true });
  } catch (e) {
    console.warn("LCP not supported:", e);
  }
}

function highlightCLS() {
  try {
    const po = new PerformanceObserver((entryList) => {
      entryList.getEntries().forEach((entry) => {
        entry.sources.forEach(source => {
          if (source.node) {
            highlightElement(source.node, "CLS Shifted Element", "orange");
          }
        });
      });
    });
    po.observe({ type: "layout-shift", buffered: true });
  } catch (e) {
    console.warn("CLS not supported:", e);
  }
}

function highlightFID() {
  try {
    const po = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      if (entries.length > 0) {
        const entry = entries[0];
        const target = entry.target;
        if (target) {
          highlightElement(target, "FID Target Element", "green");
        }
      }
    });
    po.observe({ type: "first-input", buffered: true });
  } catch (e) {
    console.warn("FID not supported:", e);
  }
}

function highlightINP() {
  try {
    const po = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      if (entries.length > 0) {
        const entry = entries[entries.length - 1];
        const target = entry.target;
        if (target) {
          highlightElement(target, "INP Target Element", "blue");
        }
      }
    });
    po.observe({ type: "event", buffered: true, durationThreshold: 40 });
  } catch (e) {
    console.warn("INP not supported:", e);
  }
}

function highlightFCP() {
  try {
    const po = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      if (entries.length > 0) {
        const entry = entries[entries.length - 1];
        const fcpTime = entry.startTime.toFixed(2);
        const target = document.body;
        if (target) {
          highlightElement(target, `FCP @ ${fcpTime}ms`, "purple");
        }
      }
    });
    po.observe({ type: "paint", buffered: true });
  } catch (e) {
    console.warn("FCP not supported:", e);
  }
}

function autoScrollPage(callback) {
  const totalHeight = document.body.scrollHeight;
  let current = 0;
  const step = window.innerHeight / 2;

  const scrollInterval = setInterval(() => {
    window.scrollTo({ top: current, behavior: "smooth" });
    current += step;
    if (current >= totalHeight) {
      clearInterval(scrollInterval);
      if (callback) callback();
    }
  }, 400);
}
