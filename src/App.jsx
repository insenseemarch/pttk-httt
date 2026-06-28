import { useState } from 'react';

export default function App() {
  const [result, setResult] = useState('Chưa test');
  const [loading, setLoading] = useState(false);

  const testSupabase = async () => {
    setLoading(true);
    setResult('Đang gọi backend...');

    try {
      const response = await fetch('/api/supabase-test');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Request failed');
      }

      setResult(`OK: ${data.message}`);
    } catch (error) {
      setResult(`Lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-shell">
      <section className="card">
        <p className="eyebrow">React + Express + Supabase</p>
        <h1>Test kết nối Supabase</h1>
        <p className="description">
          Bấm nút bên dưới để React gọi Express, và Express sẽ gọi Supabase bằng service role key.
        </p>

        <button className="button" onClick={testSupabase} disabled={loading}>
          {loading ? 'Đang test...' : 'Test Supabase'}
        </button>

        <div className="result-box">{result}</div>
      </section>
    </main>
  );
}
