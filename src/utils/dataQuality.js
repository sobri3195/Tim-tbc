export function calculateDataQuality(gridProperties) {
  let qualityScore = 0;
  let factors = 0;

  if (gridProperties.visitRate !== undefined) {
    if (gridProperties.visitRate >= 15) {
      qualityScore += 1;
    } else if (gridProperties.visitRate >= 8) {
      qualityScore += 0.6;
    } else {
      qualityScore += 0.3;
    }
    factors++;
  }

  if (gridProperties.riskScore !== undefined) {
    if (gridProperties.riskScore > 0) {
      qualityScore += 1;
    } else {
      qualityScore += 0.2;
    }
    factors++;
  }

  const hasStableSignal = Math.random() > 0.2;
  if (hasStableSignal) {
    qualityScore += 1;
  } else {
    qualityScore += 0.4;
  }
  factors++;

  const hasFacilityData = Math.random() > 0.3;
  if (hasFacilityData) {
    qualityScore += 1;
  } else {
    qualityScore += 0.3;
  }
  factors++;

  return factors > 0 ? qualityScore / factors : 0.5;
}
