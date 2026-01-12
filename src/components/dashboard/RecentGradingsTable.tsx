import { cn } from "@/lib/utils";
import { Clock, User, Package } from "lucide-react";

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

const recentGradings: Grading[] = [
  {
    id: "1",
    baleCode: "BL-2024-00847",
    farmer: "Peter Nyambi",
    grade: "L1F",
    gradeClass: "premium",
    grader: "James Mwale",
    timestamp: "2 min ago",
    weight: 42.5,
  },
  {
    id: "2",
    baleCode: "BL-2024-00846",
    farmer: "Sarah Tembo",
    grade: "L3F",
    gradeClass: "good",
    grader: "James Mwale",
    timestamp: "5 min ago",
    weight: 38.2,
  },
  {
    id: "3",
    baleCode: "BL-2024-00845",
    farmer: "John Phiri",
    grade: "C2F",
    gradeClass: "standard",
    grader: "Mary Banda",
    timestamp: "12 min ago",
    weight: 45.0,
  },
  {
    id: "4",
    baleCode: "BL-2024-00844",
    farmer: "Grace Mwanza",
    grade: "X1F",
    gradeClass: "low",
    grader: "Mary Banda",
    timestamp: "18 min ago",
    weight: 36.8,
  },
  {
    id: "5",
    baleCode: "BL-2024-00843",
    farmer: "David Lungu",
    grade: "REJ",
    gradeClass: "rejected",
    grader: "James Mwale",
    timestamp: "25 min ago",
    weight: 28.5,
  },
];

const gradeClassStyles = {
  premium: "grade-premium",
  good: "grade-good",
  standard: "grade-standard",
  low: "grade-low",
  rejected: "grade-rejected",
};

export function RecentGradingsTable() {
  return (
    <div className="card-elevated overflow-hidden">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Recent Gradings</h3>
        <p className="text-sm text-muted-foreground mt-1">Latest tobacco bale assessments</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                Bale
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                Farmer
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                Grade
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                Weight
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                Grader
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {recentGradings.map((grading) => (
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
                    <span className="text-sm">{grading.timestamp}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
