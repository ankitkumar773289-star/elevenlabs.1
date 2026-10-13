import os
import requests
from flask import Flask, render_template, request, jsonify, Response
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

DEFAULT_MODELS = [
    {
        "model_id": "eleven_multilingual_v2",
        "name": "Eleven Multilingual v2",
        "description": "Flagship model — most lifelike, rich emotion, supports 29 languages.",
        "recommended": True
    },
    {
        "model_id": "eleven_turbo_v2_5",
        "name": "Eleven Turbo v2.5",
        "description": "High quality with low latency across 32 languages.",
        "recommended": False
    },
    {
        "model_id": "eleven_flash_v2_5",
        "name": "Eleven Flash v2.5",
        "description": "Ultra-low latency (~75ms), cost-efficient, 32 languages.",
        "recommended": False
    },
    {
        "model_id": "eleven_flash_v2",
        "name": "Eleven Flash v2",
        "description": "Fast and economical real-time synthesis.",
        "recommended": False
    },
    {
        "model_id": "eleven_monolingual_v1",
        "name": "Eleven English v1",
        "description": "Original English narration model.",
        "recommended": False
    },
    {
        "model_id": "eleven_multilingual_v1",
        "name": "Eleven Multilingual v1",
        "description": "First-generation multilingual model.",
        "recommended": False
    }
]

DEFAULT_VOICES = [
    {"voice_id": "21m00Tcm4TlvDq8ikWAM", "name": "Rachel", "category": "premade", "description": "Calm, conversational, American"},
    {"voice_id": "pNInz6obpgDQGcFmaJgB", "name": "Adam", "category": "premade", "description": "Deep, warm, perfect for narration"},
    {"voice_id": "ErXwobaYiN019PkySvjV", "name": "Antoni", "category": "premade", "description": "Well-rounded, pleasant, storytelling"},
    {"voice_id": "EXAVITQu4vr4xnSDxMaL", "name": "Bella", "category": "premade", "description": "Soft, engaging, audiobook"},
    {"voice_id": "TxGEqnHWrfWFTfGW9XjX", "name": "Josh", "category": "premade", "description": "Deep, resonant, expressive narration"},
    {"voice_id": "VR6AewLTigWG4xSOukaG", "name": "Arnold", "category": "premade", "description": "Crisp, authoritative, documentary"},
    {"voice_id": "AZnzlk1XvdvUeBnXmlld", "name": "Domi", "category": "premade", "description": "Emphatic, confident, strong"},
    {"voice_id": "MF3mGyEYCl7XYWbV9V6O", "name": "Elli", "category": "premade", "description": "Young, cheerful, conversational"},
    {"voice_id": "yoZ06aMxZJJ28mfd3POQ", "name": "Sam", "category": "premade", "description": "Dynamic, narrative, American"},
    {"voice_id": "JBFqnCBsd6RMkjVDRZzb", "name": "George", "category": "premade", "description": "Warm, captivating, British storyteller"},
    {"voice_id": "XB0fDUnXU5powFXDhCwa", "name": "Charlotte", "category": "premade", "description": "Seductive, Swedish accent, distinct"},
    {"voice_id": "D38z5RcWu1voky8WS1ja", "name": "Fin", "category": "premade", "description": "Irish accent, character, sailor"}
]

def get_effective_api_key(client_key=None):
    """Returns the API key from client request or server environment."""
    if client_key and client_key.strip():
        return client_key.strip()
    return os.environ.get("ELEVENLABS_API_KEY", "").strip()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/status", methods=["GET"])
def status():
    api_key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    return jsonify({
        "status": "ok",
        "has_env_key": bool(api_key),
        "key_preview": f"...{api_key[-4:]}" if len(api_key) >= 4 else None
    })

@app.route("/api/save-key", methods=["POST"])
def save_key():
    data = request.get_json() or {}
    new_key = data.get("api_key", "").strip()
    if not new_key:
        return jsonify({"error": "No API key provided"}), 400

    # Test key against ElevenLabs models endpoint to verify validity
    test_headers = {"xi-api-key": new_key}
    try:
        test_resp = requests.get("https://api.elevenlabs.io/v1/user", headers=test_headers, timeout=10)
        if test_resp.status_code == 401:
            return jsonify({"error": "Invalid ElevenLabs API key. Please check your credentials."}), 401
    except Exception as e:
        # If connection fails, still allow saving or notify
        pass

    os.environ["ELEVENLABS_API_KEY"] = new_key
    
    # Save to .env
    try:
        with open(".env", "w", encoding="utf-8") as f:
            f.write(f"ELEVENLABS_API_KEY={new_key}\n")
    except Exception as e:
        return jsonify({"warning": f"Key set in memory, but could not write .env: {str(e)}", "success": True})

    return jsonify({"success": True, "message": "API key verified and saved successfully!"})

