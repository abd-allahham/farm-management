import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import type { IScannerControls } from '@zxing/browser';

interface Props {
  onDetected: (text: string) => void;
  onClose: () => void;
}

// Default export so CowsPage can React.lazy() this — zxing is a sizeable
// dependency and most visits to the Cows page never open the scanner.
export default function BarcodeScannerModal({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  // Kept in a ref so the scan effect below can stay mount-once ([] deps)
  // instead of tearing down and restarting the camera on every re-render.
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let controls: IScannerControls | undefined;
    let cancelled = false;

    reader
      .decodeFromConstraints(
        { video: { facingMode: 'environment' } },
        videoRef.current!,
        (result, _err, ctrl) => {
          controls = ctrl;
          if (cancelled || !result) return; // _err fires per frame with no code found — expected
          controls.stop();
          onDetectedRef.current(result.getText());
        },
      )
      .catch(() => {
        if (!cancelled) {
          setError('Could not access the camera. Check permissions, or enter the ear tag manually.');
        }
      });

    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-black">
        <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
      </div>

      {error ? (
        <p className="mt-4 max-w-sm text-center text-sm text-red-300">{error}</p>
      ) : (
        <p className="mt-4 text-sm text-white/80">Point the camera at the ear tag barcode</p>
      )}

      <button
        onClick={onClose}
        className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900"
      >
        Cancel
      </button>
    </div>
  );
}
