# TravelTalk: Smart Tourist Translator 🌍🎙️

TravelTalk is a modern voice-to-voice translation application designed to facilitate natural and fluid communication between two people speaking different languages. It leverages the power of gemini-3-flash-preview and Microsoft Edge TTS for a seamless experience.

Specifically built for tourists and locals to understand each other, the app operates on a "turn-taking" logic.

## ✨ Key Features

- **Confirmed Voice Recording:** Your spoken words appear on the screen in real-time. The translation process only begins after you hit "SEND," preventing misunderstandings from misrecognized speech.
- **Idiom and Proverb Detection:** If an idiom or a cultural phrase is used during translation, Gemini automatically detects it and provides an explanation (in parentheses) below the translation.
- **High-Quality Voice Output:** Uses Microsoft's natural AI voices (Edge-TTS) to read the translation aloud to the other person.
- **Clean Interface:** Your own messages in your native language do not clutter the screen; only the translations and explanations intended for the other person are displayed.
- **Smart Interruption:** If the other person wants to respond immediately instead of listening to the full translation, pressing the button instantly stops the audio and starts a new recording.

## 🚀 Setup and Running

### 1. Clone the Project

```bash
git clone https://github.com/your_username/traveltalk.git
cd traveltalk
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure the API Key (CRITICAL)

- Open the `.env` file in the project root directory.
- Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
- Paste your key into the `GOOGLE_API_KEY` field.
  **Note:** Never upload the `.env` file to GitHub (it is already protected by `.gitignore`).

### 4. Start the Application

```bash
python main.py
```

The application will run at `http://localhost:8000` by default.

## 🐳 Running with Docker

To run the application via Docker, you must have a **Docker Engine** (Docker Desktop or Docker on WSL2) installed on your computer.

1. Ensure your API key is added to the `.env` file.
2. Run the following command in the terminal:

```bash
docker compose up --build
```

3. Once the application is ready, you can access it at `http://localhost:8000`.

## 📱 Mobile Usage

If your computer and phone are connected to the same Wi-Fi network:

1. Find your local IP address by typing `ipconfig` (Windows) or `ifconfig` (Mac/Linux) in the terminal (e.g., `192.168.1.45`).
2. Enter `http://192.168.1.45:8000` into your phone's browser.
3. **Note:** You must grant microphone permission in the browser for voice recording and playback features.

## 🛠️ Technologies Used

- **Backend:** FastAPI (Python)
- **Frontend:** HTML5, CSS (Tailwind CSS), Vanilla JS
- **AI / Translation:** Google Gemini 1.5 Flash / 2.0 Flash
- **TTS (Speech):** Microsoft Edge TTS
- **STT (Recognition):** Browser Web Speech API

## 📝 License

This project is licensed under the [MIT License](LICENSE).
