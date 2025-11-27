import { useState, useEffect, useRef, useCallback } from 'react';

// Define types for Web Speech API
interface IWindow extends Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
}

interface UseVoiceCommandsProps {
    onCommand: (command: string) => void;
    isListening?: boolean;
}

export const useVoiceCommands = ({ onCommand, isListening = false }: UseVoiceCommandsProps) => {
    const [isSupported, setIsSupported] = useState(false);
    const [lastCommand, setLastCommand] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const windowObj = window as unknown as IWindow;
        const SpeechRecognition = windowObj.SpeechRecognition || windowObj.webkitSpeechRecognition;

        if (SpeechRecognition) {
            setIsSupported(true);
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = 'en-US'; // Default to English for commands like "Start", "Stop"

            recognition.onresult = (event: any) => {
                const last = event.results.length - 1;
                const transcript = event.results[last][0].transcript.trim().toLowerCase();

                console.log('Voice Command Heard:', transcript);
                setLastCommand(transcript);

                // Simple keyword matching
                if (transcript.includes('start') || transcript.includes('begin') || transcript.includes('quay')) {
                    onCommand('start');
                } else if (transcript.includes('stop') || transcript.includes('end') || transcript.includes('dừng')) {
                    onCommand('stop');
                } else if (transcript.includes('highlight') || transcript.includes('save') || transcript.includes('lưu')) {
                    onCommand('highlight');
                }
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                if (event.error === 'not-allowed') {
                    setError('Microphone permission denied');
                }
            };

            recognitionRef.current = recognition;
        } else {
            console.warn('Web Speech API not supported in this browser');
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [onCommand]);

    useEffect(() => {
        if (!recognitionRef.current) return;

        if (isListening) {
            try {
                recognitionRef.current.start();
            } catch (e) {
                // Already started
            }
        } else {
            recognitionRef.current.stop();
        }
    }, [isListening]);

    return {
        isSupported,
        lastCommand,
        error
    };
};
