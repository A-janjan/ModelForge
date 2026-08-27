import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getModelByVersion, promote, drain, getDriftStatus } from '../api/models';
import DriftStatus from '../components/DriftStatus';

export default function ModelDetail() {
  const { version } = useParams<{ version: string }>();
  const queryClient = useQueryClient();

  const { data: model, isLoading } = useQuery({
    queryKey: ['model', version],
    queryFn: () => getModelByVersion(version!),
    enabled: !!version,
  });

  const { data: drift } = useQuery({
    queryKey: ['drift', version],
    queryFn: () => getDriftStatus(version!),
    enabled: !!version,
  });

  const promoteMutation = useMutation({
    mutationFn: () => promote(version!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['models'] }),
  });

  const drainMutation = useMutation({
    mutationFn: () => drain(version!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['models'] }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  if (!model) return <div className="text-center py-12 text-gray-500">Model not found</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">{model.name} <span className="text-gray-500 text-2xl">v{model.version}</span></h1>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Details</h2>
          <ul className="mt-4 space-y-2">
            <li className="flex justify-between"><span className="text-gray-500">ID</span><span>{model.id}</span></li>
            <li className="flex justify-between"><span className="text-gray-500">Status</span><span className="capitalize">{model.status}</span></li>
            <li className="flex justify-between"><span className="text-gray-500">Artifact Path</span><span className="text-sm font-mono">{model.artifact_path}</span></li>
            <li className="flex justify-between"><span className="text-gray-500">Traffic Weight</span><span>{model.traffic_weight}%</span></li>
          </ul>
          <div className="mt-6 flex space-x-3">
            <button
              onClick={() => promoteMutation.mutate()}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Promote (100%)
            </button>
            <button
              onClick={() => drainMutation.mutate()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Drain (0%)
            </button>
          </div>
        </div>
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Drift Status</h2>
          <div className="mt-4">
            {drift ? (
              <DriftStatus status={drift} />
            ) : (
              <p className="text-gray-500">No drift data yet. Make some predictions.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}