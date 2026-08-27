import { Link } from 'react-router-dom';
import { Model } from '../types';

export default function ModelCard({ model }: { model: Model }) {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    archived: 'bg-gray-200 text-gray-600',
    failed: 'bg-red-100 text-red-800',
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 p-5 border border-gray-100">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{model.name}</h2>
          <p className="text-sm text-gray-500">v{model.version}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[model.status] || 'bg-gray-100 text-gray-800'}`}>
          {model.status}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-gray-600">Weight: <strong>{model.traffic_weight}%</strong></span>
        <Link
          to={`/models/${model.version}`}
          className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center"
        >
          Details
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}