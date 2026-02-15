import { useState, useEffect, useContext } from 'react';
import { getDashboardStats } from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const StatCard = ({ label, value }) => (
    <div className="bg-white shadow rounded-lg p-6">
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-gray-500">{label}</div>
    </div>
);

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.orgId) {
      getDashboardStats(user.orgId)
        .then(res => {
            if (res.data.success) {
                setStats(res.data.data);
            } else {
                setError(res.data.error);
            }
        })
        .catch(err => setError(err.message || 'Failed to fetch dashboard stats.'))
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div className="bg-red-100 text-red-700 p-3 rounded-md">{error}</div>;
  if (!stats) return <div>No stats available.</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tasks" value={stats.total} />
        <StatCard label="Open" value={stats.byStatus.open || 0} />
        <StatCard label="In Progress" value={stats.byStatus.in_progress || 0} />
        <StatCard label="Done" value={stats.byStatus.done || 0} />
      </div>
    </div>
  );
}
