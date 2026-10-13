# 🎙️ ElevenLabs Narration Studio

A modern, responsive web application for AI text-to-speech narration powered by the **ElevenLabs API**.

Paste any text content, select your preferred ElevenLabs model and voice, and click **Play** to start real-time speech narration with an interactive waveform visualizer.

---

## ✨ Features

- **Text Content Input**: Spacious input area with live character and word counter, text clearing, and 1-click sample presets (Story, Documentary, Tech Launch).
- **Model Selection Dropdown**: Easily choose between top ElevenLabs narration models:
  - `Eleven Multilingual v2` (Flagship, 29 languages, rich emotion & lifelike inflections)
  - `Eleven Turbo v2.5` (High quality with low latency across 32 languages)
  - `Eleven Flash v2.5` (Ultra-low latency ~75ms, economical)
  - `Eleven Flash v2` (Fast, cost-effective real-time synthesis)
  - `Eleven English v1` (Classic English narration)
  - *Dynamic fetching*: Automatically synchronizes available models from your ElevenLabs account.
- **Voice Selection & Customization**:
  - Curated high-fidelity voices (Rachel, Adam, Antoni, Bella, Josh, Arnold, George, and more).
  - Fetches your custom cloned voices and voice library when your API key is provided.
  - Advanced voice tuning drawer for **Stability**, **Clarity/Similarity Boost**, and **Style Exaggeration**.
- **Play Button & Built-in Player**:
  - One-click synthesis and immediate playback.
  - Interactive Web Audio API frequency visualizer.
  - Scrubbable progress bar, time counters (current / duration), and playback speed controls (0.75x to 2x).
  - **Save MP3** download button for generated audio files.
- **Session Narration History**: Keeps track of generated clips in your session with one-click re-play and download.
- **Flexible API Key Configuration**: Configure your key in `.env` or paste it directly in the UI with instant verification.

---

## 🚀 Quick Start

### Option 1: One-Click Launch (Windows)
Double-click `run.bat` in the project directory. It will automatically activate the virtual environment and open the studio in your default browser.

### Option 2: Running via Terminal

1. **Activate the virtual environment**:
   ```powershell
   .\.venv\Scripts\Activate.ps1
   ```

2. **(Optional) Configure your ElevenLabs API Key in `.env`**:
   Open `.env` and set:
   ```env
   ELEVENLABS_API_KEY=your_actual_elevenlabs_api_key_here
   ```
   *(Note: You can also enter the API key directly in the web app UI)*

3. **Start the server**:
   ```bash
   python app.py
   ```

4. **Open in browser**:
   Visit [http://localhost:5000](http://localhost:5000)

---

## 🔑 Getting an ElevenLabs API Key

1. Sign up or log in at [elevenlabs.io](https://elevenlabs.io).
2. Go to your **Profile / Settings > API Keys** ([https://elevenlabs.io/app/settings/api-keys](https://elevenlabs.io/app/settings/api-keys)).
3. Create a new API Key and copy it.
4. Paste it into the studio interface or into the `.env` file.

---

## 📁 Project Structure

```
elevenlabs.1/
├── app.py                # Flask server, ElevenLabs API proxy & routing
├── templates/
│   └── index.html        # Modern responsive UI with Tailwind CSS & icons
├── static/
│   ├── css/
│   │   └── style.css     # Visualizer styling, scrollbars, glowing effects
│   └── js/
│       └── app.js        # Audio player, Web Audio visualizer, API calls, history
├── .env                  # Environment configuration file
├── .env.example          # Template environment file
├── requirements.txt      # Python dependencies (Flask, requests, python-dotenv)
├── run.bat               # Windows batch launch script
└── README.md             # Project documentation
```
