// MacReady Siri assistant behavior
// Extracted from app.js so assistant logic can be maintained independently.

// --- macOS Tahoe 26 Siri/Copilot AI Voice HUD System ---
let siriWaveId = null;
let siriWavePhase = 0;
let siriWaveState = "listening"; // "listening", "thinking", "speaking"
let micStream = null;
let micAnalyser = null;
let micDataArray = null;
let micContext = null;
let micEnabled = false;
let siriMediaRecorder = null;
let siriAudioChunks = [];
let siriActive = false;
let siriVoiceMonitorInterval = null;
let siriRecordingStopTimer = null;
let siriResponseTimer = null;
let siriRequestId = 0;
let siriWaveLastFrame = 0;
const SIRI_WAVE_FRAME_INTERVAL = 1000 / 30;

function initSiriAssistant() {
  const siriToggle = document.getElementById("menu-siri-toggle");
  const siriHud = document.getElementById("siri-hud");
  const siriBackdrop = document.getElementById("siri-focus-backdrop");
  const siriInput = document.getElementById("siri-input");
  const siriMicToggle = document.getElementById("siri-mic-toggle");
  const siriSuggestions = document.querySelectorAll(".siri-suggestions .siri-tag");
  const siriSettingsSwitch = document.getElementById("settings-siri-toggle-switch");

  if (!siriHud) return;

  // A. Persistent Preference Settings System
  const siriEnabledPref = localStorage.getItem("macready_siri_enabled") ?? "true";
  if (siriToggle) {
    if (siriEnabledPref === "true") {
      siriToggle.style.display = "";
      if (siriSettingsSwitch) siriSettingsSwitch.checked = true;
    } else {
      siriToggle.style.display = "none";
      if (siriSettingsSwitch) siriSettingsSwitch.checked = false;
    }
  }

  if (siriSettingsSwitch) {
    siriSettingsSwitch.addEventListener("change", () => {
      const isChecked = siriSettingsSwitch.checked;
      localStorage.setItem("macready_siri_enabled", isChecked ? "true" : "false");
      if (siriToggle) {
        siriToggle.style.display = isChecked ? "" : "none";
      }
      if (!isChecked && siriActive) {
        closeSiriHud();
      }
    });
  }

  // B. Toggle Assistant Panel Click Listeners
  if (siriToggle) {
    siriToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeAllDropdowns();
      if (siriActive) {
        closeSiriHud();
      } else {
        openSiriHud();
      }
    });
  }

  if (siriBackdrop) {
    siriBackdrop.addEventListener("click", () => {
      closeSiriHud();
    });
  }

  // C. Suggestions Click Event Listeners
  siriSuggestions.forEach(tag => {
    tag.addEventListener("click", () => {
      const query = tag.getAttribute("data-query");
      if (siriInput && query) {
        siriInput.value = query;
        submitSiriQuery(query);
      }
    });
  });

  // D. Voice Input Toggle
  if (siriMicToggle) {
    siriMicToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleSiriMic();
    });
  }

  // E. Keyboard Input Submission
  if (siriInput) {
    siriInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const query = siriInput.value.trim();
        if (query) {
          submitSiriQuery(query);
        }
      }
    });
  }

  window.addEventListener("resize", () => {
    if (siriActive) positionSiriHud();
  });
}

function openSiriHud() {
  const siriHud = document.getElementById("siri-hud");
  const siriBackdrop = document.getElementById("siri-focus-backdrop");
  const siriStatus = document.getElementById("siri-status-text");
  const siriResponse = document.getElementById("siri-response-text");
  const siriInput = document.getElementById("siri-input");

  if (!siriHud) return;

  siriActive = true;
  closeAllDropdowns();
  siriHud.classList.remove("show");
  siriHud.classList.add("siri-positioning");
  positionSiriHud();
  if (siriBackdrop) {
    void siriBackdrop.offsetWidth;
    siriBackdrop.classList.add("show");
  }
  void siriHud.offsetWidth;
  requestAnimationFrame(() => {
    if (!siriActive) return;
    siriHud.classList.remove("siri-positioning");
    siriHud.classList.add("show");
  });

  if (siriStatus) {
    siriStatus.textContent = "What would you like to do?";
  }
  if (siriResponse) {
    siriResponse.style.display = "none";
    siriResponse.textContent = "";
  }
  if (siriInput) {
    siriInput.value = "";
    setTimeout(() => siriInput.focus(), 150);
  }

  siriWaveState = "listening";
  siriWavePhase = 0;
  drawSiriWaveFrame();
  stopSiriWaveAnimation();
}

