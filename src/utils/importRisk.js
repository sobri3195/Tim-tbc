const clamp01 = (value) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
};

export function getRiskValue(row, computeRiskScore) {
  if (typeof row === "number") return clamp01(row);
  if (row?.risk !== undefined) return clamp01(row.risk);
  if (row && typeof row === "object" && typeof computeRiskScore === "function") {
    return clamp01(computeRiskScore(row));
  }
  return 0;
}

export function computeImportRisk(flows, riskById) {
  const maxVolume = Math.max(0, ...flows.map((flow) => flow.volume || 0));
  const contributionsByTo = {};
  const rawRiskById = {};

  flows.forEach((flow) => {
    const fromRisk = clamp01(riskById?.[flow.from] ?? 0);
    const normVolume = maxVolume ? (flow.volume || 0) / maxVolume : 0;
    const contribution = normVolume * fromRisk;
    if (!contributionsByTo[flow.to]) contributionsByTo[flow.to] = [];
    contributionsByTo[flow.to].push({
      from: flow.from,
      to: flow.to,
      volume: flow.volume || 0,
      normVolume,
      riskFrom: fromRisk,
      contribution,
    });
    rawRiskById[flow.to] = (rawRiskById[flow.to] || 0) + contribution;
  });

  const maxRawRisk = Math.max(0, ...Object.values(rawRiskById));
  const importRiskById = {};
  Object.entries(rawRiskById).forEach(([id, value]) => {
    importRiskById[id] = clamp01(maxRawRisk ? value / maxRawRisk : 0);
  });

  return {
    importRiskById,
    contributionsByTo,
    maxVolume,
    maxRawRisk,
  };
}
