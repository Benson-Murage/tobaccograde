import { cn } from "@/lib/utils";
import { Clock, User, Package } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Grading {
  id: string;
  baleCode: string;
  farmer: string;
  grade: string;
  gradeClass: "premium" | "good" | "standard" | "low" | "rejected";
  grader: string;
  timestamp: string;
  weight: number;
}

const gradeClassStyles = {
  premium: "grade-premium",
  good: "grade-good",
  standard: "grade-standard",
  low: "grade-low",
  rejected: "grade-rejected",
};

interface RecentGradingsTableProps {
  gradings?: Grading[];
}

export function RecentGradingsTable({ gradings = [] }: RecentGradingsTableProps) {
  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="card-elevated overflow-hidden">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Recent Gradings</h3>
        <p className="text-sm text-muted-foreground mt-1">Latest tobacco bale assessments</p>
      </div>
      {gradings.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>No recent gradings yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Bale</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Farmer</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Grade</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Weight</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Grader</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {gradings.map((grading) => (
                <tr key={grading.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm font-medium">{grading.baleCode}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-foreground">{grading.farmer}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("grade-badge", gradeClassStyles[grading.gradeClass])}>
                      {grading.grade}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-foreground">{grading.weight} kg</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{grading.grader}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{formatTime(grading.timestamp)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
