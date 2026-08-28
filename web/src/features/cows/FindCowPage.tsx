import { lazy, Suspense, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, ScanBarcode } from 'lucide-react';
import { findCowByBarcode } from './api';

// Same lazy-loading rationale as CowsPage's create form — zxing is a
// sizeable dependency most visits never need.
const BarcodeScannerModal = lazy(() => import('./BarcodeScannerModal'));

export function FindCowPage() {
  const navigate = useNavigate();
  const [barcode, setBarcode] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const find = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setSearching(true);
    setError(null);
    try {
      const cow = await findCowByBarcode(trimmed);
      if (cow) {
        navigate(`/cows/${cow.id}`);
      } else {
        setError(`No cow found with ear tag "${trimmed}".`);
      }
    } catch {
      setError('Could not search right now. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void find(barcode);
  };

  return (
    <section className="mx-auto max-w-sm">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-700 text-white">
          <ScanBarcode size={28} aria-hidden />
        </div>
        <h2 className="mt-3 text-base font-semibold text-slate-900">Find a cow</h2>
        <p className="mt-1 text-sm text-slate-500">Scan the ear tag, or enter its number below.</p>
      </div>

      <button
        onClick={() => setScannerOpen(true)}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
      >
        <Camera size={18} aria-hidden />
        Scan with camera
      </button>

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Ear tag / barcode"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-600"
        />
        <button
          type="submit"
          disabled={searching || !barcode.trim()}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {searching ? 'Finding…' : 'Find'}
        </button>
      </form>

      {error && (
        <div className="mt-3 text-sm text-red-600">
          <p>{error}</p>
          <Link to="/cows" className="mt-1 inline-block font-medium text-green-700 hover:text-green-800">
            Add it as a new cow instead
          </Link>
        </div>
      )}

      {scannerOpen && (
        <Suspense fallback={null}>
          <BarcodeScannerModal
            onDetected={(scanned) => {
              setBarcode(scanned);
              setScannerOpen(false);
              void find(scanned);
            }}
            onClose={() => setScannerOpen(false)}
          />
        </Suspense>
      )}
    </section>
  );
}