function closeSiriHud() {
  const siriHud = document.getElementById("siri-hud");
  const siriBackdrop = document.getElementById("siri-focus-backdrop");
  if (!siriHud) return;

  siriActive = false;
  siriRequestId++;
  if (siriResponseTimer) {
    clearTimeout(siriResponseTimer);
    siriResponseTimer = null;
  }
  siriHud.classList.remove("show");
  if (siriBackdrop) siriBackdrop.classList.remove("show");
  cancelSiriVoiceRecording();
  if (siriVoiceMonitorInterval) {
    clearInterval(siriVoiceMonitorInterval);
    siriVoiceMonitorInterval = null;
  }

  setTimeout(() => {
    if (!siriActive) {
      stopSiriWaveAnimation();
    }
  }, 350);
}

function startSiriWaveAnimation() {
  if (!siriActive || siriWaveId) return;
  siriWaveId = requestAnimationFrame(animateSiriWave);
}

function stopSiriWaveAnimation() {
  if (!siriWaveId) return;
  cancelAnimationFrame(siriWaveId);
  siriWaveId = null;
  siriWaveLastFrame = 0;
}

function positionSiriHud() {
  const siriHud = document.getElementById("siri-hud");
  const siriToggle = document.getElementById("menu-siri-toggle");
  if (!siriHud || !siriToggle) return;

  const rect = siriToggle.getBoundingClientRect();
  const panelWidth = Math.min(320, window.innerWidth - 24);
  const left = Math.min(
    Math.max(12, rect.left + rect.width / 2 - panelWidth / 2),
    window.innerWidth - panelWidth - 12
  );
  const top = Math.max(34, rect.bottom + 8);

  siriHud.style.width = `${panelWidth}px`;
  siriHud.style.top = `${top}px`;
  siriHud.style.setProperty("left", `${left}px`, "important");
  siriHud.style.setProperty("right", "auto", "important");
}

function animateSiriWave(timestamp = 0) {
  siriWaveId = null;
  if (!siriActive) return;

  if (!siriWaveLastFrame || timestamp - siriWaveLastFrame >= SIRI_WAVE_FRAME_INTERVAL) {
    siriWaveLastFrame = timestamp;
    drawSiriWaveFrame();
  }

  if (siriWaveState !== "listening" || micEnabled) {
    siriWaveId = requestAnimationFrame(animateSiriWave);
  }
}

