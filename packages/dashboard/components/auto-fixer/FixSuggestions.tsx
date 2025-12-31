"use client";

import { useEffect, useState } from "react";
import { FixSuggestionCard } from "./FixSuggestionCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lightbulb } from "lucide-react";

interface FixSuggestion {
  id: string;
  suggestion: string;
  fixedCode?: string | null;
  confidence: number;
  status: string;
  createdAt: string;
}

interface FixSuggestionsProps {
  deploymentId: string;
}

export function FixSuggestions({ deploymentId }: FixSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<FixSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSuggestions();
  }, [deploymentId]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/ai/fix-suggestions/${deploymentId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No suggestions found - this is okay
          setSuggestions([]);
          return;
        }
        throw new Error("Failed to fetch fix suggestions");
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error("Failed to fetch fix suggestions:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load fix suggestions"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      const response = await fetch(`/api/ai/fix-suggestions/${id}/dismiss`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to dismiss suggestion");
      }

      // Update local state
      setSuggestions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "dismissed" } : s))
      );
    } catch (err) {
      console.error("Failed to dismiss suggestion:", err);
      alert("Failed to dismiss suggestion. Please try again.");
    }
  };

  const handleApply = async (id: string) => {
    try {
      const response = await fetch(`/api/ai/fix-suggestions/${id}/apply`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to mark as applied");
      }

      // Update local state
      setSuggestions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "applied" } : s))
      );
    } catch (err) {
      console.error("Failed to mark as applied:", err);
      alert("Failed to update suggestion. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
        <span className="ml-2 text-sm text-gray-600">
          Loading AI suggestions...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const visibleSuggestions = suggestions.filter(
    (s) => s.status !== "dismissed"
  );

  if (visibleSuggestions.length === 0) {
    return (
      <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
        <Lightbulb className="h-4 w-4 text-purple-600" />
        <AlertDescription className="text-purple-800 dark:text-purple-200">
          No AI fix suggestions available for this deployment.
          {suggestions.length > 0 && " All suggestions have been dismissed."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-purple-500" />
          AI Fix Suggestions ({visibleSuggestions.length})
        </h3>
      </div>

      <div className="space-y-4">
        {visibleSuggestions.map((suggestion) => (
          <FixSuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onDismiss={handleDismiss}
            onApply={handleApply}
          />
        ))}
      </div>
    </div>
  );
}
