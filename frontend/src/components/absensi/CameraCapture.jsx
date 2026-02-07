import { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

export default function CameraCapture({ onCapture, label = "Ambil Foto" }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [isCameraReady, setIsCameraReady] = useState(false);

    // Start Camera
    const startCamera = async () => {
        try {
            setError(null);
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 640, height: 480 }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera Error:", err);
            setError("Gagal mengakses kamera. Pastikan izin kamera diberikan.");
        }
    };

    // Stop Camera
    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            setIsCameraReady(false);
        }
    };

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const handleVideoPlay = () => {
        setIsCameraReady(true);
    };

    const takeSnapshot = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const context = canvasRef.current.getContext('2d');
        const width = videoRef.current.videoWidth;
        const height = videoRef.current.videoHeight;

        canvasRef.current.width = width;
        canvasRef.current.height = height;

        // Flip horizontal for mirror effect
        context.translate(width, 0);
        context.scale(-1, 1);

        context.drawImage(videoRef.current, 0, 0, width, height);

        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);

        // Pass to parent
        if (onCapture) {
            onCapture(dataUrl);
        }
    };

    const retake = () => {
        setCapturedImage(null);
        if (onCapture) onCapture(null);
    };

    return (
        <div className="flex flex-col items-center w-full max-w-md mx-auto">
            <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden shadow-lg border-2 border-gray-200">

                {/* Error Message */}
                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 text-center z-20">
                        <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
                        <p>{error}</p>
                        <button
                            onClick={startCamera}
                            className="mt-4 px-4 py-2 bg-blue-600 rounded-full text-sm font-medium hover:bg-blue-700"
                        >
                            Coba Lagi
                        </button>
                    </div>
                )}

                {/* Video Feed */}
                {!capturedImage && (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            onPlay={handleVideoPlay}
                            className={clsx(
                                "w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300",
                                isCameraReady ? "opacity-100" : "opacity-0"
                            )}
                        />
                        {/* Loading Spinner */}
                        {!isCameraReady && !error && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
                            </div>
                        )}

                        {/* Face Guide Overlay */}
                        {isCameraReady && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                <div className="w-48 h-64 border-2 border-white/50 rounded-full border-dashed"></div>
                                <p className="absolute bottom-4 text-white/80 text-sm font-medium bg-black/40 px-3 py-1 rounded-full">
                                    Posisikan wajah di tengah
                                </p>
                            </div>
                        )}
                    </>
                )}

                {/* Captured Image Preview */}
                {capturedImage && (
                    <div className="relative w-full h-full">
                        <img
                            src={capturedImage}
                            alt="Snapshot"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 right-4 bg-green-500 text-white p-2 rounded-full shadow-lg animate-bounce">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                    </div>
                )}

                {/* Hidden Canvas */}
                <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Controls */}
            <div className="mt-6 flex gap-4 w-full">
                {!capturedImage ? (
                    <button
                        onClick={takeSnapshot}
                        disabled={!isCameraReady}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all active:scale-95"
                    >
                        <Camera className="w-5 h-5" />
                        {label}
                    </button>
                ) : (
                    <button
                        onClick={retake}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 shadow-md transition-all active:scale-95 border border-gray-300"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Foto Ulang
                    </button>
                )}
            </div>
        </div>
    );
}