function drawSiriWaveFrame() {
  const p1 = document.getElementById("wave-path-1");
  const p2 = document.getElementById("wave-path-2");
  const p3 = document.getElementById("wave-path-3");
  if (!p1 || !p2 || !p3) return;

  siriWavePhase += 0.12;
  
  let amp1, amp2, amp3;
  let freq1, freq2, freq3;

  let micVolume = 0;
  if (micEnabled && micAnalyser && micDataArray) {
    micAnalyser.getByteFrequencyData(micDataArray);
    let sum = 0;
    for (let i = 0; i < micDataArray.length; i++) {
      sum += micDataArray[i];
    }
    micVolume = sum / micDataArray.length; // Average volume level
  }
  
  if (siriWaveState === "listening") {
    // Breathing/idle wave modulated optionally by real microphone volume
    const baseAmp1 = 15 * Math.sin(siriWavePhase * 0.15) + 12;
    const baseAmp2 = 8 * Math.cos(siriWavePhase * 0.2) + 8;
    const baseAmp3 = 5 * Math.sin(siriWavePhase * 0.25) + 4;
    
    amp1 = baseAmp1 + micVolume * 0.6;
    amp2 = baseAmp2 + micVolume * 0.4;
    amp3 = baseAmp3 + micVolume * 0.25;
    
    freq1 = 0.015;
    freq2 = 0.022;
    freq3 = 0.03;
  } else if (siriWaveState === "thinking") {
    // Thinking state: rapid, low amplitude, high frequency ripple
    amp1 = 4 * Math.sin(siriWavePhase * 0.8) + 3;
    amp2 = 3 * Math.cos(siriWavePhase * 0.6) + 2;
    amp3 = 2.5 * Math.sin(siriWavePhase * 0.9) + 1.5;
    freq1 = 0.07;
    freq2 = 0.09;
    freq3 = 0.11;
  } else if (siriWaveState === "speaking") {
    // Speaking state: talking amplitude linked to text animation
    amp1 = Math.abs(Math.sin(siriWavePhase * 0.35)) * 25 + 8;
    amp2 = Math.abs(Math.cos(siriWavePhase * 0.25)) * 16 + 5;
    amp3 = Math.abs(Math.sin(siriWavePhase * 0.45)) * 10 + 3;
    freq1 = 0.02;
    freq2 = 0.03;
    freq3 = 0.045;
  }

  // Draw smooth waveforms with central hump envelope
  drawSiriWavePath(p1, amp1, freq1, siriWavePhase, 60);
  drawSiriWavePath(p2, amp2, freq2, siriWavePhase + 2.5, 60);
  drawSiriWavePath(p3, amp3, freq3, siriWavePhase + 5.0, 60);
}

function drawSiriWavePath(pathEl, amp, freq, phase, centerY) {
  let d = `M 0 ${centerY}`;
  for (let x = 0; x <= 400; x += 8) {
    // Hanning-style sine envelope window makes the wave start/end elegantly at 0
    const progress = x / 400;
    const envelope = Math.sin(progress * Math.PI);
    const y = centerY + Math.sin(x * freq + phase) * amp * envelope;
    d += ` L ${x} ${y}`;
  }
  pathEl.setAttribute("d", d);
}

async function toggleSiriMic() {
  const micBtn = document.getElementById("siri-mic-toggle");
  const statusText = document.getElementById("siri-status-text");
  if (!micBtn) return;
  
  if (micEnabled) {
    stopSiriVoiceRecording();
    return;
  }

  if (!window.MediaRecorder) {
    if (statusText) statusText.textContent = "Voice recording is not available in this browser.";
    return;
  }

  try {
    await startSiriMicStream();
    const mimeType = getSiriAudioMimeType();
    siriAudioChunks = [];
    siriMediaRecorder = new MediaRecorder(micStream, mimeType ? { mimeType } : undefined);

    siriMediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        siriAudioChunks.push(event.data);
      }
    };

    siriMediaRecorder.onstop = async () => {
      const chunks = siriAudioChunks.slice();
      const recordedType = siriMediaRecorder?.mimeType || mimeType || "audio/webm";
      siriMediaRecorder = null;
      siriAudioChunks = [];
      micEnabled = false;
      micBtn.classList.remove("active");
      disableMicStream();

      if (!chunks.length) {
        if (statusText) statusText.textContent = "No voice audio was recorded.";
        siriWaveState = "listening";
        return;
      }

      try {
        if (statusText) statusText.textContent = "Transcribing...";
        siriWaveState = "thinking";
        const audioBlob = new Blob(chunks, { type: recordedType });
        const transcript = await requestCloudflareTranscription(audioBlob);
        const siriInput = document.getElementById("siri-input");
        if (siriInput) siriInput.value = transcript;
        submitSiriQuery(transcript);
      } catch (error) {
        if (statusText) statusText.textContent = error?.message || "Voice transcription failed.";
        siriWaveState = "listening";
      }
    };

    siriMediaRecorder.start();
    micEnabled = true;
    micBtn.classList.add("active");
    if (statusText) statusText.textContent = "Listening...";
    siriWaveState = "listening";
    startSiriWaveAnimation();
    siriRecordingStopTimer = setTimeout(() => {
      stopSiriVoiceRecording();
    }, 6500);
  } catch (error) {
    console.error("Voice recording error:", error);
    stopSiriVoiceRecording();
    micEnabled = false;
    micBtn.classList.remove("active");
    if (statusText) statusText.textContent = getSiriVoiceErrorMessage(error?.name || error?.message);
  }
}

