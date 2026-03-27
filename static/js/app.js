const setupScreen = document.getElementById('setup-screen');
const chatScreen = document.getElementById('chat-screen');
const startBtn = document.getElementById('start-btn');
const actionBtn = document.getElementById('action-btn');
const chatHistory = document.getElementById('chat-history');
const langIndicator = document.getElementById('lang-indicator');

// Overlay elements
const recordOverlay = document.getElementById('record-overlay');
const closeRecord = document.getElementById('close-record');
const liveTranscript = document.getElementById('live-transcript');
const recordStatus = document.getElementById('record-status');
const recordActions = document.getElementById('record-actions');
const retryBtn = document.getElementById('retry-btn');
const confirmBtn = document.getElementById('confirm-btn');

let user1Lang = 'tr';
let user2Lang = 'en';
let currentTurn = 1; // 1 (You) or 2 (Other Person)
let currentAudio = null;
let finalTranscript = "";

const TURN_LABELS = {
    'tr': 'TAP TO SPEAK',
    'en': 'TAP TO SPEAK',
    'de': 'ZUM SPRECHEN TIPPEN',
    'fr': 'APPUYEZ POUR PARLER',
    'ru': 'НАЖМИТЕ, ЧТОБЫ ГОВОRIТЬ'
};

// Web Speech Recognition setup
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.interimResults = true; // See words in real-time
recognition.continuous = false;

startBtn.addEventListener('click', () => {
    user1Lang = document.getElementById('user1-lang').value;
    user2Lang = document.getElementById('user2-lang').value;
    currentTurn = 1; // Always start with User 1 (You)
    setupScreen.classList.add('hidden');
    chatScreen.classList.remove('hidden');
    updateUI();
});

function updateUI() {
    const lang = currentTurn === 1 ? user1Lang : user2Lang;
    const isUser1 = currentTurn === 1;
    
    // Button color and text update
    actionBtn.style.backgroundColor = isUser1 ? '#2563eb' : '#10b981'; // Blue vs Green
    document.getElementById('btn-text').innerText = TURN_LABELS[lang] || 'SPEAK';
    
    // Language indicator at the top
    const langNames = {'tr': 'Turkish', 'en': 'English', 'de': 'German', 'fr': 'French', 'ru': 'Russian'};
    langIndicator.innerText = `${isUser1 ? 'Your Turn' : 'Their Turn'} (${langNames[lang]})`;
}

actionBtn.addEventListener('click', () => {
    if (currentAudio) currentAudio.pause();
    openRecorder();
});

function openRecorder() {
    const lang = currentTurn === 1 ? user1Lang : user2Lang;
    recordOverlay.classList.remove('translate-y-full');
    recordOverlay.style.backgroundColor = currentTurn === 1 ? '#2563eb' : '#10b981';
    
    // Reset recorder UI for new recording
    liveTranscript.innerText = "Listening...";
    liveTranscript.classList.add('opacity-60');
    recordStatus.innerText = "Speak Now";
    recordActions.classList.add('hidden');
    finalTranscript = "";

    recognition.lang = getFullLangCode(lang);
    recognition.start();
}

recognition.onresult = (event) => {
    let interimTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
            finalTranscript = event.results[i][0].transcript;
        } else {
            interimTranscript += event.results[i][0].transcript;
        }
    }
    liveTranscript.innerText = finalTranscript || interimTranscript;
    liveTranscript.classList.remove('opacity-60');
};

recognition.onend = () => {
    if (finalTranscript) {
        recordStatus.innerText = "Is this correct?";
        recordActions.classList.remove('hidden');
    } else {
        // Close if no speech detected
        liveTranscript.innerText = "No voice detected.";
        setTimeout(closeRecorder, 1500);
    }
};

confirmBtn.addEventListener('click', processTranslation);
retryBtn.addEventListener('click', openRecorder);
closeRecord.addEventListener('click', closeRecorder);

function closeRecorder() {
    recordOverlay.classList.add('translate-y-full');
    recognition.stop();
}

async function processTranslation() {
    const textToSend = finalTranscript;
    closeRecorder();
    
    const sourceLang = currentTurn === 1 ? user1Lang : user2Lang;
    const targetLang = currentTurn === 1 ? user2Lang : user1Lang;
    const targetUser = currentTurn === 1 ? 2 : 1;

    // Create a temporary "Translating..." bubble
    const loadingBubbleId = "loading-" + Date.now();
    addTranslationToHistory(targetUser, "Translating...", null, loadingBubbleId);
    
    try {
        const translateData = new FormData();
        translateData.append('text', textToSend);
        translateData.append('source_lang', sourceLang);
        translateData.append('target_lang', targetLang);
        
        const translateRes = await fetch('/translate', { method: 'POST', body: translateData });
        const { translated_text, explanation } = await translateRes.json();
        
        // Replace the "Translating..." text with actual result
        updateBubbleContent(loadingBubbleId, translated_text, explanation);
        
        // Switch turns immediately after receiving translation
        currentTurn = targetUser;
        updateUI();

        // Trigger Text-to-Speech (TTS)
        const ttsData = new FormData();
        ttsData.append('text', translated_text);
        ttsData.append('lang', targetLang);
        
        const ttsRes = await fetch('/tts', { method: 'POST', body: ttsData });
        const { audio_url } = await ttsRes.json();
        
        currentAudio = new Audio(audio_url);
        currentAudio.play();
        
    } catch (err) {
        console.error(err);
        updateBubbleContent(loadingBubbleId, "Error occurred during translation.", null);
    }
}

function addTranslationToHistory(userNum, text, explanation = null, id = null) {
    const msgDiv = document.createElement('div');
    const isUser1Translation = userNum === 1; // Translation intended for User 1
    
    msgDiv.className = `w-full flex ${isUser1Translation ? 'justify-start' : 'justify-end'} animate-slide-up`;
    if (id) msgDiv.id = id;
    
    let html = `
        <div class="bubble-content max-grow p-5 rounded-3xl shadow-lg border ${isUser1Translation ? 'bg-white border-slate-100 text-slate-800 rounded-bl-none' : 'bg-green-600 border-green-700 text-white rounded-br-none'}">
            <p class="bubble-text text-xl font-medium leading-snug">${text}</p>
    `;
    
    if (explanation) {
        html += `<p class="bubble-explanation text-sm mt-3 pt-3 border-t ${isUser1Translation ? 'border-slate-100 text-slate-400' : 'border-green-500 text-green-100'} italic font-medium">(${explanation})</p>`;
    }
    
    html += `</div>`;
    msgDiv.innerHTML = html;
    
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function updateBubbleContent(id, text, explanation) {
    const bubble = document.getElementById(id);
    if (!bubble) return;
    
    const textElement = bubble.querySelector('.bubble-text');
    textElement.innerText = text;
    
    if (explanation) {
        const container = bubble.querySelector('.bubble-content');
        const isUser1 = container.classList.contains('bg-white');
        const explHtml = `<p class="bubble-explanation text-sm mt-3 pt-3 border-t ${isUser1 ? 'border-slate-100 text-slate-400' : 'border-green-500 text-green-100'} italic font-medium">(${explanation})</p>`;
        container.insertAdjacentHTML('beforeend', explHtml);
    }
}

function getFullLangCode(lang) {
    const codes = {'tr': 'tr-TR', 'en': 'en-US', 'de': 'de-DE', 'fr': 'fr-FR', 'ru': 'ru-RU'};
    return codes[lang] || 'en-US';
}
