import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EvaluationCriteriaProps {
  name: string;
  description: string;
  value?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export default function EvaluationCriteria({ 
  name, 
  description, 
  value, 
  onChange, 
  disabled 
}: EvaluationCriteriaProps) {
  const [selectedScore, setSelectedScore] = useState(value || 0);

  const handleScoreSelect = (score: number) => {
    if (disabled) return;
    setSelectedScore(score);
    onChange(score);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-gray-900">{name}</label>
        <span className="text-sm text-gray-500">
          Score: <span className="font-medium text-[hsl(var(--primary-600))]">
            {selectedScore > 0 ? selectedScore : "-"}
          </span>/5
        </span>
      </div>
      
      <div className="flex items-center space-x-2 mb-3">
        <span className="text-xs text-gray-500">1</span>
        <div className="flex space-x-1 flex-1">
          {[1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              type="button"
              onClick={() => handleScoreSelect(score)}
              disabled={disabled}
              className={cn(
                "score-button",
                selectedScore === score && "selected",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {selectedScore === score ? score : ""}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500">5</span>
      </div>
      
      <p className="text-xs text-gray-600">{description}</p>
    </div>
  );
}