function getSiriAudioMimeType() {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4"
  ];
  return types.find(type => MediaRecorder.isTypeSupported(type)) || "";
}

async function startSiriMicStream() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("media-devices-unavailable");
  }

  if (micStream && micAnalyser && micDataArray) return;

  micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  micContext = new (window.AudioContext || window.webkitAudioContext)();
  if (micContext.state === "suspended") {
    await micContext.resume();
  }

  const source = micContext.createMediaStreamSource(micStream);
  micAnalyser = micContext.createAnalyser();
  micAnalyser.fftSize = 256;
  micDataArray = new Uint8Array(micAnalyser.frequencyBinCount);
  source.connect(micAnalyser);
}

function getSiriVoiceErrorMessage(errorCode = "") {
  const code = String(errorCode).toLowerCase();
  if (code.includes("not-allowed") || code.includes("service-not-allowed") || code.includes("permission")) {
    return "Voice input needs microphone permission.";
  }
  if (code.includes("audio-capture") || code.includes("notfound") || code.includes("notreadable")) {
    return "No microphone is available.";
  }
  if (code.includes("no-speech")) {
    return "I didn't catch that.";
  }
  if (code.includes("network")) {
    return "Voice transcription could not connect.";
  }
  if (code.includes("media-devices-unavailable")) {
    return "Voice input is not available in this browser.";
  }
  return "Voice input stopped.";
}

function stopSiriVoiceRecording() {
  const micBtn = document.getElementById("siri-mic-toggle");
  clearSiriRecordingTimer();
  micEnabled = false;
  if (micBtn) micBtn.classList.remove("active");
  if (siriWaveState === "listening") stopSiriWaveAnimation();
  if (siriMediaRecorder) {
    const recorder = siriMediaRecorder;
    try {
      if (recorder.state !== "inactive") recorder.stop();
    } catch (error) {
      console.warn("Voice recording already stopped.", error);
    }
    return;
  }
  disableMicStream();
}

function cancelSiriVoiceRecording() {
  clearSiriRecordingTimer();
  micEnabled = false;
  const micBtn = document.getElementById("siri-mic-toggle");
  if (micBtn) micBtn.classList.remove("active");
  if (siriWaveState === "listening") stopSiriWaveAnimation();
  if (siriMediaRecorder) {
    const recorder = siriMediaRecorder;
    siriMediaRecorder = null;
    recorder.ondataavailable = null;
    recorder.onstop = null;
    try {
      if (recorder.state !== "inactive") recorder.stop();
    } catch (error) {
      console.warn("Voice recording already stopped.", error);
    }
  }
  siriAudioChunks = [];
  disableMicStream();
}

function clearSiriRecordingTimer() {
  if (siriRecordingStopTimer) {
    clearTimeout(siriRecordingStopTimer);
    siriRecordingStopTimer = null;
  }
}

function disableMicStream() {
  micEnabled = false;
  const micBtn = document.getElementById("siri-mic-toggle");
  if (micBtn) micBtn.classList.remove("active");
  
  if (micStream) {
    micStream.getTracks().forEach(track => track.stop());
    micStream = null;
  }
  if (micContext) {
    if (micContext.state !== "closed") {
      micContext.close();
    }
    micContext = null;
  }
  micAnalyser = null;
  micDataArray = null;
}

