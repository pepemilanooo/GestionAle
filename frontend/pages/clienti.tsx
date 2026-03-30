import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: string;
  address: string;
}

export default function Clienti() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.replace('/login'); return; }
    fetch(`${API}/api/clients`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setClients(Array.isArray(data) ? data : data.clients || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = clients.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const logout = () => { localStorage.clear(); router.replace('/login'); };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">GestionAle — Hygienix</h1>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="hover:underline text-sm">Dashboard</Link>
          <Link href="/interventi" className="hover:underline text-sm">Interventi</Link>
          <button onClick={logout} className="text-sm bg-white text-blue-700 px-3 py-1 rounded hover:bg-gray-100">Esci</button>
        </div>
      </nav>

      <main className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Clienti</h2>
        </div>

        <input
          type="text"
          placeholder="Cerca per nome o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {loading ? (
          <p className="text-gray-500">Caricamento...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400">Nessun cliente trovato.</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded-2xl shadow">
            <table className="w-full text-sm text-left">
              <thead className="bg-blue-50 text-blue-700 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Telefono</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Indirizzo</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                    <td className="px-4 py-3 text-gray-600">{c.email}</td>
                    <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">{c.type}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{c.address}</td>
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
