import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import EvaluationCriteria from "@/components/evaluation-criteria";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEvaluationSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ThumbsUp, ThumbsDown, HelpCircle, Save, Send } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";

const evaluationFormSchema = insertEvaluationSchema.extend({
  scores: z.record(z.number().min(1).max(5)),
  comments: z.string().optional(),
  decision: z.enum(["yes", "maybe", "no"]).optional(),
});

export default function EvaluationForm() {
  const { startupId } = useParams<{ startupId: string }>();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [decision, setDecision] = useState<string>("");
  const { toast } = useToast();

  const { data: startup, isLoading: startupLoading } = useQuery({
    queryKey: ["/api/startups", startupId],
    queryFn: () => fetch(`/api/startups/${startupId}`).then(res => res.json()),
  });

  const { data: criteria, isLoading: criteriaLoading } = useQuery({
    queryKey: ["/api/evaluation-criteria"],
  });

  const { data: existingEvaluation } = useQuery({
    queryKey: ["/api/evaluations", 1, startupId], // TODO: Replace with actual jury ID
    queryFn: () => fetch(`/api/evaluations/1/${startupId}`).then(res => res.json()),
  });

  const form = useForm<z.infer<typeof evaluationFormSchema>>({
    resolver: zodResolver(evaluationFormSchema),
    defaultValues: {
      juryId: 1, // TODO: Replace with actual jury ID
      startupId: parseInt(startupId!),
      scores: {},
      comments: "",
      decision: undefined,
      isCompleted: false,
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: async (data: z.infer<typeof evaluationFormSchema>) => {
      const response = existingEvaluation 
        ? await apiRequest("PUT", `/api/evaluations/${existingEvaluation.id}`, { ...data, isCompleted: false })
        : await apiRequest("POST", "/api/evaluations", { ...data, isCompleted: false });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evaluations"] });
      toast({ title: "Draft saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save draft", variant: "destructive" });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: z.infer<typeof evaluationFormSchema>) => {
      const response = existingEvaluation 
        ? await apiRequest("PUT", `/api/evaluations/${existingEvaluation.id}`, { 
            ...data, 
            isCompleted: true, 
            submittedAt: new Date().toISOString() 
          })
        : await apiRequest("POST", "/api/evaluations", { 
            ...data, 
            isCompleted: true, 
            submittedAt: new Date().toISOString() 
          });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evaluations"] });
      toast({ title: "Evaluation submitted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to submit evaluation", variant: "destructive" });
    },
  });

  const handleScoreChange = (criteriaId: string, score: number) => {
    setScores(prev => ({ ...prev, [criteriaId]: score }));
  };

  const handleSaveDraft = () => {
    const data = {
      ...form.getValues(),
      scores,
      decision: decision || undefined,
    };
    saveDraftMutation.mutate(data);
  };

  const handleSubmit = (data: z.infer<typeof evaluationFormSchema>) => {
    if (Object.keys(scores).length === 0) {
      toast({ title: "Please provide scores for all criteria", variant: "destructive" });
      return;
    }
    
    submitMutation.mutate({
      ...data,
      scores,
      decision: decision as any,
    });
  };

  if (startupLoading || criteriaLoading) {
    return (
      <div className="min-h-screen flex bg-gray-50">
        <Sidebar />
        <main className="flex-1 ml-64 min-h-screen">
          <div className="animate-pulse p-8">
            <div className="h-32 bg-gray-200 rounded mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="lg:col-span-2 h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 ml-64 min-h-screen">
        <Header 
          title="Startup Evaluation" 
          subtitle={`Evaluating ${startup?.name}`}
        />
        
        <div className="p-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Evaluation Form</CardTitle>
                  <p className="text-gray-600 mt-1">Complete evaluation for this startup</p>
                </div>
                {existingEvaluation?.isCompleted && (
                  <Badge className="bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]">
                    Submitted
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Startup Information */}
                <div className="lg:col-span-1">
                  <div className="bg-gray-50 rounded-xl p-6 sticky top-8">
                    <div className="text-center mb-6">
                      <div className="w-24 h-24 bg-[hsl(var(--primary-100))] rounded-xl mx-auto mb-4 flex items-center justify-center">
                        <span className="text-[hsl(var(--primary-600))] font-bold text-2xl">
                          {startup?.name?.charAt(0)}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{startup?.name}</h3>
                      <p className="text-gray-600">{startup?.category}</p>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Founded:</span>
                        <span className="font-medium">{startup?.founded || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Team Size:</span>
                        <span className="font-medium">{startup?.teamSize || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stage:</span>
                        <span className="font-medium">{startup?.stage || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Seeking:</span>
                        <span className="font-medium">{startup?.fundingSeek || "N/A"}</span>
                      </div>
                    </div>

                    {startup?.description && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-gray-600 text-sm">{startup.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Evaluation Form */}
                <div className="lg:col-span-2">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                      {/* Evaluation Criteria */}
                      <div className="space-y-6">
                        <h4 className="text-lg font-medium text-gray-900">Evaluation Criteria</h4>
                        
                        {criteria?.map((criterion: any) => (
                          <EvaluationCriteria
                            key={criterion.id}
                            name={criterion.name}
                            description={criterion.description}
                            value={scores[criterion.id]}
                            onChange={(score) => handleScoreChange(criterion.id.toString(), score)}
                            disabled={existingEvaluation?.isCompleted}
                          />
                        ))}
                      </div>

                      {/* Comments Section */}
                      <FormField
                        control={form.control}
                        name="comments"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Comments</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field}
                                rows={4}
                                placeholder="Share your detailed feedback about this startup..."
                                disabled={existingEvaluation?.isCompleted}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Final Decision */}
                      <div>
                        <FormLabel className="text-sm font-medium text-gray-900 mb-3 block">
                          Final Recommendation
                        </FormLabel>
                        <div className="grid grid-cols-3 gap-3">
                          <button
                            type="button"
                            onClick={() => setDecision("yes")}
                            disabled={existingEvaluation?.isCompleted}
                            className={cn(
                              "decision-button",
                              decision === "yes" && "yes",
                              existingEvaluation?.isCompleted && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <ThumbsUp size={20} className="mb-2" />
                            <div>Yes</div>
                            <div className="text-xs opacity-75">Recommend</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDecision("maybe")}
                            disabled={existingEvaluation?.isCompleted}
                            className={cn(
                              "decision-button",
                              decision === "maybe" && "maybe",
                              existingEvaluation?.isCompleted && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <HelpCircle size={20} className="mb-2" />
                            <div>Maybe</div>
                            <div className="text-xs opacity-75">Consider</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDecision("no")}
                            disabled={existingEvaluation?.isCompleted}
                            className={cn(
                              "decision-button",
                              decision === "no" && "no",
                              existingEvaluation?.isCompleted && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <ThumbsDown size={20} className="mb-2" />
                            <div>No</div>
                            <div className="text-xs opacity-75">Pass</div>
                          </button>
                        </div>
                      </div>

                      {/* Submit Buttons */}
                      {!existingEvaluation?.isCompleted && (
                        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                          <Button 
                            type="button"
                            variant="outline"
                            onClick={handleSaveDraft}
                            disabled={saveDraftMutation.isPending}
                          >
                            <Save size={16} className="mr-2" />
                            Save Draft
                          </Button>
                          <Button 
                            type="submit"
                            className="bg-[hsl(var(--primary-500))] hover:bg-[hsl(var(--primary-600))]"
                            disabled={submitMutation.isPending}
                          >
                            <Send size={16} className="mr-2" />
                            Submit Evaluation
                          </Button>
                        </div>
                      )}
                    </form>
                  </Form>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