function startVoiceVolumeMonitor() {
  if (siriVoiceMonitorInterval) clearInterval(siriVoiceMonitorInterval);
  
  let highVolumeTicks = 0;
  let quietTicks = 0;
  let voiceQuerySimulated = false;

  siriVoiceMonitorInterval = setInterval(() => {
    if (!micEnabled || !micAnalyser || !micDataArray) return;
    
    micAnalyser.getByteFrequencyData(micDataArray);
    let sum = 0;
    for (let i = 0; i < micDataArray.length; i++) { sum += micDataArray[i]; }
    const vol = sum / micDataArray.length;
    
    if (vol > 28) {
      highVolumeTicks++;
      quietTicks = 0;
      voiceQuerySimulated = true;
    } else {
      quietTicks++;
      if (quietTicks > 12 && voiceQuerySimulated && highVolumeTicks > 6) {
        // User finished speaking! Let's trigger a dynamic random voice query
        clearInterval(siriVoiceMonitorInterval);
        siriVoiceMonitorInterval = null;
        
        const queries = ["Find RPG games", "Open User Account", "Check system status", "Toggle Light Mode", "Search Simulation"];
        const randQuery = queries[Math.floor(Math.random() * queries.length)];
        
        const siriInput = document.getElementById("siri-input");
        if (siriInput) {
          siriInput.value = randQuery;
          submitSiriQuery(randQuery);
        }
        disableMicStream();
      }
    }
  }, 100);
}

const SIRI_API_ENDPOINT = "/api/siri";
const SIRI_TRANSCRIBE_ENDPOINT = "/api/transcribe";

async function requestCloudflareSiri(query) {
  const response = await fetch(SIRI_API_ENDPOINT, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: query,
      context: getSiriAssistantContext()
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.reply || "Siri could not reach the AI service.");
  }

  return {
    text: payload.reply || "Siri received an empty answer from the AI service."
  };
}

async function requestCloudflareTranscription(audioBlob) {
  const response = await fetch(SIRI_TRANSCRIBE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": audioBlob.type || "application/octet-stream"
    },
    body: audioBlob
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error || "Voice transcription failed.");
  }

  const transcript = String(payload?.text || "").trim();
  if (!transcript) {
    throw new Error("I could not hear any speech.");
  }
  return transcript;
}

function getSiriAssistantContext() {
  const visibleArticles = articles
    .filter(shouldRenderArticle)
    .slice(0, 8)
    .map(article => ({
      title: article.title,
      source: article.sourceName,
      category: getCategoryTitle(article.category || "technology")
    }));

  const visibleGames = gamesCache
    .slice(0, 8)
    .map(game => ({
      name: game.name,
      genres: game.genres || [],
      rating: game.macRating || game.rating || ""
    }));

  return {
    app: currentApp,
    category: currentCategory,
    library: currentLibrary,
    articles: visibleArticles,
    games: visibleGames,
    signedIn: currentUsername !== "Guest",
    username: currentUsername || "Guest"
  };
}

function renderSiriResponse(response, responseText, requestId = siriRequestId) {
  if (requestId !== siriRequestId) return;
  siriWaveState = "speaking";
  startSiriWaveAnimation();

  if (responseText) {
    responseText.style.display = "block";
    typewriterEffect(responseText, response.text, () => {
      if (requestId !== siriRequestId) return;
      siriWaveState = "listening";
      stopSiriWaveAnimation();
    }, requestId);
  }

  if (response.action) {
    setTimeout(() => {
      if (requestId !== siriRequestId) return;
      response.action();
    }, 500);
  }
}

function submitSiriQuery(query) {
  const statusText = document.getElementById("siri-status-text");
  const responseText = document.getElementById("siri-response-text");
  const siriInput = document.getElementById("siri-input");

  if (!query || !query.trim()) return;

  const requestId = ++siriRequestId;
  if (siriResponseTimer) {
    clearTimeout(siriResponseTimer);
    siriResponseTimer = null;
  }

  // Set Wave to Thinking
  siriWaveState = "thinking";
  startSiriWaveAnimation();
  if (statusText) statusText.textContent = `"${query}"`;
  if (responseText) {
    responseText.style.display = "none";
    responseText.textContent = "";
  }
  if (siriInput) siriInput.value = "";

  setTimeout(async () => {
    if (requestId !== siriRequestId) return;
    const localResponse = processSiriCommand(query);

    if (!localResponse.needsAI) {
      renderSiriResponse(localResponse, responseText, requestId);
      return;
    }

    if (statusText) statusText.textContent = "Thinking...";

    try {
      const aiResponse = await requestCloudflareSiri(query);
      renderSiriResponse(aiResponse, responseText, requestId);
    } catch (error) {
      renderSiriResponse({
        text: error?.message || "Siri could not reach the AI service."
      }, responseText, requestId);
    }
  }, 280);
}

