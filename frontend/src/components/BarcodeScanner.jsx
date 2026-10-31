import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  Camera,
  Flashlight,
  FlashlightOff,
  SwitchCamera,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Scan,
} from 'lucide-react';
import { notifyScanSuccess } from '../utils/audio';

const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.QR_CODE,
];

const SCANNER_VIEWPORT_ID = 'smb-barcode-viewport';

export default function BarcodeScanner({ onScan, isPaused = false }) {
  const scannerRef = useRef(null);
  const scanLockedRef = useRef(false);
  const isStartingRef = useRef(false);

  const [cameraState, setCameraState] = useState('initializing'); // 'initializing' | 'running' | 'error' | 'paused'
  const [errorMessage, setErrorMessage] = useState('');
  const [torchSupported, setTorchSupported] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [activeCameraIndex, setActiveCameraIndex] = useState(0);
  const [lastScannedCode, setLastScannedCode] = useState(null);

  // Sync external pause state with internal lock
  useEffect(() => {
    scanLockedRef.current = isPaused;
  }, [isPaused]);

  const handleScanSuccess = useCallback(
    (decodedText, decodedResult) => {
      if (scanLockedRef.current || isPaused) return;

      // Lock scanning temporarily to prevent duplicate firing
      scanLockedRef.current = true;
      setLastScannedCode(decodedText);

      // Audio & Haptic feedback
      notifyScanSuccess();

      // Emit scan event to parent
      if (onScan) {
        onScan(decodedText, decodedResult);
      }

      // Auto unlock after 1500ms
      setTimeout(() => {
        scanLockedRef.current = false;
        setLastScannedCode(null);
      }, 1500);
    },
    [onScan, isPaused]
  );

  const startScanner = useCallback(
    async (cameraIdOrFacing = { facingMode: 'environment' }) => {
      const container = document.getElementById(SCANNER_VIEWPORT_ID);
      if (!container) return;

      try {
        isStartingRef.current = true;
        setCameraState('initializing');
        setErrorMessage('');

        // Stop existing scanner instance if already running
        if (scannerRef.current) {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          scannerRef.current.clear();
        }

        const html5QrCode = new Html5Qrcode(SCANNER_VIEWPORT_ID, {
          formatsToSupport: SUPPORTED_FORMATS,
          verbose: false,
        });
        scannerRef.current = html5QrCode;

        // Fetch cameras list to enable camera switching
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            setAvailableCameras(devices);
          }
        } catch (e) {
          console.warn('Could not list cameras:', e);
        }

        // QrBox config: 260x160 rectangle ideal for retail household barcodes
        const qrConfig = {
          fps: 15,
          qrbox: { width: 260, height: 160 },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          cameraIdOrFacing,
          qrConfig,
          (decodedText, decodedResult) => {
            handleScanSuccess(decodedText, decodedResult);
          },
          () => {
            // Frame search callback (silent)
          }
        );

        setCameraState('running');
        isStartingRef.current = false;

        // Check torch capabilities
        try {
          const track = html5QrCode.getRunningTrackCapabilities();
          if (track && track.torch) {
            setTorchSupported(true);
          } else {
            setTorchSupported(true); // Allow attempting torch constraint
          }
        } catch {
          setTorchSupported(true);
        }
      } catch (err) {
        console.error('Barcode scanner start error:', err);
        isStartingRef.current = false;
        setCameraState('error');

        if (err.name === 'NotAllowedError' || err.toString().includes('Permission')) {
          setErrorMessage('Vui lòng cấp quyền truy cập Camera trong cài đặt trình duyệt');
        } else if (err.name === 'NotFoundError' || err.toString().includes('No camera')) {
          setErrorMessage('Không tìm thấy Camera trên thiết bị này');
        } else {
          setErrorMessage(err.message || 'Không thể khởi động Camera. Vui lòng thử lại');
        }
      }
    },
    [handleScanSuccess]
  );

  useEffect(() => {
    startScanner({ facingMode: 'environment' });

    return () => {
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current
            .stop()
            .then(() => scannerRef.current?.clear())
            .catch(() => {});
        } else {
          try {
            scannerRef.current.clear();
          } catch {
            // Ignore clear error
          }
        }
      }
    };
  }, [startScanner]);

  const toggleTorch = async () => {
    if (!scannerRef.current || !scannerRef.current.isScanning) return;
    try {
      const nextState = !isTorchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState }],
      });
      setIsTorchOn(nextState);
    } catch (err) {
      console.warn('Torch toggle not supported or failed:', err);
    }
  };

  const switchCamera = async () => {
    if (availableCameras.length > 1) {
      const nextIdx = (activeCameraIndex + 1) % availableCameras.length;
      setActiveCameraIndex(nextIdx);
      await startScanner(availableCameras[nextIdx].id);
    } else {
      // Toggle between environment and user
      const nextFacing =
        activeCameraIndex % 2 === 0 ? 'user' : { facingMode: 'environment' };
      setActiveCameraIndex((prev) => prev + 1);
      await startScanner(nextFacing);
    }
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-slate-950 shadow-2xl border border-slate-800">
      {/* Target Container for html5-qrcode video */}
      <div
        id={SCANNER_VIEWPORT_ID}
        className="w-full aspect-[4/3] max-h-[360px] bg-black flex items-center justify-center overflow-hidden [&>video]:w-full [&>video]:h-full [&>video]:object-cover"
      />

      {/* Overlay UI Layer */}
      {cameraState === 'running' && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-4 z-10">
          {/* Top Control Bar (Pointer events enabled for buttons) */}
          <div className="w-full flex items-center justify-between pointer-events-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-black/50 text-white backdrop-blur-md border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Camera sẵn sàng</span>
            </span>

            <div className="flex items-center gap-2">
              {torchSupported && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  title="Bật/Tắt đèn Flash"
                  className={`p-2.5 rounded-full backdrop-blur-md transition-all active:scale-90 ${
                    isTorchOn
                      ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/40'
                      : 'bg-black/50 text-white hover:bg-black/70 border border-white/10'
                  }`}
                >
                  {isTorchOn ? (
                    <Flashlight className="w-4 h-4 fill-current" />
                  ) : (
                    <FlashlightOff className="w-4 h-4" />
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={switchCamera}
                title="Đổi camera trước/sau"
                className="p-2.5 rounded-full bg-black/50 text-white hover:bg-black/70 border border-white/10 backdrop-blur-md transition-all active:scale-90"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Viewfinder Target Reticle with Animated Laser */}
          <div className="relative w-[260px] h-[160px] border border-white/20 rounded-2xl flex items-center justify-center bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
            {/* Viewfinder Corners */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl-xl" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr-xl" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl-xl" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br-xl" />

            {/* Dynamic Laser Beam */}
            {lastScannedCode ? (
              <div className="absolute inset-0 bg-emerald-500/20 rounded-xl border border-emerald-400 flex items-center justify-center backdrop-blur-[1px] transition-all">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-bounce" />
              </div>
            ) : (
              <div className="absolute w-[94%] h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_12px_rgba(244,63,94,0.9)] animate-laser-sweep" />
            )}
          </div>

          {/* Bottom status badge */}
          <div className="text-center pb-1">
            <span className="text-[11px] font-medium text-slate-300 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 inline-flex items-center gap-1.5">
              <Scan className="w-3.5 h-3.5 text-indigo-400" />
              <span>Đưa mã vạch EAN-13, UPC vào khung giữa</span>
            </span>
          </div>
        </div>
      )}

      {/* Initializing State */}
      {cameraState === 'initializing' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white p-6 z-20">
          <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin mb-3" />
          <p className="text-sm font-semibold">Đang kích hoạt Camera...</p>
          <p className="text-xs text-slate-400 mt-1 text-center">
            Đang cấu hình độ trễ thấp &lt; 200ms cho mã vạch gia dụng
          </p>
        </div>
      )}

      {/* Camera Error State */}
      {cameraState === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white p-6 z-20 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3 border border-rose-500/20">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-rose-300">Không thể mở Camera</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">{errorMessage}</p>
          <button
            type="button"
            onClick={() => startScanner({ facingMode: 'environment' })}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      )}
    </div>
  );
}
