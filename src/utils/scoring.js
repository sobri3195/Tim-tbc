// Skor risiko sederhana (placeholder):
// - tinggi kalau suspectVisits tinggi, tbDiagnosed rendah (gap), facilityVisits tinggi, densityIdx tinggi.
// Ini hanya mock untuk demo UI, bisa diganti model statistika nanti.
export function computeRiskScore(row) {
  const suspect = clamp01((row.suspectVisits || 0) / 50);
  const diag = clamp01((row.tbDiagnosed || 0) / 20);
  const visits = clamp01((row.facilityVisits || 0) / 200);
  const dens = clamp01(row.densityIdx || 0);

  const gap = clamp01(suspect - diag);
  // weighted sum
  const risk = 0.35 * gap + 0.25 * suspect + 0.2 * visits + 0.2 * dens;
  return clamp01(risk);
}

function clamp01(x) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}
