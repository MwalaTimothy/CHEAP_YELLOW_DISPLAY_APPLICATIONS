/* ============================================================================
   AIR SENSE FIELD CONSOLE
   ----------------------------------------------------------------------------
   Everything here is presentation and pre-flight. The flashing itself belongs
   entirely to <esp-web-install-button> (ESP Web Tools): USB connect, chip
   detect, erase, write and verify all happen inside its own dialog, driven by
   esptool-js over Web Serial.

   Two rules this file does not break:

     1. No install is ever triggered programmatically. The technician clicks
        the real ESP Web Tools button. We only decide which one is on screen.
     2. No progress, state or success is ever invented. Every status string and
        every pixel of the progress bar comes from an esp-web-tools
        `state-changed` event. If those events never arrive — an older build,
        a blocked module load — the UI simply stays on "Ready" rather than
        showing a comforting fiction.
   ========================================================================== */
(function () {
  "use strict";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- Devices ---------------------------------------------------- */

  var DEVICES = {
    gateway: {
      title: "Install Air Sense Gateway",
      sub: "Gateway firmware v2.1.0 · ESP32-2432S028R",
      variants: "gateway",
      installer: "gateway-touch",
      successText: "Gateway firmware v2.1.0 installed. Next, connect the Gateway to the facility network."
    },
    node: {
      title: "Install Air Sense Sensor Node",
      sub: "Sensor Node firmware v1.1.0 · ESP32-C3",
      variants: "node",
      installer: "node",
      successText: "Sensor Node firmware v1.1.0 installed. Next, power it on while the Gateway’s pairing window is open."
    }
  };

  /* ---------- Navigation ------------------------------------------------- */

  var navToggle = $("[data-nav-toggle]");
  var navLinks = $("[data-nav-links]");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      var open = navLinks.getAttribute("data-open") === "true";
      navLinks.setAttribute("data-open", open ? "false" : "true");
      navToggle.setAttribute("aria-expanded", open ? "false" : "true");
      navToggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");
    });
    // Close the mobile menu after a jump, or it covers the section just landed on.
    navLinks.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        navLinks.setAttribute("data-open", "false");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Scrollspy. IntersectionObserver rather than a scroll handler so this costs
  // nothing while the page sits still, which is most of the time.
  var sections = $$("main section[id], main header.hero");
  var linkFor = {};
  $$(".nav-links a[href^='#']").forEach(function (a) { linkFor[a.getAttribute("href").slice(1)] = a; });

  if ("IntersectionObserver" in window && sections.length) {
    var visible = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { visible[entry.target.id] = entry.isIntersecting; });
      var current = null;
      for (var i = 0; i < sections.length; i++) {
        if (visible[sections[i].id]) { current = sections[i].id; break; }
      }
      Object.keys(linkFor).forEach(function (id) {
        if (id === current) linkFor[id].setAttribute("aria-current", "true");
        else linkFor[id].removeAttribute("aria-current");
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    sections.forEach(function (s) { if (s.id) spy.observe(s); });
  }

  /* ---------- Device cards ----------------------------------------------- */

  // The whole card is a click target, but the button stays the only focusable
  // control in it — nesting a real <button> inside another clickable element
  // would give a keyboard user two stops for one action.
  $$("[data-device-card]").forEach(function (card) {
    card.addEventListener("click", function (e) {
      if (e.target.closest("button, a")) return;
      var cta = $("[data-card-cta]", card);
      if (cta) cta.click();
    });
  });

  /* ---------- Installer dialog ------------------------------------------- */

  var dlg = $("#installer");
  var dlgTitle = $("[data-dlg-title]");
  var dlgSub = $("[data-dlg-sub]");
  var variantGroups = {};
  $$("[data-variant-group]").forEach(function (el) {
    variantGroups[el.getAttribute("data-variant-group")] = el;
  });

  // Which install button each choice mounts. A node family with no firmware
  // build yet is simply absent here and its radio is disabled in the markup,
  // so there is no path to flashing an image at a board it was not built for.
  var VARIANT_INSTALLER = {
    gateway: { "touch": "gateway-touch", "notouch": "gateway-notouch" },
    node: { "default": "node" }
  };
  var flashStatus = $("[data-flash-status]");
  var flashMsg = $("[data-flash-msg]");
  var progressWrap = $("[data-progress]");
  var progressFill = $("[data-progress-fill]");
  var successPanel = $("[data-success-panel]");
  var successText = $("[data-success-text]");
  var footNote = $("[data-dlg-foot-note]");

  var installers = {};
  $$("[data-installer]").forEach(function (el) { installers[el.getAttribute("data-installer")] = el; });

  var activeDevice = null;

  function showInstaller(key) {
    Object.keys(installers).forEach(function (k) { installers[k].hidden = (k !== key); });
  }

  function radioName(groupKey) {
    return groupKey === "gateway" ? "gw-variant" : groupKey + "-variant";
  }

  function currentInstaller(device) {
    if (!device.variants) return device.installer;
    var choice = $("input[name='" + radioName(device.variants) + "']:checked");
    var map = VARIANT_INSTALLER[device.variants] || {};
    // Falling back to device.installer keeps the dialog usable if a checked
    // value ever has no mapping, rather than mounting nothing at all.
    return (choice && map[choice.value]) || device.installer;
  }

  function resetDialogState() {
    if (flashStatus) flashStatus.setAttribute("data-visible", "false");
    if (flashMsg) { flashMsg.textContent = ""; flashMsg.removeAttribute("data-tone"); }
    if (progressWrap) progressWrap.hidden = true;
    if (progressFill) progressFill.style.width = "0%";
    if (successPanel) successPanel.hidden = true;
    if (footNote) footNote.hidden = false;
  }

  function openInstaller(deviceKey) {
    var device = DEVICES[deviceKey];
    if (!device || !dlg) return;
    activeDevice = deviceKey;

    dlgTitle.textContent = device.title;
    dlgSub.textContent = device.sub;
    Object.keys(variantGroups).forEach(function (k) {
      variantGroups[k].hidden = (k !== device.variants);
    });
    showInstaller(currentInstaller(device));
    resetDialogState();

    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.setAttribute("open", "");
  }

  $$("[data-open-installer]").forEach(function (btn) {
    btn.addEventListener("click", function () { openInstaller(btn.getAttribute("data-open-installer")); });
  });

  // Swapping a variant swaps which real install button is mounted.
  $$("[data-variant-group] input[type='radio']").forEach(function (radio) {
    radio.addEventListener("change", function () {
      if (activeDevice) showInstaller(currentInstaller(DEVICES[activeDevice]));
    });
  });

  if (dlg) {
    // Clicking the backdrop closes — but only the backdrop, never a stray click
    // that happened to land on the dialog's own padding.
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg) dlg.close();
    });
    var gotoProv = $("[data-goto-provisioning]");
    if (gotoProv) gotoProv.addEventListener("click", function () { dlg.close(); });
  }

  /* ---------- Real flash state ------------------------------------------- */

  var globalPill = $("[data-global-status]");
  var globalPillText = $("[data-global-status-text]");

  function setPill(el, textEl, state, label) {
    if (!el || !textEl) return;
    el.setAttribute("data-state", state);
    textEl.textContent = label;
  }

  function setDeviceStatus(deviceKey, state, label) {
    var pill = document.querySelector("[data-device-status='" + deviceKey + "']");
    if (!pill) return;
    setPill(pill, $("[data-device-status-text]", pill), state, label);
  }

  // esp-web-tools emits: initializing, manifest, preparing, erasing, writing,
  // finished, error. Anything unrecognised falls through to its own message
  // rather than being mapped onto a state we made up.
  var PHASE = {
    initializing: { state: "busy", label: "Connecting", text: "Connecting to the device…" },
    manifest: { state: "busy", label: "Reading", text: "Reading the firmware manifest…" },
    preparing: { state: "busy", label: "Preparing", text: "Preparing to install…" },
    erasing: { state: "busy", label: "Erasing", text: "Erasing flash. Do not disconnect the device." },
    writing: { state: "busy", label: "Writing", text: "Writing firmware. Do not disconnect the device." },
    finished: { state: "ok", label: "Complete", text: "Installation complete." },
    error: { state: "error", label: "Failed", text: "Installation did not complete." }
  };

  function onStateChanged(deviceKey, detail) {
    if (!detail || !detail.state) return;
    var phase = PHASE[detail.state];
    var state = phase ? phase.state : "busy";
    var label = phase ? phase.label : "Working";

    setPill(globalPill, globalPillText, state, label);
    setDeviceStatus(deviceKey, state, label);

    if (flashStatus) flashStatus.setAttribute("data-visible", "true");
    if (footNote) footNote.hidden = true;

    // Progress only exists while writing, and only if esp-web-tools actually
    // reported a percentage. No percentage, no bar.
    var pct = detail.details && typeof detail.details.percentage === "number" ? detail.details.percentage : null;
    if (detail.state === "writing" && pct !== null && progressWrap && progressFill) {
      progressWrap.hidden = false;
      progressFill.style.width = pct + "%";
      progressWrap.setAttribute("aria-valuenow", String(Math.round(pct)));
    } else if (detail.state !== "writing" && progressWrap) {
      progressWrap.hidden = true;
    }

    if (flashMsg) {
      var base = phase ? phase.text : (detail.message || "");
      if (detail.state === "writing" && pct !== null) base = "Writing firmware — " + Math.round(pct) + "%. Do not disconnect the device.";
      // On failure esp-web-tools' own message is the only thing that says what
      // actually went wrong, so it is appended rather than replaced by ours.
      if (detail.state === "error" && detail.message) base += " " + detail.message;
      flashMsg.textContent = base;
      if (detail.state === "error") flashMsg.setAttribute("data-tone", "error");
      else if (detail.state === "finished") flashMsg.setAttribute("data-tone", "ok");
      else flashMsg.removeAttribute("data-tone");
    }

    if (detail.state === "finished") {
      if (successPanel && successText) {
        successText.textContent = (DEVICES[deviceKey] || {}).successText || "";
        successPanel.hidden = false;
      }
      markChecklist("flashed");
    }
  }

  Object.keys(installers).forEach(function (key) {
    var deviceKey = key.indexOf("gateway") === 0 ? "gateway" : "node";
    installers[key].addEventListener("state-changed", function (e) {
      onStateChanged(deviceKey, e.detail);
    });
  });

  /* ---------- Field checklist -------------------------------------------- */
  /* Per-technician convenience only. localStorage is per-browser and never
     leaves the machine, so it is deliberately not treated as a record of
     anything — hence the visible Reset. Every access is guarded: private
     windows and blocked-site-data settings throw on read as well as write. */

  var CK_KEY = "airsense.fieldChecklist.v1";

  function readChecklist() {
    try {
      var raw = window.localStorage.getItem(CK_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      return {};
    }
  }

  function writeChecklist(state) {
    try { window.localStorage.setItem(CK_KEY, JSON.stringify(state)); } catch (err) { /* nothing to do */ }
  }

  var boxes = $$("[data-ck]");
  var ckState = readChecklist();

  boxes.forEach(function (box) {
    var key = box.getAttribute("data-ck");
    if (ckState[key]) box.checked = true;
    box.addEventListener("change", function () {
      ckState[key] = box.checked;
      writeChecklist(ckState);
    });
  });

  function markChecklist(key) {
    var box = document.querySelector("[data-ck='" + key + "']");
    if (!box || box.checked) return;
    box.checked = true;
    ckState[key] = true;
    writeChecklist(ckState);
    var auto = box.closest("label") && box.closest("label").querySelector("[data-ck-auto]");
    if (auto) auto.hidden = false;
  }

  var ckReset = $("[data-checklist-reset]");
  if (ckReset) {
    ckReset.addEventListener("click", function () {
      boxes.forEach(function (box) { box.checked = false; });
      ckState = {};
      writeChecklist(ckState);
      $$("[data-ck-auto]").forEach(function (el) { el.hidden = true; });
    });
  }
})();
