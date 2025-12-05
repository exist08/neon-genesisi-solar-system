import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { AppState, ControlMode } from '../types';
import * as THREE from 'three';

interface HandControllerProps {
    appState: AppState;
    onGesture: (gesture: HandGesture) => void;
}

export type HandGesture = {
    type: 'NONE' | 'ROTATE' | 'ZOOM' | 'FOCUS' | 'EXIT_FOCUS';
    value?: any; // Delta for rotate/zoom, position for focus
};

const HandController: React.FC<HandControllerProps> = ({ appState, onGesture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const handLandmarkerRef = useRef<HandLandmarker | null>(null);
    const requestRef = useRef<number>(0);
    const [debugInfo, setDebugInfo] = useState<string>('Initializing Hand Tracking...');

    // State for gesture smoothing and logic
    const lastHandPos = useRef<{ x: number, y: number } | null>(null);
    const lastPinchDist = useRef<number | null>(null);
    const gestureHoldStart = useRef<number>(0);

    useEffect(() => {
        const init = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
                );
                handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numHands: 1
                });
                setIsLoaded(true);
                setDebugInfo('Hand Tracking Ready. Enable Hand Mode to start.');
            } catch (error) {
                console.error("Error initializing hand landmarker:", error);
                setDebugInfo('Error initializing hand tracking.');
            }
        };
        init();
    }, []);

    useEffect(() => {
        if (appState.controlMode === ControlMode.HAND && isLoaded) {
            startWebcam();
        } else {
            stopWebcam();
        }
        return () => stopWebcam();
    }, [appState.controlMode]);

    const startWebcam = async () => {
        if (!videoRef.current) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoRef.current.srcObject = stream;
            videoRef.current.addEventListener('loadeddata', predictWebcam);
            setDebugInfo('Camera Active. Show hand.');
        } catch (err) {
            console.error("Error accessing webcam:", err);
            setDebugInfo('Camera access denied.');
        }
    };

    const stopWebcam = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }
    };

    const predictWebcam = () => {
        if (!handLandmarkerRef.current || !videoRef.current) return;

        const nowInMs = Date.now();
        const results = handLandmarkerRef.current.detectForVideo(videoRef.current, nowInMs);

        if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];
            processGestures(landmarks);
        } else {
            onGesture({ type: 'NONE' });
            setDebugInfo('No hand detected');
            lastHandPos.current = null;
            lastPinchDist.current = null;
        }

        requestRef.current = requestAnimationFrame(predictWebcam);
    };

    const processGestures = (landmarks: any[]) => {
        // Landmarks: 0=Wrist, 4=ThumbTip, 8=IndexTip, 12=MiddleTip, 16=RingTip, 20=PinkyTip
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];
        const wrist = landmarks[0];

        // Calculate distances
        const pinchDist = Math.sqrt(
            Math.pow(thumbTip.x - indexTip.x, 2) + Math.pow(thumbTip.y - indexTip.y, 2)
        );

        // Check for Open Palm (High Five) - All fingers extended
        const isPalmOpen =
            landmarks[8].y < landmarks[6].y &&
            landmarks[12].y < landmarks[10].y &&
            landmarks[16].y < landmarks[14].y &&
            landmarks[20].y < landmarks[18].y;

        // Check for Fist (Grab) - Fingers curled
        const isFist =
            landmarks[8].y > landmarks[6].y &&
            landmarks[12].y > landmarks[10].y &&
            landmarks[16].y > landmarks[14].y &&
            landmarks[20].y > landmarks[18].y;

        // 1. EXIT FOCUS: Open Palm held
        if (isPalmOpen && !isFist) {
            if (Date.now() - gestureHoldStart.current > 1000) {
                onGesture({ type: 'EXIT_FOCUS' });
                setDebugInfo('Gesture: EXIT FOCUS');
                gestureHoldStart.current = Date.now(); // Reset to prevent spam
                return;
            }
        } else {
            gestureHoldStart.current = Date.now();
        }

        // 2. ZOOM: Pinch
        if (pinchDist < 0.05) {
            if (lastPinchDist.current !== null) {
                // Use Y movement for zoom when pinched? Or just pinch hold?
                // Let's use hand Z movement (simulated by wrist size or just assume pinch + move Y)
                // Actually, let's use Pinch + Move Y for Zoom
                const y = (thumbTip.y + indexTip.y) / 2;
                if (lastHandPos.current) {
                    const deltaY = lastHandPos.current.y - y;
                    if (Math.abs(deltaY) > 0.01) {
                        onGesture({ type: 'ZOOM', value: deltaY * 5 });
                        setDebugInfo(`Gesture: ZOOM ${deltaY > 0 ? 'IN' : 'OUT'}`);
                    }
                }
                lastHandPos.current = { x: (thumbTip.x + indexTip.x) / 2, y };
            } else {
                lastPinchDist.current = pinchDist;
                lastHandPos.current = { x: (thumbTip.x + indexTip.x) / 2, y: (thumbTip.y + indexTip.y) / 2 };
            }
            return;
        } else {
            lastPinchDist.current = null;
        }

        // 3. ROTATE: Fist + Move
        if (isFist) {
            const x = wrist.x;
            const y = wrist.y;
            if (lastHandPos.current) {
                const deltaX = x - lastHandPos.current.x;
                const deltaY = y - lastHandPos.current.y;

                if (Math.abs(deltaX) > 0.005 || Math.abs(deltaY) > 0.005) {
                    onGesture({ type: 'ROTATE', value: { x: deltaX, y: deltaY } });
                    setDebugInfo('Gesture: ROTATE');
                }
            }
            lastHandPos.current = { x, y };
            return;
        }

        // 4. FOCUS / POINTER: Index finger extended, others curled (Pointing)
        // Simplified: Just check if not fist and not pinch and not open palm
        // Just map hand position to cursor
        const x = indexTip.x;
        const y = indexTip.y;

        // Invert X because webcam is mirrored usually
        onGesture({ type: 'FOCUS', value: { x: 1 - x, y: y } });
        setDebugInfo('Gesture: POINTER');
        lastHandPos.current = { x: wrist.x, y: wrist.y };
    };

    return (
        <div className={`absolute bottom-4 left-4 z-50 p-2 bg-black/50 rounded text-xs text-cyan-400 font-mono pointer-events-none ${appState.controlMode === ControlMode.HAND ? 'opacity-100' : 'opacity-0'}`}>
            <video ref={videoRef} className="w-32 h-24 -scale-x-100 opacity-50 mb-2 border border-cyan-800" autoPlay playsInline muted />
            <div>{debugInfo}</div>
            <div className="mt-1 text-[10px] text-gray-400">
                Fist: Rotate | Pinch+Move: Zoom | Point: Cursor | Palm: Exit
            </div>
        </div>
    );
};

export default HandController;
