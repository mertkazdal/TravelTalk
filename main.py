import os
import uuid
from typing import Optional
from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import google.generativeai as genai
import edge_tts
from dotenv import load_dotenv

load_dotenv()

# Gemini Setup & Check
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key or "BURAYA" in api_key:
    print("!!! ERROR: GOOGLE_API_KEY is missing or incorrect in .env file !!!")
    print("Please open .env file and paste your API key.")
    # Create a dummy model to prevent crash (or we could raise an error)

genai.configure(api_key=api_key)
# Using gemini-3-flash-preview based on availability
MODEL_NAME = "gemini-3-flash-preview"  # Update to the latest available model if needed
model = genai.GenerativeModel(MODEL_NAME)

app = FastAPI()

# Create directories if they don't exist
os.makedirs("temp_audio", exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/temp_audio", StaticFiles(directory="temp_audio"), name="temp_audio")
templates = Jinja2Templates(directory="templates")

# Common Voice Mappings (Edge-TTS)
VOICE_MAPPING = {
    "tr": "tr-TR-EmelNeural",
    "en": "en-US-EmmaNeural",
    "de": "de-DE-KatjaNeural",
    "fr": "fr-FR-DeniseNeural",
    "es": "es-ES-ElviraNeural",
    "it": "it-IT-ElsaNeural",
    "ru": "ru-RU-SvetlanaNeural",
    "ar": "ar-SA-ZariyahNeural",
    "ja": "ja-JP-NanamiNeural",
    "ko": "ko-KR-SunHiNeural",
    "zh": "zh-CN-XiaoxiaoNeural"
}

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

import json

@app.post("/translate")
async def translate(text: str = Form(...), source_lang: str = Form(...), target_lang: str = Form(...)):
    try:
        print(f"Translating: '{text}' from {source_lang} to {target_lang}")
        
        # Requesting JSON format response
        prompt = (
            f"You are a professional translator for a tourist app. "
            f"Translate the following text from {source_lang} to {target_lang}.\n"
            f"TEXT: '{text}'\n\n"
            f"RULES:\n"
            f"1. Return the result in JSON format ONLY.\n"
            f"2. Keys: 'translation' (string), 'explanation' (string or null).\n"
            f"3. If the text contains an idiom, proverb, or phrase with a non-literal meaning, "
            f"provide a short, simple explanation in 'explanation' (in {target_lang}). Otherwise, set it to null.\n"
            f"4. The translation should be natural and conversational.\n"
            f"5. Do NOT include any text outside the JSON block."
        )
        
        response = model.generate_content(prompt)
        
        if not response or not response.candidates:
            return {"translated_text": "Error: Translation failed.", "explanation": None}
            
        # JSON cleaning and extraction
        res_text = response.text.strip()
        if "```json" in res_text:
            res_text = res_text.split("```json")[1].split("```")[0].strip()
        elif "```" in res_text:
            res_text = res_text.split("```")[1].split("```")[0].strip()
            
        data = json.loads(res_text)
        translated_text = data.get("translation", "").replace('"', '').replace("'", "")
        explanation = data.get("explanation")
        
        print(f"Result: {translated_text} | Expl: {explanation}")
        return {"translated_text": translated_text, "explanation": explanation}
    except Exception as e:
        print(f"TRANSLATION ERROR: {str(e)}")
        # Fallback for simple text if JSON fails
        return {"translated_text": f"Error: {str(e)}", "explanation": None}

@app.post("/tts")
async def tts(text: str = Form(...), lang: str = Form(...)):
    try:
        print(f"Generating TTS for: '{text}' in {lang}")
        voice = VOICE_MAPPING.get(lang, "en-US-EmmaNeural")
        filename = f"{uuid.uuid4()}.mp3"
        filepath = os.path.join("temp_audio", filename)
        
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(filepath)
        
        return {"audio_url": f"/temp_audio/{filename}"}
    except Exception as e:
        print(f"TTS ERROR: {str(e)}")
        return {"error": str(e)}

# Cleanup endpoint (optional, could be run periodically)
@app.delete("/clear_audio")
async def clear_audio():
    for f in os.listdir("temp_audio"):
        os.remove(os.path.join("temp_audio", f))
    return {"status": "cleared"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
