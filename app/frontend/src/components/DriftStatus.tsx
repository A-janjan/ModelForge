import { DriftStatus as DriftType } from '../types';

export default function DriftStatus({ status }: { status: DriftType }) {
  if (status.status === 'insufficient_data') {
    return <p>Insufficient data: {status.samples} samples collected (need 50).</p>;
  }
  return (
    <div>
      <p>
        Average PSI: <strong>{status.average_psi?.toFixed(4)}</strong> (threshold: {status.threshold})
      </p>
      <p>
        Drift detected: <span className={status.drift_detected ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
          {status.drift_detected ? 'YES' : 'NO'}
        </span>
      </p>
      <p className="text-sm text-gray-500 mt-2">PSI per feature: {status.psi_per_feature?.map((p) => p.toFixed(4)).join(', ')}</p>
    </div>
  );
}