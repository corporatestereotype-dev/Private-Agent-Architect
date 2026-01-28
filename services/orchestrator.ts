
import { GoogleGenAI, Modality } from "@google/genai";
import { ProviderSettings, AgentStep } from "../types";
import { synthesizeHybridCode, MergedResult } from "./hybridMerger";

export class AIOrchestrator {
  private ai: GoogleGenAI | null = null;
  private settings: ProviderSettings;

  constructor(settings: ProviderSettings) {
    this.settings = settings;
    if (process.env.API_KEY) {
      this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
  }

  async generatePlan(prompt: string) {
    if (!this.ai) return ["src/App.tsx", "src/index.css", "package.json"];
    
    const response = await this.ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `You are the ARCHITECT. Create a file structure for: ${prompt}. Return ONLY a JSON array of file paths.`,
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 32768 },
        tools: [{ googleSearch: {} }]
      }
    });
    
    try {
      return JSON.parse(response.text || "[]");
    } catch {
      return ["src/App.tsx"];
    }
  }

  async generateFileHybrid(filename: string, prompt: string, context: string): Promise<MergedResult> {
    const cloudPrompt = `Write React/Vite code for ${filename}. Prompt: ${prompt}. Context: ${context}. Focus on architectural safety. Handle complex logic with deep reasoning.`;
    const localPrompt = `Write optimized code for ${filename}. Prompt: ${prompt}. Focus on local speed and hardware efficiency.`;

    const cloudTask = this.settings.useCloud && this.ai 
      ? this.ai.models.generateContent({
          model: "gemini-3-pro-preview",
          contents: cloudPrompt,
          config: {
            thinkingConfig: { thinkingBudget: 32768 }
          }
        }).then((r) => r.text || "")
      : Promise.resolve("// Cloud supervision disabled");

    // Hybrid Worker Selection: Try Local Bridge (HF), then Ollama, then HF Inference API
    const localTask = async () => {
      // 1. Try Local Python Bridge (Hugging Face local execution)
      try {
        const hfLocal = await fetch(`${this.settings.hfUrl}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: localPrompt })
        });
        if (hfLocal.ok) {
          const data = await hfLocal.json();
          return data.response;
        }
      } catch (e) { /* Fallback to Ollama */ }

      // 2. Try Ollama (Local quantized execution)
      try {
        const ollamaRes = await fetch(`${this.settings.ollamaUrl}/api/generate`, {
          method: 'POST',
          body: JSON.stringify({
            model: this.settings.ollamaModel,
            prompt: localPrompt,
            stream: false
          })
        });
        if (ollamaRes.ok) {
          const d = await ollamaRes.json();
          return d.response;
        }
      } catch (e) { /* Fallback to HF Inference API */ }

      // 3. Try Hugging Face Inference API (Remote cloud-local hybrid)
      if (this.settings.hfToken) {
        try {
          const hfRemote = await fetch(`https://api-inference.huggingface.co/models/${this.settings.hfModel}`, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${this.settings.hfToken}`,
              'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ inputs: localPrompt })
          });
          if (hfRemote.ok) {
            const data = await hfRemote.json();
            return data[0]?.generated_text || data.generated_text || "// HF Remote Empty Response";
          }
        } catch (e) { }
      }

      return "// All local/hybrid workers failed";
    };

    const [cloudRes, localRes] = await Promise.all([cloudTask, localTask()]);
    return synthesizeHybridCode(cloudRes, localRes);
  }

  async speak(text: string) {
    if (!this.ai) return;
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const decode = (base64: string) => {
          const binaryString = atob(base64);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          return bytes;
        };

        const data = decode(base64Audio);
        const dataInt16 = new Int16Array(data.buffer);
        const buffer = audioContext.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) {
          channelData[i] = dataInt16[i] / 32768.0;
        }

        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start();
      }
    } catch (e) {
      console.error("TTS failed", e);
    }
  }

  connectLive(callbacks: any) {
    if (!this.ai) return null;
    return this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks,
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: 'You are the Voice of the Private Agent Architect.',
      }
    });
  }
}
