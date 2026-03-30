import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Stats {
  totalClients: number;
  totalInterventions: number;
  interventionsThisMonth: number;
  pendingInterventions: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) { router.replace('/login'); return; }
    if (userData) setUser(JSON.parse(userData));

    fetch(`${API}/api/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const logout = () => {
    localStorage.clear();
    router.replace('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">GestionAle — Hygienix</h1>
        <div className="flex items-center gap-4">
          <Link href="/clienti" className="hover:underline text-sm">Clienti</Link>
          <Link href="/interventi" className="hover:underline text-sm">Interventi</Link>
          <span className="text-sm opacity-75">{user?.name}</span>
          <button onClick={logout} className="text-sm bg-white text-blue-700 px-3 py-1 rounded hover:bg-gray-100">Esci</button>
        </div>
      </nav>

      <main className="p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Dashboard</h2>

        {loading ? (
          <p className="text-gray-500">Caricamento statistiche...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Clienti totali" value={stats?.totalClients ?? 0} color="blue" />
            <StatCard label="Interventi totali" value={stats?.totalInterventions ?? 0} color="green" />
            <StatCard label="Interventi questo mese" value={stats?.interventionsThisMonth ?? 0} color="yellow" />
            <StatCard label="Interventi in attesa" value={stats?.pendingInterventions ?? 0} color="red" />
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/clienti" className="block bg-white rounded-2xl shadow p-6 hover:shadow-md transition">
            <h3 className="text-lg font-semibold text-blue-700 mb-1">Gestisci Clienti</h3>
            <p className="text-gray-500 text-sm">Visualizza, aggiungi e modifica i clienti.</p>
          </Link>
          <Link href="/interventi" className="block bg-white rounded-2xl shadow p-6 hover:shadow-md transition">
            <h3 className="text-lg font-semibold text-green-700 mb-1">Gestisci Interventi</h3>
            <p className="text-gray-500 text-sm">Pianifica e monitora gli interventi.</p>
          </Link>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${colors[color]}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-4xl font-bold mt-1">{value}</p>
    </div>
  );
}
