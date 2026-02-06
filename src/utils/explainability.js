export function calculateExplainability(gridProperties, flows) {
  const factors = [];

  const mobilityContribution = calculateMobilityContribution(gridProperties, flows);
  factors.push({
    name: "Mobilitas",
    contribution: mobilityContribution,
    description: "Arus perjalanan masuk/keluar"
  });

  const densityContribution = calculateDensityContribution(gridProperties);
  factors.push({
    name: "Kepadatan",
    contribution: densityContribution,
    description: "Tingkat kunjungan faskes"
  });

  const visitContribution = calculateVisitContribution(gridProperties);
  factors.push({
    name: "Kunjungan Faskes",
    contribution: visitContribution,
    description: "Rate kunjungan batuk kronis"
  });

  const gapContribution = 100 - mobilityContribution - densityContribution - visitContribution;
  factors.push({
    name: "Gap Diagnosis",
    contribution: Math.max(0, gapContribution),
    description: "Selisih suspek vs diagnosis"
  });

  const total = factors.reduce((sum, f) => sum + f.contribution, 0);
  const normalized = factors.map(f => ({
    ...f,
    contribution: total > 0 ? Math.round((f.contribution / total) * 100) : 0
  }));

  return { factors: normalized };
}

function calculateMobilityContribution(gridProperties, flows) {
  const gridId = gridProperties.gridId;
  const relatedFlows = flows.filter(f => 
    f.fromGrid === gridId || f.toGrid === gridId
  );
  
  const flowScore = relatedFlows.reduce((sum, f) => sum + f.value, 0);
  return Math.min(40, flowScore / 10);
}

function calculateDensityContribution(gridProperties) {
  return gridProperties.visitRate ? Math.min(30, gridProperties.visitRate) : 15;
}

function calculateVisitContribution(gridProperties) {
  const riskScore = gridProperties.riskScore || 0.5;
  return Math.round(riskScore * 35);
}
