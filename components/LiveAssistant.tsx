import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from "@google/genai";
import type { EventData, CostItem } from '../types';
import { MicrophoneIcon, WaveformIcon, XIcon } from './icons';

// --- AUDIO HELPER FUNCTIONS ---

function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// --- COMPONENT ---

const currencyFormatter = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
});

interface LiveAssistantProps {
  events: EventData[];
  sharedCosts: CostItem[];
}

type TranscriptionTurn = {
    id: number;
    user: string;
    model: string;
};

enum AssistantState {
    IDLE = 'IDLE',
    CONNECTING = 'CONNECTING',
    LISTENING = 'LISTENING',
    SPEAKING = 'SPEAKING',
    ERROR = 'ERROR',
}

export const LiveAssistant: React.FC<LiveAssistantProps> = ({ events, sharedCosts }) => {
    const [assistantState, setAssistantState] = useState<AssistantState>(AssistantState.IDLE);
    const [transcription, setTranscription] = useState<TranscriptionTurn[]>([]);
    
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const audioSources = useRef<Set<AudioBufferSourceNode>>(new Set()).current;
    const nextStartTime = useRef(0);

    const buildSystemPrompt = useCallback(() => {
        if (events.length === 0) {
            return `Eres un asesor experto en producción de eventos. El usuario aún no ha creado ningún evento. Anímale a crear su primer evento para poder empezar a planificar.`;
        }
    
        const sharedCostsTotal = sharedCosts.reduce((sum, item) => sum + item.amount, 0);
        const sharedCostPerEvent = sharedCostsTotal / (events.length || 1);
        let context = `Eres un asesor experto en producción de eventos. El usuario te hablará para consultarte sobre el estado financiero de sus eventos. Responde de forma amigable y conversacional. Aquí está el resumen financiero actual:\n\n`;
        events.forEach(event => {
            const ownCostsTotal = event.costItems.reduce((sum, item) => sum + item.amount, 0);
            const totalSpent = ownCostsTotal + sharedCostPerEvent;
            const remainingBudget = event.totalBudget - totalSpent;
            context += `Evento: ${event.name}, Presupuesto Disponible: ${currencyFormatter.format(remainingBudget)}\n`;
        });
        context += `Total de costos compartidos: ${currencyFormatter.format(sharedCostsTotal)}\n\n`;
        context += `Responde directamente a las preguntas del usuario basándote en esta información.`;
        return context;
    }, [events, sharedCosts]);

    const stopSession = useCallback(async () => {
        if (sessionPromiseRef.current) {
            try {
                const session = await sessionPromiseRef.current;
                session.close();
            } catch (e) {
                console.error("Error closing session:", e);
            }
        }
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        scriptProcessorRef.current?.disconnect();
        if (inputAudioContextRef.current?.state !== 'closed') {
            inputAudioContextRef.current?.close();
        }
        if (outputAudioContextRef.current?.state !== 'closed') {
            outputAudioContextRef.current?.close();
        }

        audioSources.forEach(source => source.stop());
        audioSources.clear();
        
        sessionPromiseRef.current = null;
        mediaStreamRef.current = null;
        scriptProcessorRef.current = null;
        setAssistantState(AssistantState.IDLE);
    }, [audioSources]);

    const startSession = useCallback(async () => {
        setAssistantState(AssistantState.CONNECTING);
        setTranscription([]);
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    systemInstruction: buildSystemPrompt(),
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                },
                callbacks: {
                    onopen: () => {
                        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                        inputAudioContextRef.current = new AudioContext({ sampleRate: 16000 });
                        outputAudioContextRef.current = new AudioContext({ sampleRate: 24000 });
                        nextStartTime.current = 0;

                        const source = inputAudioContextRef.current.createMediaStreamSource(stream);
                        scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                              int16[i] = inputData[i] * 32768;
                            }
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(int16.buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        
                        source.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                        setAssistantState(AssistantState.LISTENING);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                         if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                             setTranscription(prev => {
                                const lastTurn = prev[prev.length -1];
                                if (lastTurn && message.serverContent?.turnComplete !== true) {
                                   return [...prev.slice(0,-1), { ...lastTurn, user: lastTurn.user + text}];
                                }
                                return [...prev, {id: Date.now(), user: text, model: ''}];
                             });
                        }
                        if (message.serverContent?.outputTranscription) {
                            const text = message.serverContent.outputTranscription.text;
                            setTranscription(prev => {
                                const lastTurn = prev[prev.length - 1];
                                if (!lastTurn) return prev; // Guard against output arriving before input
                                return [...prev.slice(0, -1), { ...lastTurn, model: lastTurn.model + text }];
                            });
                        }
                        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioData) {
                            setAssistantState(AssistantState.SPEAKING);
                            const outputCtx = outputAudioContextRef.current;
                            if (!outputCtx) return;
                            
                            nextStartTime.current = Math.max(nextStartTime.current, outputCtx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
                            const source = outputCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputCtx.destination);
                            
                            source.addEventListener('ended', () => {
                                audioSources.delete(source);
                                if (audioSources.size === 0) {
                                    setAssistantState(AssistantState.LISTENING);
                                }
                            });
                            
                            source.start(nextStartTime.current);
                            nextStartTime.current += audioBuffer.duration;
                            audioSources.add(source);
                        }
                    },
                    onclose: () => {
                       stopSession();
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Session error:', e);
                        setAssistantState(AssistantState.ERROR);
                        stopSession();
                    },
                },
            });
            sessionPromiseRef.current = sessionPromise;

        } catch (error) {
            console.error('Failed to start session:', error);
            setAssistantState(AssistantState.ERROR);
            alert("No se pudo acceder al micrófono. Por favor, revisa los permisos en tu navegador.");
        }
    }, [buildSystemPrompt, stopSession, audioSources]);

    useEffect(() => {
        return () => {
            stopSession();
        };
    }, [stopSession]);
    
    const toggleSession = () => {
        if (assistantState === AssistantState.IDLE || assistantState === AssistantState.ERROR) {
            startSession();
        } else {
            stopSession();
        }
    };

    const getButtonClass = () => {
        switch (assistantState) {
            case AssistantState.CONNECTING: return 'bg-yellow-500 animate-pulse';
            case AssistantState.LISTENING: return 'bg-blue-500 ring-4 ring-blue-500/50';
            case AssistantState.SPEAKING: return 'bg-teal-500';
            case AssistantState.ERROR: return 'bg-red-500';
            default: return 'bg-indigo-600 hover:bg-indigo-700';
        }
    }

    return (
        <>
            <button
                onClick={toggleSession}
                disabled={events.length === 0}
                title={events.length === 0 ? "Crea un evento para habilitar el asistente" : "Asistente de Voz"}
                className={`fixed bottom-8 right-8 z-20 w-16 h-16 rounded-full text-white shadow-lg flex items-center justify-center transition-all duration-300 ${events.length === 0 ? 'bg-gray-500 cursor-not-allowed' : getButtonClass()}`}
                aria-label="Asistente de Voz"
            >
                {assistantState === AssistantState.SPEAKING ? <WaveformIcon /> : <MicrophoneIcon />}
            </button>

            {assistantState !== AssistantState.IDLE && (
                 <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-10 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl h-full max-h-[80vh] flex flex-col p-6 border border-gray-700">
                        <div className="flex justify-between items-center mb-4 shrink-0">
                             <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Asistente de Voz</h2>
                             <button onClick={stopSession} className="text-gray-400 hover:text-white"><XIcon/></button>
                        </div>
                        <div className="flex-grow overflow-y-auto space-y-4 pr-2 -mr-2">
                             {transcription.map((turn) => (
                                <div key={turn.id}>
                                    {turn.user && <p><b className="text-blue-400">Tú:</b> <span className="text-gray-300">{turn.user}</span></p>}
                                    {turn.model && <p><b className="text-teal-400">IA:</b> <span className="text-gray-300">{turn.model}</span></p>}
                                </div>
                             ))}
                             {assistantState === AssistantState.CONNECTING && <p className="text-gray-400 italic">Conectando...</p>}
                             {assistantState === AssistantState.ERROR && <p className="text-red-400 font-semibold">Error en la conexión. Por favor, intenta de nuevo.</p>}
                             {transcription.length === 0 && assistantState === AssistantState.LISTENING && <p className="text-gray-500 text-center pt-8">Hola, ¿en qué puedo ayudarte hoy?</p>}
                        </div>
                        <div className="flex-shrink-0 pt-4 text-center text-gray-400 font-medium">
                            {assistantState === AssistantState.LISTENING && "Escuchando..."}
                            {assistantState === AssistantState.SPEAKING && "Hablando..."}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
