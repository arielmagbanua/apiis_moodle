export type QuizResultStats = {
  groupAverage: number;
  maximumPoints: number;
  passingScore: number;
  totalAttempts: number;
  noAttempts: number;
  highestScore: number;
  topScorers: Array<string>;
  passedCount: number;
  failedCount: number;
};

export default function QuizSummary({ summary }: { summary: QuizResultStats }) {
  return (
    <div className="flex gap-2 w-full items-baseline justify-center p-4">
      <div className="w-full text-left text-sm text-black">
        <h2 className="text-lg font-bold pb-2">Quiz Statistics</h2>
        <p className="text-sm pb-1">Group Average: {summary.groupAverage}</p>
        <p className="text-sm pb-1">Maximum Points: {summary.maximumPoints}</p>
        <p className="text-sm pb-1">Passing Score: {summary.passingScore}</p>
        <p className="text-sm pb-1">Total Attempts: {summary.totalAttempts}</p>
        <p className="text-sm pb-1">No Attempts: {summary.noAttempts}</p>
        <p className="text-sm pb-1">Highest Score: {summary.highestScore}</p>
      </div>
      <div className="w-full text-left text-sm text-black">
        <h2 className="text-lg font-bold pb-2">
          Students with the highest scores
        </h2>
        <ul className="list-disc list-inside">
          {summary.topScorers.map((scorer) => (
            <li key={scorer}>{scorer}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
