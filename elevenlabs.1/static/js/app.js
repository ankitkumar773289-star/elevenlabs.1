// ElevenLabs Narration Studio - Client Application

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const modelSelect = document.getElementById('modelSelect');
    const modelDescription = document.getElementById('modelDescription');
    const modelBadge = document.getElementById('modelBadge');
    
    const voiceSelect = document.getElementById('voiceSelect');
    const voiceDescription = document.getElementById('voiceDescription');
    const voiceCount = document.getElementById('voiceCount');
    
    const textContent = document.getElementById('textContent');
    const charCount = document.getElementById('charCount');
    const clearTextBtn = document.getElementById('clearTextBtn');
    const presetBtns = document.querySelectorAll('.preset-btn');
    
    const playBtn = document.getElementById('playBtn');
    const playBtnText = document.getElementById('playBtnText');
    const playIcon = document.getElementById('playIcon');
    const stopBtn = document.getElementById('stopBtn');
    
    const toggleSettings = document.getElementById('toggleSettings');
    const voiceSettingsDrawer = document.getElementById('voiceSettingsDrawer');
    const settingsChevron = document.getElementById('settingsChevron');
    const stabilitySlider = document.getElementById('stabilitySlider');
    const stabilityVal = document.getElementById('stabilityVal');
    const similaritySlider = document.getElementById('similaritySlider');
    const similarityVal = document.getElementById('similarityVal');
    const styleSlider = document.getElementById('styleSlider');
    const styleVal = document.getElementById('styleVal');
    
    const statusMessage = document.getElementById('statusMessage');
    const statusIcon = document.getElementById('statusIcon');
    const statusText = document.getElementById('statusText');
    const closeStatus = document.getElementById('closeStatus');
    
    const playerCard = document.getElementById('playerCard');
    const playerLabel = document.getElementById('playerLabel');
    const metaBadge = document.getElementById('metaBadge');
    const nativeAudio = document.getElementById('nativeAudio');
    const progressBar = document.getElementById('progressBar');
    const currentTime = document.getElementById('currentTime');
    const durationTime = document.getElementById('durationTime');
    const speedSelect = document.getElementById('speedSelect');
    const downloadBtn = document.getElementById('downloadBtn');
    const waveformCanvas = document.getElementById('waveformCanvas');
    
    const historyList = document.getElementById('historyList');
    const emptyHistoryText = document.getElementById('emptyHistoryText');
    const historyCount = document.getElementById('historyCount');
    
    // API Key Modal Elements
    const apiKeyBtn = document.getElementById('apiKeyBtn');
    const apiKeyDot = document.getElementById('apiKeyDot');
    const apiKeyText = document.getElementById('apiKeyText');
    const apiKeyBanner = document.getElementById('apiKeyBanner');
    const openApiKeyModal = document.getElementById('openApiKeyModal');
    const apiKeyModal = document.getElementById('apiKeyModal');
    const closeApiKeyModal = document.getElementById('closeApiKeyModal');
    const cancelApiKeyBtn = document.getElementById('cancelApiKeyBtn');
    const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const toggleKeyVisibility = document.getElementById('toggleKeyVisibility');
    const keyVisibilityIcon = document.getElementById('keyVisibilityIcon');
    const modalStatus = document.getElementById('modalStatus');

    // State Variables
    let hasEnvKey = false;
    let localApiKey = localStorage.getItem('elevenlabs_api_key') || '';
    let modelsData = [];
    let voicesData = [];
    let isGenerating = false;
    let isPlaying = false;
    let currentAudioUrl = null;
    let sessionHistory = [];
    
    // Audio Visualizer Setup
    let audioCtx = null;
    let analyser = null;
    let audioSource = null;
    let animationFrameId = null;

    // Presets Content
    const presets = {
        story: "In the shadow of the ancient obsidian tower, the lantern light flickered against the damp stone walls. Master Elden paused, listening intently. A low, rhythmic hum resonated from deep within the catacombs—an ancient engine awakening after centuries of slumber.",
        documentary: "Deep beneath the Arctic ice sheet lies an ecosystem virtually untouched by human influence. Here, life does not merely endure; it flourishes under crushing pressure and perpetual darkness, driven by chemical warmth rising from hydrothermal vents.",
        tech: "Today, we are thrilled to introduce a groundbreaking leap in voice synthesis technology. With unprecedented emotional depth, ultra-low latency, and lifelike inflections, we're redefining how human beings interact with artificial intelligence."
    };

    // ==========================================
    // 1. Initial State & API Key Status
    // ==========================================

    async function checkApiKeyStatus() {
        try {
            const resp = await fetch('/api/status');
            const data = await resp.json();
            hasEnvKey = data.has_env_key;
            
            updateApiKeyUI(hasEnvKey, data.key_preview);
            
            // Fetch models and voices
            loadModels();
            loadVoices();
        } catch (err) {
            console.error('Error checking API status:', err);
            updateApiKeyUI(false);
        }
    }

    function getActiveApiKey() {
        return localApiKey || '';
    }

    function updateApiKeyUI(isConfigured, preview) {
        if (isConfigured || localApiKey) {
            apiKeyDot.className = 'w-2 h-2 rounded-full bg-emerald-400';
            const display = preview || (localApiKey ? `...${localApiKey.slice(-4)}` : 'Active');
            apiKeyText.textContent = `API Key: ${display}`;
            apiKeyBanner.classList.add('hidden');
        } else {
            apiKeyDot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-pulse';
            apiKeyText.textContent = 'Set API Key';
            apiKeyBanner.classList.remove('hidden');
        }
    }

    // ==========================================
    // 2. Load Models & Voices
    // ==========================================

    async function loadModels() {
        try {
            const headers = {};
            const key = getActiveApiKey();
            if (key) headers['x-elevenlabs-key'] = key;

            const resp = await fetch('/api/models', { headers });
            const data = await resp.json();
            modelsData = data.models || [];
            
            if (modelsData.length > 0) {
                const currentVal = modelSelect.value;
                modelSelect.innerHTML = '';
                modelsData.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m.model_id;
                    opt.textContent = m.name + (m.recommended ? ' ★ Recommended' : '');
                    if (m.model_id === currentVal || (m.recommended && !currentVal)) {
                        opt.selected = true;
                    }
                    modelSelect.appendChild(opt);
                });
                updateModelDetails();
            }
        } catch (err) {
            console.error('Error fetching models:', err);
        }
    }

    function updateModelDetails() {
        const selectedId = modelSelect.value;
        const model = modelsData.find(m => m.model_id === selectedId);
        if (model) {
            modelDescription.textContent = model.description || '';
            if (model.recommended || selectedId === 'eleven_multilingual_v2') {
                modelBadge.textContent = 'Recommended';
                modelBadge.className = 'text-[10px] uppercase font-mono px-1.5 py-0.5 bg-cyan-950/80 text-cyan-400 rounded border border-cyan-800';
            } else if (selectedId.includes('flash')) {
                modelBadge.textContent = 'Ultra Fast';
                modelBadge.className = 'text-[10px] uppercase font-mono px-1.5 py-0.5 bg-purple-950/80 text-purple-400 rounded border border-purple-800';
            } else if (selectedId.includes('turbo')) {
                modelBadge.textContent = 'Low Latency';
                modelBadge.className = 'text-[10px] uppercase font-mono px-1.5 py-0.5 bg-blue-950/80 text-blue-400 rounded border border-blue-800';
            } else {
                modelBadge.textContent = 'Standard';
                modelBadge.className = 'text-[10px] uppercase font-mono px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded border border-slate-700';
            }
        }
    }

    modelSelect.addEventListener('change', updateModelDetails);

    async function loadVoices() {
        try {
            const headers = {};
            const key = getActiveApiKey();
            if (key) headers['x-elevenlabs-key'] = key;

            const resp = await fetch('/api/voices', { headers });
            const data = await resp.json();
            voicesData = data.voices || [];
            
            if (voicesData.length > 0) {
                const currentVal = voiceSelect.value;
                voiceSelect.innerHTML = '';
                voicesData.forEach(v => {
                    const opt = document.createElement('option');
                    opt.value = v.voice_id;
                    opt.textContent = `${v.name} (${v.description || v.category})`;
                    if (v.voice_id === currentVal) {
                        opt.selected = true;
                    }
                    voiceSelect.appendChild(opt);
                });
                voiceCount.textContent = `${voicesData.length} voices`;
                updateVoiceDetails();
            }
        } catch (err) {
            console.error('Error fetching voices:', err);
        }
    }

    function updateVoiceDetails() {
        const selectedId = voiceSelect.value;
        const voice = voicesData.find(v => v.voice_id === selectedId);
        if (voice) {
            voiceDescription.textContent = voice.description ? `Voice style: ${voice.description}` : `${voice.category} voice`;
        }
    }

    voiceSelect.addEventListener('change', updateVoiceDetails);

    // ==========================================
    // 3. Text & Settings Controls
    // ==========================================

    function updateCharCount() {
        const text = textContent.value;
        const chars = text.length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        charCount.textContent = `${chars.toLocaleString()} characters (~${words.toLocaleString()} words)`;
    }

    textContent.addEventListener('input', updateCharCount);

    clearTextBtn.addEventListener('click', () => {
        textContent.value = '';
        updateCharCount();
        textContent.focus();
    });

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-preset');
            if (presets[key]) {
                textContent.value = presets[key];
                updateCharCount();
            }
        });
    });

    // Voice Tuning Sliders
    toggleSettings.addEventListener('click', () => {
        voiceSettingsDrawer.classList.toggle('hidden');
        settingsChevron.classList.toggle('rotate-180');
    });

    stabilitySlider.addEventListener('input', (e) => {
        stabilityVal.textContent = parseFloat(e.target.value).toFixed(2);
    });

    similaritySlider.addEventListener('input', (e) => {
        similarityVal.textContent = parseFloat(e.target.value).toFixed(2);
    });

    styleSlider.addEventListener('input', (e) => {
        styleVal.textContent = parseFloat(e.target.value).toFixed(2);
    });

    // ==========================================
    // 4. Narration & Audio Playback Engine
    // ==========================================

    playBtn.addEventListener('click', async () => {
        // If already playing audio and user clicks Play, toggle pause/resume or re-synthesize
        if (isPlaying) {
            nativeAudio.pause();
            return;
        }

        if (nativeAudio.src && nativeAudio.paused && !nativeAudio.ended && !isGenerating && nativeAudio.currentTime > 0) {
            // Resume playback
            nativeAudio.play();
            return;
        }

        await synthesizeAndPlay();
    });

    stopBtn.addEventListener('click', () => {
        if (nativeAudio) {
            nativeAudio.pause();
            nativeAudio.currentTime = 0;
            isPlaying = false;
            updatePlayBtnState('idle');
            stopBtn.disabled = true;
            playerLabel.textContent = 'Narration stopped';
        }
    });

    async function synthesizeAndPlay() {
        const text = textContent.value.trim();
        if (!text) {
            showStatus('Please enter or paste some text content to narrate.', 'warning');
            textContent.focus();
            return;
        }

        if (!hasEnvKey && !localApiKey) {
            showStatus('ElevenLabs API Key required. Click "Enter API Key" to configure.', 'error');
            openApiKeyModalFunc();
            return;
        }

        isGenerating = true;
        updatePlayBtnState('generating');
        hideStatus();

        const modelId = modelSelect.value;
        const voiceId = voiceSelect.value;
        const modelName = modelSelect.options[modelSelect.selectedIndex]?.text.split('(')[0].trim() || modelId;
        const voiceName = voiceSelect.options[voiceSelect.selectedIndex]?.text.split('(')[0].trim() || 'Speaker';

        try {
            const payload = {
                text: text,
                model_id: modelId,
                voice_id: voiceId,
                stability: parseFloat(stabilitySlider.value),
                similarity_boost: parseFloat(similaritySlider.value),
                style: parseFloat(styleSlider.value),
                api_key: getActiveApiKey()
            };

            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                const errMsg = errData.error || `Generation failed (HTTP ${response.status})`;
                showStatus(errMsg, 'error');
                updatePlayBtnState('idle');
                isGenerating = false;
                return;
            }

            const audioBlob = await response.blob();
            if (currentAudioUrl) {
                URL.revokeObjectURL(currentAudioUrl);
            }
            currentAudioUrl = URL.createObjectURL(audioBlob);

            // Setup audio player
            nativeAudio.src = currentAudioUrl;
            nativeAudio.playbackRate = parseFloat(speedSelect.value);
            downloadBtn.href = currentAudioUrl;
            downloadBtn.download = `narration_${modelId}_${Date.now()}.mp3`;

            // Setup UI for Player
            playerCard.classList.remove('hidden');
            metaBadge.textContent = `${modelName} • ${voiceName}`;
            playerLabel.textContent = 'Playing Narration';

            // Connect Visualizer (first user gesture)
            setupVisualizer();

            // Play audio
            await nativeAudio.play();
            isPlaying = true;
            stopBtn.disabled = false;
            updatePlayBtnState('playing');

            // Add to session history
            addToHistory({
                id: Date.now(),
                url: currentAudioUrl,
                blob: audioBlob,
                text: text.slice(0, 90) + (text.length > 90 ? '...' : ''),
                model: modelName,
                voice: voiceName,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            });

        } catch (err) {
            console.error('TTS error:', err);
            showStatus(`Error during speech synthesis: ${err.message}`, 'error');
            updatePlayBtnState('idle');
        } finally {
            isGenerating = false;
        }
    }

    function updatePlayBtnState(state) {
        if (state === 'generating') {
            playBtn.disabled = true;
            playBtnText.textContent = 'Generating Voice...';
            playIcon.className = 'fa-solid fa-spinner fa-spin text-sm';
            playBtn.classList.remove('playing-glow');
        } else if (state === 'playing') {
            playBtn.disabled = false;
            playBtnText.textContent = 'Pause Narration';
            playIcon.className = 'fa-solid fa-pause text-sm';
            playBtn.classList.add('playing-glow');
        } else if (state === 'paused') {
            playBtn.disabled = false;
            playBtnText.textContent = 'Resume Narration';
            playIcon.className = 'fa-solid fa-play text-sm ml-0.5';
            playBtn.classList.remove('playing-glow');
        } else {
            playBtn.disabled = false;
            playBtnText.textContent = 'Play Narration';
            playIcon.className = 'fa-solid fa-play text-sm ml-0.5';
            playBtn.classList.remove('playing-glow');
        }
    }

    // Audio Player Events
    nativeAudio.addEventListener('play', () => {
        isPlaying = true;
        stopBtn.disabled = false;
        playerLabel.textContent = 'Playing Narration';
        updatePlayBtnState('playing');
        drawVisualizer();
    });

    nativeAudio.addEventListener('pause', () => {
        isPlaying = false;
        playerLabel.textContent = 'Narration Paused';
        updatePlayBtnState('paused');
    });

    nativeAudio.addEventListener('ended', () => {
        isPlaying = false;
        stopBtn.disabled = true;
        playerLabel.textContent = 'Narration Finished';
        updatePlayBtnState('idle');
        progressBar.value = 100;
    });

    nativeAudio.addEventListener('timeupdate', () => {
        if (!isNaN(nativeAudio.duration) && nativeAudio.duration > 0) {
            const current = nativeAudio.currentTime;
            const duration = nativeAudio.duration;
            progressBar.value = (current / duration) * 100;
            currentTime.textContent = formatTime(current);
            durationTime.textContent = formatTime(duration);
        }
    });

    nativeAudio.addEventListener('loadedmetadata', () => {
        durationTime.textContent = formatTime(nativeAudio.duration);
    });

    progressBar.addEventListener('input', () => {
        if (!isNaN(nativeAudio.duration) && nativeAudio.duration > 0) {
            nativeAudio.currentTime = (progressBar.value / 100) * nativeAudio.duration;
        }
    });

    speedSelect.addEventListener('change', () => {
        nativeAudio.playbackRate = parseFloat(speedSelect.value);
    });

    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // ==========================================
    // 5. Canvas Waveform Visualizer
    // ==========================================

    function setupVisualizer() {
        if (!audioCtx) {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioCtx = new AudioContext();
                analyser = audioCtx.createAnalyser();
                analyser.fftSize = 64;
                audioSource = audioCtx.createMediaElementSource(nativeAudio);
                audioSource.connect(analyser);
                analyser.connect(audioCtx.destination);
            } catch (e) {
                console.warn('Web Audio API not supported or already connected', e);
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function drawVisualizer() {
        if (!analyser || !waveformCanvas) return;
        const ctx = waveformCanvas.getContext('2d');
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Adjust canvas pixel density
        waveformCanvas.width = waveformCanvas.offsetWidth * window.devicePixelRatio || 600;
        waveformCanvas.height = waveformCanvas.offsetHeight * window.devicePixelRatio || 120;

        function renderFrame() {
            if (!isPlaying) {
                // Clear or draw idle flat line
                ctx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
                cancelAnimationFrame(animationFrameId);
                return;
            }

            animationFrameId = requestAnimationFrame(renderFrame);
            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);

            const barWidth = (waveformCanvas.width / bufferLength) * 2;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * waveformCanvas.height * 0.85;
                
                // Color gradient (cyan to purple)
                const grad = ctx.createLinearGradient(0, waveformCanvas.height, 0, 0);
                grad.addColorStop(0, '#06b6d4');
                grad.addColorStop(0.5, '#6366f1');
                grad.addColorStop(1, '#a855f7');

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.roundRect(x, (waveformCanvas.height - barHeight) / 2, barWidth - 4, barHeight + 4, 3);
                ctx.fill();

                x += barWidth;
            }
        }

        renderFrame();
    }

    // ==========================================
    // 6. Session Narration History
    // ==========================================

    function addToHistory(item) {
        sessionHistory.unshift(item);
        emptyHistoryText.classList.add('hidden');
        historyCount.textContent = `${sessionHistory.length} clip${sessionHistory.length > 1 ? 's' : ''}`;

        const itemEl = document.createElement('div');
        itemEl.className = 'flex items-center justify-between p-3 rounded-lg bg-dark-750/70 border border-dark-700 hover:border-dark-600 transition text-xs gap-3';
        itemEl.innerHTML = `
            <div class="flex items-center gap-2.5 overflow-hidden flex-1">
                <button type="button" class="history-play-btn w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600 hover:text-white flex items-center justify-center shrink-0 transition" title="Play">
                    <i class="fa-solid fa-play text-xs ml-0.5"></i>
                </button>
                <div class="flex flex-col truncate">
                    <p class="text-slate-200 font-medium truncate">${item.text}</p>
                    <div class="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span class="text-cyan-400 font-medium">${item.model}</span>
                        <span>•</span>
                        <span>${item.voice}</span>
                        <span>•</span>
                        <span>${item.timestamp}</span>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
                <a href="${item.url}" download="narration_${item.id}.mp3" class="p-2 text-slate-400 hover:text-white rounded hover:bg-dark-700 transition" title="Download">
                    <i class="fa-solid fa-download"></i>
                </a>
            </div>
        `;

        const playHistoryBtn = itemEl.querySelector('.history-play-btn');
        playHistoryBtn.addEventListener('click', () => {
            nativeAudio.src = item.url;
            downloadBtn.href = item.url;
            downloadBtn.download = `narration_${item.id}.mp3`;
            playerCard.classList.remove('hidden');
            metaBadge.textContent = `${item.model} • ${item.voice}`;
            setupVisualizer();
            nativeAudio.play();
        });

        historyList.prepend(itemEl);
    }

    // ==========================================
    // 7. Status Notifications
    // ==========================================

    function showStatus(msg, type = 'info') {
        statusMessage.classList.remove('hidden', 'bg-red-500/10', 'border-red-500/30', 'text-red-200',
                                              'bg-amber-500/10', 'border-amber-500/30', 'text-amber-200',
                                              'bg-cyan-500/10', 'border-cyan-500/30', 'text-cyan-200');
        statusText.textContent = msg;

        if (type === 'error') {
            statusMessage.classList.add('bg-red-500/10', 'border-red-500/30', 'text-red-200');
            statusIcon.className = 'fa-solid fa-triangle-exclamation text-red-400';
        } else if (type === 'warning') {
            statusMessage.classList.add('bg-amber-500/10', 'border-amber-500/30', 'text-amber-200');
            statusIcon.className = 'fa-solid fa-circle-exclamation text-amber-400';
        } else {
            statusMessage.classList.add('bg-cyan-500/10', 'border-cyan-500/30', 'text-cyan-200');
            statusIcon.className = 'fa-solid fa-circle-info text-cyan-400';
        }
    }

    function hideStatus() {
        statusMessage.classList.add('hidden');
    }

    closeStatus.addEventListener('click', hideStatus);

    // ==========================================
    // 8. API Key Modal Management
    // ==========================================

    function openApiKeyModalFunc() {
        apiKeyInput.value = localApiKey || '';
        modalStatus.classList.add('hidden');
        apiKeyModal.classList.remove('hidden');
        apiKeyInput.focus();
    }

    function closeApiKeyModalFunc() {
        apiKeyModal.classList.add('hidden');
    }

    apiKeyBtn.addEventListener('click', openApiKeyModalFunc);
    openApiKeyModal.addEventListener('click', openApiKeyModalFunc);
    closeApiKeyModal.addEventListener('click', closeApiKeyModalFunc);
    cancelApiKeyBtn.addEventListener('click', closeApiKeyModalFunc);

    toggleKeyVisibility.addEventListener('click', () => {
        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            keyVisibilityIcon.className = 'fa-solid fa-eye-slash';
        } else {
            apiKeyInput.type = 'password';
            keyVisibilityIcon.className = 'fa-solid fa-eye';
        }
    });

    saveApiKeyBtn.addEventListener('click', async () => {
        const key = apiKeyInput.value.trim();
        if (!key) {
            showModalStatus('Please enter an API key', 'error');
            return;
        }

        saveApiKeyBtn.disabled = true;
        saveApiKeyBtn.textContent = 'Verifying with ElevenLabs...';

        try {
            const resp = await fetch('/api/save-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ api_key: key })
            });

            const data = await resp.json();

            if (resp.ok) {
                localApiKey = key;
                localStorage.setItem('elevenlabs_api_key', key);
                updateApiKeyUI(true, `...${key.slice(-4)}`);
                showModalStatus('API key verified and saved!', 'success');
                setTimeout(() => {
                    closeApiKeyModalFunc();
                    loadModels();
                    loadVoices();
                }, 800);
            } else {
                showModalStatus(data.error || 'Failed to verify API key', 'error');
            }
        } catch (err) {
            // If backend verification endpoint failed, still save in localStorage
            localApiKey = key;
            localStorage.setItem('elevenlabs_api_key', key);
            updateApiKeyUI(true, `...${key.slice(-4)}`);
            showModalStatus('Key saved locally in browser!', 'success');
            setTimeout(() => {
                closeApiKeyModalFunc();
                loadModels();
                loadVoices();
            }, 800);
        } finally {
            saveApiKeyBtn.disabled = false;
            saveApiKeyBtn.textContent = 'Save & Verify Key';
        }
    });

    function showModalStatus(msg, type) {
        modalStatus.classList.remove('hidden', 'bg-red-500/20', 'text-red-300', 'bg-emerald-500/20', 'text-emerald-300');
        modalStatus.textContent = msg;
        if (type === 'success') {
            modalStatus.classList.add('bg-emerald-500/20', 'text-emerald-300');
        } else {
            modalStatus.classList.add('bg-red-500/20', 'text-red-300');
        }
    }

    // Close modal on click outside
    apiKeyModal.addEventListener('click', (e) => {
        if (e.target === apiKeyModal) {
            closeApiKeyModalFunc();
        }
    });

    // Initialize
    updateCharCount();
    checkApiKeyStatus();
});
