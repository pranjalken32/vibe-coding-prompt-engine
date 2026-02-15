import { useState, useEffect, useContext } from 'react';
import { getAuditLogs } from '../utils/api';
import { AuthContext } from '../context/AuthContext';

export default function AuditLogs() {
  const { user } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.orgId) {
      getAuditLogs(user.orgId)
        .then(res => {
            if (res.data.success) {
                setLogs(res.data.data)
            } else {
                setError(res.data.error);
            }
        })
        .catch(err => setError(err.message || 'Failed to fetch audit logs.'))
        .finally(() => setLoading(false));
    }
  }, [user]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
      </div>
      {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}
      {loading ? (
        <p>Loading...</p>
      ) : logs.length === 0 ? (
        <p className="text-gray-500">No audit logs yet.</p>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Changes</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map(log => (
                  <tr key={log._id}>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{log.action}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.resource}:{log.resourceId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.userId?.name || log.userId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                      {JSON.stringify(log.changes)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
