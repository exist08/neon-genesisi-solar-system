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
                    numHands: 2
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
    }, [appState.controlMode, isLoaded]);

    const startWebcam = async () => {
        if (!videoRef.current) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoRef.current.srcObject = stream;
            videoRef.current.addEventListener('loadeddata', predictWebcam);
            setDebugInfo('Camera Active. Show hands.');
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
            processGestures(results.landmarks);
        } else {
            onGesture({ type: 'NONE' });
            setDebugInfo('No hand detected');
            lastHandPos.current = null;
            lastPinchDist.current = null;
        }

        requestRef.current = requestAnimationFrame(predictWebcam);
    };

    const processGestures = (landmarksList: any[]) => {
        // 1. TWO HANDS ZOOM
        if (landmarksList.length === 2) {
            const hand1 = landmarksList[0][0]; // Wrist of hand 1
            const hand2 = landmarksList[1][0]; // Wrist of hand 2

            const dist = Math.sqrt(Math.pow(hand1.x - hand2.x, 2) + Math.pow(hand1.y - hand2.y, 2));

            if (lastPinchDist.current !== null) {
                const delta = dist - lastPinchDist.current;
                if (Math.abs(delta) > 0.005) {
                    // Invert delta because moving hands apart usually means zoom in (or out depending on preference)
                    // Let's say Apart = Zoom In (Move closer to object), Together = Zoom Out
                    // Scene3D logic: Zoom value subtracted from distance. So Positive Value = Zoom In.
                    // Delta > 0 (Apart) -> Zoom In.
                    onGesture({ type: 'ZOOM', value: delta * 20 });
                    setDebugInfo(`Gesture: 2-HAND ZOOM ${delta > 0 ? 'IN' : 'OUT'}`);
                }
            }
            lastPinchDist.current = dist;
            lastHandPos.current = null; // Reset single hand tracking
            return;
        } else {
            lastPinchDist.current = null;
        }

        // Single Hand Processing
        const landmarks = landmarksList[0];
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];
        const wrist = landmarks[0];

        // Check Finger States (Extended if tip Y < lower joint Y, assuming hand upright)
        // Better: Distance from wrist.
        const isExtended = (tip: any, joint: any) => {
            const dTip = Math.sqrt(Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2));
            const dJoint = Math.sqrt(Math.pow(joint.x - wrist.x, 2) + Math.pow(joint.y - wrist.y, 2));
            return dTip > dJoint;
        };

        // Simple Y check (works for upright hand)
        const indexExt = landmarks[8].y < landmarks[6].y;
        const middleExt = landmarks[12].y < landmarks[10].y;
        const ringExt = landmarks[16].y < landmarks[14].y;
        const pinkyExt = landmarks[20].y < landmarks[18].y;

        // 2. ROTATE: Two Fingers (Victory/Peace Sign)
        // Index & Middle Extended, Ring & Pinky Curled
        const isVictory = indexExt && middleExt && !ringExt && !pinkyExt;

        if (isVictory) {
            const x = wrist.x;
            const y = wrist.y;
            if (lastHandPos.current) {
                const deltaX = x - lastHandPos.current.x;
                const deltaY = y - lastHandPos.current.y;

                if (Math.abs(deltaX) > 0.002 || Math.abs(deltaY) > 0.002) {
                    onGesture({ type: 'ROTATE', value: { x: deltaX, y: deltaY } });
                    setDebugInfo('Gesture: 2-FINGER ROTATE');
                }
            }
            lastHandPos.current = { x, y };
            return;
        }

        // 3. EXIT FOCUS: Open Palm
        const isPalmOpen = indexExt && middleExt && ringExt && pinkyExt;
        if (isPalmOpen) {
            if (Date.now() - gestureHoldStart.current > 1000) {
                onGesture({ type: 'EXIT_FOCUS' });
                setDebugInfo('Gesture: EXIT FOCUS');
                gestureHoldStart.current = Date.now();
                return;
            }
        } else {
            gestureHoldStart.current = Date.now();
        }

        // 4. POINTER: Index only
        const isPointing = indexExt && !middleExt && !ringExt && !pinkyExt;
        if (isPointing) {
            onGesture({ type: 'FOCUS', value: { x: 1 - indexTip.x, y: indexTip.y } });
            setDebugInfo('Gesture: POINTER');
            lastHandPos.current = { x: wrist.x, y: wrist.y };
            return;
        }

        setDebugInfo('Hand Detected. Use Gestures.');
        lastHandPos.current = { x: wrist.x, y: wrist.y };
    };

    return (
        <div className={`absolute bottom-4 left-4 z-50 p-2 bg-black/50 rounded text-xs text-cyan-400 font-mono pointer-events-none ${appState.controlMode === ControlMode.HAND ? 'opacity-100' : 'opacity-0'}`}>
            <video ref={videoRef} className="w-32 h-24 -scale-x-100 opacity-50 mb-2 border border-cyan-800" autoPlay playsInline muted />
            <div>{debugInfo}</div>
            <div className="mt-1 text-[10px] text-gray-400">
                2 Fingers: Rotate | 2 Hands: Zoom | Point: Cursor | Palm: Exit
            </div>
        </div>
    );
};

export default HandController;