@app.route("/api/models", methods=["GET"])
def get_models():
    client_key = request.headers.get("x-elevenlabs-key")
    api_key = get_effective_api_key(client_key)
    
    if api_key:
        try:
            resp = requests.get(
                "https://api.elevenlabs.io/v1/models",
                headers={"xi-api-key": api_key},
                timeout=8
            )
            if resp.status_code == 200:
                remote_models = resp.json()
                tts_models = []
                for m in remote_models:
                    if m.get("can_do_text_to_speech", True):
                        tts_models.append({
                            "model_id": m.get("model_id"),
                            "name": m.get("name"),
                            "description": m.get("description", ""),
                            "languages": [l.get("name") for l in m.get("languages", [])] if m.get("languages") else [],
                            "recommended": m.get("model_id") == "eleven_multilingual_v2"
                        })
                if tts_models:
                    return jsonify({"models": tts_models, "source": "live"})
        except Exception:
            pass

    return jsonify({"models": DEFAULT_MODELS, "source": "default"})

@app.route("/api/voices", methods=["GET"])
def get_voices():
    client_key = request.headers.get("x-elevenlabs-key")
    api_key = get_effective_api_key(client_key)
    
    if api_key:
        try:
            resp = requests.get(
                "https://api.elevenlabs.io/v1/voices",
                headers={"xi-api-key": api_key},
                timeout=8
            )
            if resp.status_code == 200:
                data = resp.json()
                raw_voices = data.get("voices", [])
                formatted = []
                for v in raw_voices:
                    labels = v.get("labels", {})
                    desc_parts = []
                    if labels.get("accent"): desc_parts.append(labels["accent"])
                    if labels.get("gender"): desc_parts.append(labels["gender"])
                    if labels.get("description"): desc_parts.append(labels["description"])
                    desc = ", ".join(desc_parts) if desc_parts else v.get("category", "")
                    
                    formatted.append({
                        "voice_id": v.get("voice_id"),
                        "name": v.get("name"),
                        "category": v.get("category", "custom"),
                        "description": desc,
                        "preview_url": v.get("preview_url")
                    })
                if formatted:
                    return jsonify({"voices": formatted, "source": "live"})
        except Exception:
            pass

    return jsonify({"voices": DEFAULT_VOICES, "source": "default"})

@app.route("/api/tts", methods=["POST"])
def text_to_speech():
    data = request.get_json() or {}
    text = data.get("text", "").strip()
    model_id = data.get("model_id", "eleven_multilingual_v2")
    voice_id = data.get("voice_id", "21m00Tcm4TlvDq8ikWAM")  # Default: Rachel
    client_key = data.get("api_key", "").strip() or request.headers.get("x-elevenlabs-key")
    
    api_key = get_effective_api_key(client_key)
    
    if not api_key:
        return jsonify({
            "error": "No ElevenLabs API Key provided. Please enter your API key in the configuration bar or add it to .env."
        }), 400
        
    if not text:
        return jsonify({"error": "Text content cannot be empty."}), 400
        
    stability = float(data.get("stability", 0.5))
    similarity_boost = float(data.get("similarity_boost", 0.75))
    style = float(data.get("style", 0.0))
    use_speaker_boost = bool(data.get("use_speaker_boost", True))

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
    }
    payload = {
        "text": text,
        "model_id": model_id,
        "voice_settings": {
            "stability": stability,
            "similarity_boost": similarity_boost,
            "style": style,
            "use_speaker_boost": use_speaker_boost
        }
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=60)
        
        if response.status_code == 200:
            return Response(
                response.content,
                mimetype="audio/mpeg",
                headers={
                    "Content-Disposition": "inline; filename=narration.mp3",
                    "Cache-Control": "no-cache"
                }
            )
        else:
            try:
                err_detail = response.json()
                message = err_detail.get("detail", {}).get("message") or err_detail.get("detail") or response.text
            except Exception:
                message = response.text or f"HTTP {response.status_code}"
                
            return jsonify({
                "error": f"ElevenLabs API Error ({response.status_code}): {message}"
            }), response.status_code

    except requests.exceptions.Timeout:
        return jsonify({"error": "Request timed out while waiting for ElevenLabs narration."}), 504
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Network error connecting to ElevenLabs API: {str(e)}"}), 502

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Server starting on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=False, use_reloader=False)
