import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getModels } from '../api/models';
import ModelCard from '../components/ModelCard';

export default function Dashboard() {
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

  const total = models?.length || 0;
  const active = models?.filter((m) => m.status === 'active').length || 0;
  const inactive = models?.filter((m) => m.status === 'inactive').length || 0;
  const pending = models?.filter((m) => m.status === 'pending').length || 0;

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 shadow-xl">
        <div className="relative px-6 py-12 sm:px-12 sm:py-16 lg:py-20">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              Welcome to <span className="text-yellow-300">ModelForge</span>
            </h1>
            <p className="mt-4 text-lg text-white/90 max-w-2xl">
              Deploy, manage, and monitor your machine learning models with ease.
              Route traffic, detect drift, and scale confidently.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                to="/register"
                className="bg-white text-indigo-700 hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold shadow-md transition-colors"
              >
                Get Started
              </Link>
              <Link
                to="/models"
                className="bg-white/20 text-white hover:bg-white/30 px-6 py-3 rounded-lg font-semibold backdrop-blur-sm transition-colors"
              >
                View All Models
              </Link>
            </div>
          </div>
          {/* Decorative circle */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Models" value={total} icon="📦" color="bg-indigo-100 text-indigo-800" />
        <StatCard label="Active" value={active} icon="✅" color="bg-green-100 text-green-800" />
        <StatCard label="Inactive" value={inactive} icon="⏸️" color="bg-gray-100 text-gray-800" />
        <StatCard label="Pending" value={pending} icon="⏳" color="bg-yellow-100 text-yellow-800" />
      </div>

      {/* Active Models Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">🚀 Active Models</h2>
          {active > 0 && (
            <span className="text-sm text-gray-500">
              {active} model{active > 1 ? 's' : ''} serving traffic
            </span>
          )}
        </div>
        {active === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500 border border-dashed border-gray-300">
            <p className="text-lg">No active models yet.</p>
            <Link to="/register" className="mt-2 inline-block text-indigo-600 hover:underline font-medium">
              Register your first model →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {models?.filter((m) => m.status === 'active').map((model) => (
              <ModelCard key={model.version} model={model} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Small stat card component
function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center space-x-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}