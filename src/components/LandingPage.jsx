import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="max-w-xl w-full bg-white shadow-lg rounded-2xl p-8 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">TBC Hidden Cluster Map</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Dashboard Pemetaan TBC</h1>
          <p className="text-sm text-slate-600 mt-2">
            Gunakan tampilan aplikasi utama di <span className="font-semibold text-slate-800">/app</span> untuk versi mobile
            dan desktop. Navigasi bawah akan muncul otomatis saat layar kecil.
          </p>
        </div>

        <div className="bg-slate-100 rounded-lg p-4 text-sm text-slate-700 space-y-1">
          <p>✅ Mobile view + bottom navigation: <span className="font-semibold">/app</span></p>
          <p>✅ Shortcut view: <span className="font-semibold">/app/mobility</span>, <span className="font-semibold">/app/planner</span>, <span className="font-semibold">/app/patients</span></p>
        </div>

        <Link
          to="/app/planner"
          className="inline-flex items-center justify-center w-full rounded-lg bg-blue-600 text-white font-semibold py-3 hover:bg-blue-700 transition"
        >
          Buka Aplikasi
        </Link>
      </div>
    </div>
  );
}