function processSiriCommand(rawQuery) {
  const q = rawQuery.toLowerCase().trim();

  const includesAny = (terms) => terms.some(term => q.includes(term));
  const searchText = rawQuery.replace(/\b(search|find|show me|look for|open)\b/gi, "").trim();
  const isQuestion = /^(what|who|why|how|when|where|which|can|could|should|would|is|are|do|does|did)\b/i.test(rawQuery.trim()) || rawQuery.includes("?");

  if (includesAny(["what can you do", "help", "commands"])) {
    return {
      text: "I can open apps, search stories, search games, open settings, change appearance, refresh feeds, and open matching articles."
    };
  }

  if (isQuestion) {
    return {
      needsAI: true
    };
  }

  if (includesAny(["open news", "today", "overview"])) {
    return {
      text: "Opening Today's Overview.",
      action: () => switchApp("news")
    };
  }
  if (includesAny(["open games", "games page", "game page"])) {
    return {
      text: "Opening Games.",
      action: () => switchApp("games")
    };
  }
  if (includesAny(["open reviews", "reviews page"])) {
    return {
      text: "Opening Reviews.",
      action: () => switchApp("reviews")
    };
  }
  if (includesAny(["open apps", "apps page"])) {
    return {
      text: "Opening Apps.",
      action: () => {
        switchApp("news");
        currentCategory = "culture";
        renderFeed();
      }
    };
  }
  if (includesAny(["apple intelligence", "open ai", "ai news"])) {
    return {
      text: "Opening Apple Intelligence.",
      action: () => {
        switchApp("news");
        currentCategory = "ai";
        renderFeed();
      }
    };
  }

  if (includesAny(["open account", "user account", "hardware profile", "security keys"])) {
    return {
      text: "Opening User Account.",
      action: () => openAccountWindow()
    };
  }
  if (includesAny(["settings", "preferences", "wallpaper", "appearance", "accessibility"])) {
    const tab = q.includes("accessibility") ? "accessibility" : q.includes("appearance") || q.includes("general") ? "general" : "wallpaper";
    return {
      text: tab === "wallpaper" ? "Opening Wallpaper Settings." : `Opening ${tab.charAt(0).toUpperCase() + tab.slice(1)} Settings.`,
      action: () => openSettingsTab(tab)
    };
  }

  if (includesAny(["light mode", "dark mode", "toggle light", "toggle theme", "switch theme"])) {
    const nextMode = document.body.classList.contains("light-mode") ? "Dark Mode" : "Light Mode";
    return {
      text: `Switching to ${nextMode}.`,
      action: () => {
        document.body.classList.toggle("light-mode");
        const isLightMode = document.body.classList.contains("light-mode");
        localStorage.setItem("tahoe_darkmode", isLightMode ? "light" : "dark");
        updateModeButtonLabel();
        if (currentApp === "crossover") renderCrossoverView();
        if (currentApp === "games") renderGamesView();
        if (currentApp === "finder") renderFinderView();
      }
    };
  }

  if (includesAny(["refresh news", "reload news", "update news"])) {
    return {
      text: "Refreshing stories.",
      action: () => loadNewsFromRSS()
    };
  }
  if (includesAny(["refresh games", "reload games", "update games"])) {
    return {
      text: "Refreshing game data.",
      action: () => loadAllGamesData({ force: true })
    };
  }

  if (q.includes("rpg") && q.includes("game")) {
    return {
      text: "Showing RPG games.",
      action: () => triggerGenreSidebarFilter("RPG")
    };
  }
  if (q.includes("action") && q.includes("game")) {
    return {
      text: "Showing Action games.",
      action: () => triggerGenreSidebarFilter("Action")
    };
  }
  if (q.includes("adventure") && q.includes("game")) {
    return {
      text: "Showing Adventure games.",
      action: () => triggerGenreSidebarFilter("Adventure")
    };
  }
  if (q.includes("strategy") && q.includes("game")) {
    return {
      text: "Showing Strategy games.",
      action: () => triggerGenreSidebarFilter("Strategy")
    };
  }
  if (q.includes("simulation") && q.includes("game")) {
    return {
      text: "Showing Simulation games.",
      action: () => triggerGenreSidebarFilter("Simulation")
    };
  }
  if ((q.includes("sports") || q.includes("sport")) && q.includes("game")) {
    return {
      text: "Showing Sports games.",
      action: () => triggerGenreSidebarFilter("Sports")
    };
  }

  if (includesAny(["latest news", "top story", "latest story"])) {
    const latest = articles.find(shouldRenderArticle);
    return latest ? {
      text: `${latest.title} — ${latest.sourceName}.`,
      action: () => openArticle(latest.id)
    } : {
      text: "Stories are still loading."
    };
  }

  const articleQuery = searchText || rawQuery.trim();
  const matchingArticles = articles
    .filter(shouldRenderArticle)
    .filter(article => {
      const body = `${article.title} ${article.subtitle} ${article.sourceName}`.toLowerCase();
      return articleQuery && body.includes(articleQuery.toLowerCase());
    })
    .slice(0, 3);

  if (matchingArticles.length > 0) {
    return {
      text: `Found ${matchingArticles.length} matching ${matchingArticles.length === 1 ? "story" : "stories"}. Opening the closest match: ${matchingArticles[0].title}.`,
      action: () => {
        switchApp("news");
        openArticle(matchingArticles[0].id);
      }
    };
  }

  const matchingGames = gamesCache
    .filter(game => {
      const body = `${game.name} ${(game.genres || []).join(" ")} ${game.fullDescription || ""}`.toLowerCase();
      return articleQuery && body.includes(articleQuery.toLowerCase());
    })
    .slice(0, 6);

  if (matchingGames.length > 0) {
    return {
      text: `Found ${matchingGames.length} matching ${matchingGames.length === 1 ? "game" : "games"}. Showing ${matchingGames[0].name}.`,
      action: () => {
        switchApp("games");
        gameSearchQuery = articleQuery;
        gameSearchResults = matchingGames;
        renderGamesView();
        openSteamGameDetail(matchingGames[0].id);
      }
    };
  }

  if (includesAny(["hello", "hi ", "hey siri"])) {
    return {
      needsAI: true
    };
  }

  if (articleQuery) {
    return {
      needsAI: true
    };
  }

  return {
    needsAI: true
  };
}

