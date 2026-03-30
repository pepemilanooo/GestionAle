import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Pianificato',
  IN_PROGRESS: 'In corso',
  COMPLETED: 'Completato',
  CANCELLED: 'Annullato',
};

const STATUS_COLORS: Record<string, string> = {
  PLANNED: 'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

interface Intervention {
  id: string;
  title: string;
  status: string;
  scheduledDate: string;
  client?: { name: string };
  technician?: { name: string };
}

export default function Interventi() {
  const router = useRouter();
  const [items, setItems] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.replace('/login'); return; }
    fetch(`${API}/api/interventions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : data.interventions || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = filter === 'ALL' ? items : items.filter((i) => i.status === filter);

  const logout = () => { localStorage.clear(); router.replace('/login'); };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">GestionAle — Hygienix</h1>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="hover:underline text-sm">Dashboard</Link>
          <Link href="/clienti" className="hover:underline text-sm">Clienti</Link>
          <button onClick={logout} className="text-sm bg-white text-blue-700 px-3 py-1 rounded hover:bg-gray-100">Esci</button>
        </div>
      </nav>

      <main className="p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Interventi</h2>

        <div className="flex gap-2 mb-4 flex-wrap">
          {['ALL', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition ${
                filter === s
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {s === 'ALL' ? 'Tutti' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-500">Caricamento...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400">Nessun intervento trovato.</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded-2xl shadow">
            <table className="w-full text-sm text-left">
              <thead className="bg-green-50 text-green-700 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Titolo</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Tecnico</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Stato</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{item.title}</td>
                    <td className="px-4 py-3 text-gray-600">{item.client?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{item.technician?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {item.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString('it-IT') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[item.status] || item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
