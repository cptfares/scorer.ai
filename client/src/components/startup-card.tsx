import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Eye, Edit } from "lucide-react";
import type { Startup } from "@shared/schema";

interface StartupCardProps {
  startup: Startup;
  evaluationProgress?: number;
  totalEvaluations?: number;
  completedEvaluations?: number;
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
}

export default function StartupCard({ 
  startup, 
  evaluationProgress = 0, 
  totalEvaluations = 0,
  completedEvaluations = 0,
  onView, 
  onEdit 
}: StartupCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-[hsl(var(--primary-100))] rounded-lg flex items-center justify-center">
              <span className="text-[hsl(var(--primary-600))] font-bold text-lg">
                {startup.name.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{startup.name}</h3>
              <p className="text-sm text-gray-600">{startup.category}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {startup.stage}
          </Badge>
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {startup.description}
        </p>

        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Evaluation Progress</span>
            <span className="font-medium">{evaluationProgress}%</span>
          </div>
          <Progress value={evaluationProgress} className="h-2" />
          <p className="text-xs text-gray-500">
            {completedEvaluations}/{totalEvaluations} evaluations completed
          </p>
        </div>

        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onView?.(startup.id)}
          >
            <Eye size={14} className="mr-1" />
            View
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onEdit?.(startup.id)}
          >
            <Edit size={14} className="mr-1" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