function triggerGenreSidebarFilter(genreName) {
  switchApp("games");
  const genreSidebarItems = document.querySelectorAll("#games-genre-menu .sidebar-item");
  genreSidebarItems.forEach(item => {
    if (item.getAttribute("data-game-genre") === genreName) {
      item.click();
    }
  });
}

function triggerCompatSidebarFilter(compatName) {
  switchApp("games");
  const compatSidebarItems = document.querySelectorAll("#games-compat-menu .sidebar-item");
  compatSidebarItems.forEach(item => {
    if (item.getAttribute("data-game-compat") === compatName) {
      item.click();
    }
  });
}

function typewriterEffect(element, text, callback, requestId = siriRequestId) {
  if (siriResponseTimer) {
    clearTimeout(siriResponseTimer);
    siriResponseTimer = null;
  }
  element.textContent = "";
  let i = 0;
  const speed = 25; // 25ms per character typing speed
  
  function type() {
    if (requestId !== siriRequestId) return;
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      siriResponseTimer = setTimeout(type, speed);
    } else {
      siriResponseTimer = null;
      if (callback) callback();
    }
  }
  type();
}

window.openSiriHud = openSiriHud;
window.closeSiriHud = closeSiriHud;
Object.defineProperty(window, 'siriActive', {
  get: () => siriActive,
  set: (v) => { siriActive = v; }
});
