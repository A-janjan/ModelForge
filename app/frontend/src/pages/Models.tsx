import { useQuery } from '@tanstack/react-query';
import { getModels } from '../api/models';
import { Link } from 'react-router-dom';

export default function Models() {
  const { data: models, isLoading } = useQuery({
    queryKey: ['models'],
    queryFn: getModels,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const statusBadge = (status: string) => {
    const classes = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-200 text-gray-600',
      failed: 'bg-red-100 text-red-800',
    };
    return `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800'}`;
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">All Models</h1>
      <div className="bg-white shadow rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {models?.map((model) => (
              <tr key={model.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{model.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{model.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">v{model.version}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={statusBadge(model.status)}>{model.status}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{model.traffic_weight}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link to={`/models/${model.version}`} className="text-indigo-600 hover:text-indigo-900 font-medium">
                    Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}