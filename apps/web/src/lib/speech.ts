export function isSpeechSynthesisAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function isSpeechRecognitionAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
}

export function speakText(text: string, onEnd?: () => void): void {
  if (!isSpeechSynthesisAvailable()) {
    if (onEnd) onEnd();
    return;
  }

  stopSpeaking();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95; // slightly slower, calm cadence
  utterance.pitch = 1.0;

  if (onEnd) {
    utterance.onend = () => onEnd();
    utterance.onerror = () => onEnd();
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisAvailable()) {
    window.speechSynthesis.cancel();
  }
}

export function createSpeechRecognizer(
  onResult: (text: string) => void,
  onEnd: () => void
): { start: () => void; stop: () => void; onend?: (() => void) | null } | null {
  if (!isSpeechRecognitionAvailable()) return null;

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onresult = (event: any) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      transcript += event.results[i][0].transcript;
    }
    if (transcript.trim()) {
      onResult(transcript);
    }
  };

  const recognizerObj: { start: () => void; stop: () => void; onend?: (() => void) | null } = {
    start: () => {
      try {
        recognition.start();
      } catch (e) {
        console.warn("Speech recognition error:", e);
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch (e) {
        console.warn("Speech recognition stop error:", e);
      }
    },
    onend: null,
  };

  recognition.onend = () => {
    if (recognizerObj.onend) {
      recognizerObj.onend();
    } else {
      onEnd();
    }
  };

  recognition.onerror = () => {
    if (recognizerObj.onend) {
      recognizerObj.onend();
    } else {
      onEnd();
    }
  };

  return recognizerObj;
}
