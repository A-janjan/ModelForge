import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createModel } from '../api/models';
import { useNavigate } from 'react-router-dom';

export default function RegisterModel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    version: '',
    artifact_path: '',
    status: 'pending',
    traffic_weight: 0,
  });

  const mutation = useMutation({
    mutationFn: createModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      navigate('/models');
    },
    onError: (err: any) => {
      console.error('Registration error:', err);
      if (err.response) {
        // The request was made and the server responded with a status code
        setError(`Error ${err.response.status}: ${err.response.data?.detail || err.message}`);
      } else if (err.request) {
        // The request was made but no response received
        setError('No response from server. Is the backend running?');
      } else {
        // Something else
        setError(err.message || 'Registration failed');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    mutation.mutate(form);
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Register New Model</h1>
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Version</label>
          <input
            type="text"
            value={form.version}
            onChange={(e) => setForm({ ...form, version: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Artifact Path</label>
          <input
            type="text"
            value={form.artifact_path}
            onChange={(e) => setForm({ ...form, artifact_path: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Traffic Weight (%)</label>
          <input
            type="number"
            value={form.traffic_weight}
            onChange={(e) => setForm({ ...form, traffic_weight: parseInt(e.target.value) })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            min="0"
            max="100"
            required
          />
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
        >
          {mutation.isPending ? 'Registering...' : 'Register Model'}
        </button>
      </form>
    </div>
  );
}