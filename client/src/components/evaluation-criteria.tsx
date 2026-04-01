import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface EvaluationCriteriaProps {
  name: string;
  description?: string;
  type?: "scale" | "binary" | "text";
  scaleMin?: number;
  scaleMax?: number;
  value?: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

export default function EvaluationCriteria({
  name,
  description,
  type = "scale",
  scaleMin = 1,
  scaleMax = 5,
  value,
  onChange,
  disabled,
}: EvaluationCriteriaProps) {
  const [localText, setLocalText] = useState(typeof value === "string" ? value : "");

  const scaleSteps = Array.from({ length: scaleMax - scaleMin + 1 }, (_, i) => scaleMin + i);

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <label className="text-sm font-medium text-gray-900">{name}</label>
        {type === "scale" && (
          <span className="text-sm text-gray-500 shrink-0">
            Score: <span className="font-medium text-[hsl(var(--primary-600))]">
              {value != null ? value : "—"}
            </span> / {scaleMax}
          </span>
        )}
      </div>

      {/* Scale: dynamic range buttons */}
      {type === "scale" && (
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">{scaleMin}</span>
          <div className="flex space-x-1 flex-1 flex-wrap gap-y-1">
            {scaleSteps.map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => !disabled && onChange(score)}
                disabled={disabled}
                className={cn(
                  "score-button",
                  value === score && "selected",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {value === score ? score : score}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-500">{scaleMax}</span>
        </div>
      )}

      {/* Binary: Yes / No */}
      {type === "binary" && (
        <div className="flex gap-3">
          <button
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onChange("yes")}
            className={cn(
              "flex-1 py-2 rounded-lg border text-sm font-medium transition-colors",
              value === "yes"
                ? "bg-green-600 border-green-600 text-white"
                : "border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-700",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            Yes
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onChange("no")}
            className={cn(
              "flex-1 py-2 rounded-lg border text-sm font-medium transition-colors",
              value === "no"
                ? "bg-red-500 border-red-500 text-white"
                : "border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-600",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            No
          </button>
        </div>
      )}

      {/* Text: free text */}
      {type === "text" && (
        <Textarea
          value={localText}
          disabled={disabled}
          rows={3}
          placeholder="Enter your response..."
          onChange={e => {
            setLocalText(e.target.value);
            onChange(e.target.value);
          }}
          className={cn(disabled && "opacity-50 cursor-not-allowed")}
        />
      )}

      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </div>
  );
}
