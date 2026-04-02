import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { queryClient } from "@/lib/queryClient";
import { Loader2, ArrowRight, KeyRound } from "lucide-react";
import logo from "@/assets/logo.png";

export default function JuryJoin() {
  const { roundId } = useParams<{ roundId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [round, setRound] = useState<{ name: string; description?: string; cohorts?: { name: string } } | null>(null);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Fetch round public info (no auth)
  useEffect(() => {
    fetch(`/api/rounds/${roundId}/public`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setRound(data); });
  }, [roundId]);

  const joinMutation = useMutation({
    mutationFn: async () => {
      const codeStr = code.join("").toUpperCase();
      const res = await fetch("/api/auth/jury-join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundId: parseInt(roundId!), code: codeStr }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Invalid code");
      }
      return res.json();
    },
    onSuccess: async (data) => {
      // Sign out of any existing Supabase session so it doesn't override the jury token
      const { supabase } = await import("@/lib/supabase");
      await supabase.auth.signOut();
      localStorage.setItem("jury_token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      // Wipe the query cache so no stale admin data bleeds through
      queryClient.clear();
      setLocation(`/jury-scoresheet?roundId=${roundId}`);
    },
    onError: (err: any) => {
      toast({ title: err.message || "Invalid code", variant: "destructive" });
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    },
  });

  const handleDigit = (idx: number, val: string) => {
    const char = val.replace(/[^a-zA-Z0-9]/g, "").slice(-1).toUpperCase();
    const next = [...code];
    next[idx] = char;
    setCode(next);
    if (char && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      const next = [...code];
      next[idx - 1] = "";
      setCode(next);
      inputRefs.current[idx - 1]?.focus();
    }
    if (e.key === "Enter" && code.every(c => c)) joinMutation.mutate();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
    const next = pasted.split("").concat(["", "", "", "", "", ""]).slice(0, 6);
    setCode(next);
    const firstEmpty = next.findIndex(c => !c);
    inputRefs.current[firstEmpty === -1 ? 5 : firstEmpty]?.focus();
  };

  const filled = code.every(c => c !== "");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo + branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-sm overflow-hidden">
            <img src={logo} alt="Scorer Ai" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Scorer Ai</h1>
          {round ? (
            <>
              <p className="text-slate-500 text-sm mt-1">{round.cohorts?.name}</p>
              <p className="text-[#0F7894] font-semibold mt-1">{round.name}</p>
            </>
          ) : (
            <p className="text-slate-400 text-sm mt-1">Loading round…</p>
          )}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#0F7894]/10 flex items-center justify-center">
              <KeyRound size={15} className="text-[#0F7894]" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800 text-sm">Enter your access code</h2>
              <p className="text-xs text-slate-400">6-character code provided by your organizer</p>
            </div>
          </div>

          {/* 6-box code input */}
          <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
            {code.map((c, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="text"
                maxLength={1}
                value={c}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={cn(
                  "w-10 h-12 text-center text-lg font-bold uppercase rounded-lg border-2 outline-none transition-colors",
                  c
                    ? "border-[#0F7894] bg-[#0F7894]/5 text-[#0F7894]"
                    : "border-slate-200 text-slate-700 focus:border-[#0F7894]",
                )}
              />
            ))}
          </div>

          <Button
            className="w-full bg-[#0F7894] hover:bg-[#0c6078] text-white font-medium h-11"
            disabled={!filled || joinMutation.isPending}
            onClick={() => joinMutation.mutate()}
          >
            {joinMutation.isPending ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : (
              <ArrowRight size={16} className="mr-2" />
            )}
            {joinMutation.isPending ? "Verifying…" : "Join Evaluation"}
          </Button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Need your code? Contact your program organizer.
        </p>
      </div>
    </div>
  );
}
