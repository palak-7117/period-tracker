export function calculateNextCycle(pastStartDates) {
  if (!pastStartDates || pastStartDates.length === 0) return null;

  if (pastStartDates.length === 1) {
    const lastStart = new Date(pastStartDates[0]);
    const nextStart = new Date(lastStart.getTime() + 28 * 24 * 60 * 60 * 1000);
    return {
      predictedStart: nextStart.toISOString().split('T')[0],
      averageLength: 28
    };
  }

  const cycleLengths = [];
  for (let i = 1; i < pastStartDates.length; i++) {
    const start = new Date(pastStartDates[i - 1]);
    const end = new Date(pastStartDates[i]);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    cycleLengths.push(diffDays);
  }

  const sum = cycleLengths.reduce((a, b) => a + b, 0);
  const averageLength = Math.round(sum / cycleLengths.length);

  const mostRecentDate = new Date(pastStartDates[pastStartDates.length - 1]);
  const predictedStart = new Date(mostRecentDate.getTime() + averageLength * 24 * 60 * 60 * 1000);

  return {
    predictedStart: predictedStart.toISOString().split('T')[0],
    averageLength: averageLength
  };
}