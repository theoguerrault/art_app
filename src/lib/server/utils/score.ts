/**
 * Computes the global reliability score (0 - 100) based on all article portions
 * and the introduction verification status.
 */
export function calculateGlobalScore(
  report: any,
  articlePortions: any[] = [],
  introductionText?: string | null
): number {
  let totalCount = 0;
  let validCount = 0;

  // 1. Evaluate Introduction if present
  const hasIntro = Boolean(introductionText || report?.introduction);
  if (hasIntro) {
    totalCount += 1;
    if (report?.introduction?.status?.toUpperCase() === 'VERIFIED') {
      validCount += 1;
    }
  }

  // 2. Evaluate Article Portions
  if (Array.isArray(articlePortions) && articlePortions.length > 0) {
    for (const portion of articlePortions) {
      totalCount += 1;
      if (portion.status?.toUpperCase() === 'VERIFIED') {
        validCount += 1;
      }
    }
  } else if (report?.statements && Array.isArray(report.statements)) {
    for (const statement of report.statements) {
      totalCount += 1;
      if (statement.status?.toUpperCase() === 'VERIFIED') {
        validCount += 1;
      }
    }
  }

  if (totalCount === 0) return 0;
  return Math.round((validCount / totalCount) * 100);
}

/**
 * Computes the global verification status ('VERIFIED', 'FALSE', or 'PENDING_VALIDATION')
 * based on all article portions and introduction status.
 */
export function calculateGlobalStatus(
  report: any,
  articlePortions: any[] = [],
  introductionText?: string | null
): string {
  const score = calculateGlobalScore(report, articlePortions, introductionText);

  const statuses: string[] = [];

  const hasIntro = Boolean(introductionText || report?.introduction);
  if (hasIntro && report?.introduction?.status) {
    statuses.push(report.introduction.status.toUpperCase());
  }

  if (Array.isArray(articlePortions) && articlePortions.length > 0) {
    for (const portion of articlePortions) {
      if (portion.status) {
        statuses.push(portion.status.toUpperCase());
      }
    }
  } else if (report?.statements && Array.isArray(report.statements)) {
    for (const statement of report.statements) {
      if (statement.status) {
        statuses.push(statement.status.toUpperCase());
      }
    }
  }

  if (statuses.includes('FALSE')) {
    return 'FALSE';
  }

  if (score === 100 && statuses.length > 0 && statuses.every((s) => s === 'VERIFIED')) {
    return 'VERIFIED';
  }

  return 'PENDING_VALIDATION';
}

