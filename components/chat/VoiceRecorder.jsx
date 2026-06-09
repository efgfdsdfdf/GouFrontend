import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Send } from 'lucide-react';
export const VoiceRecorder = ({ onSend, onCancel }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);
    useEffect(() => {
        // Start recording immediately when component mounts
        startRecording();
        return () => {
            if (timerRef.current)
                clearInterval(timerRef.current);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                stream.getTracks().forEach((track) => track.stop());
            };
            mediaRecorder.start();
            setIsRecording(true);
            timerRef.current = setInterval(() => {
                setDuration((prev) => prev + 1);
            }, 1000);
        }
        catch (err) {
            console.error('Error accessing microphone:', err);
            onCancel();
        }
    };
    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current)
                clearInterval(timerRef.current);
        }
    };
    const handleSend = () => {
        if (audioBlob) {
            onSend(audioBlob);
        }
        else if (isRecording) {
            // If still recording, stop and then send
            stopRecording();
            // Need a slight delay to allow onstop to fire and blob to be generated
            setTimeout(() => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                onSend(blob);
            }, 100);
        }
    };
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    return (_jsx("div", { className: "flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2 w-full animate-in fade-in slide-in-from-right-4 duration-300", children: isRecording ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "h-2 w-2 rounded-full bg-red-500 animate-pulse" }), _jsx("span", { className: "text-red-500 text-sm font-medium w-12", children: formatTime(duration) }), _jsx("div", { className: "flex-1" }), _jsx("button", { onClick: onCancel, className: "p-2 text-white/50 hover:text-white transition-colors", children: _jsx(Trash2, { size: 18 }) }), _jsx("button", { onClick: handleSend, className: "p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg", children: _jsx(Send, { size: 16, className: "ml-0.5" }) })] })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "text-white text-sm font-medium w-12", children: formatTime(duration) }), _jsx("div", { className: "flex-1" }), _jsx("button", { onClick: onCancel, className: "p-2 text-white/50 hover:text-white transition-colors", children: _jsx(Trash2, { size: 18 }) }), _jsx("button", { onClick: () => onSend(audioBlob), className: "p-2 bg-primary rounded-full text-black hover:brightness-110 transition-colors shadow-lg", children: _jsx(Send, { size: 16, className: "ml-0.5" }) })] })) }));
};
