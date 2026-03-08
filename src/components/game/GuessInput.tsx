import { useState, useRef, useEffect } from "react";
import { searchPlayers, Player } from "@/data/players";
import { Search } from "lucide-react";
import { hapticLight } from "@/lib/feedback";

interface GuessInputProps {
  onGuess: (name: string) => void;
  disabled: boolean;
}

export function GuessInput({ onGuess, disabled }: GuessInputProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Player[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const results = searchPlayers(query);
    setSuggestions(results);
    setShowSuggestions(results.length > 0 && query.length >= 2);
  }, [query]);

  const handleSelect = (name: string) => {
    hapticLight();
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    onGuess(name);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length > 1) {
      handleSelect(query.trim());
    }
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowSuggestions(true)}
          placeholder="Type player name..."
          disabled={disabled}
          className="w-full h-12 rounded-xl border border-border bg-secondary pl-11 pr-4 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
        />
      </form>

      {showSuggestions && (
        <div className="absolute top-14 left-0 right-0 z-50 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
          {suggestions.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelect(p.name)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary transition-colors border-b border-border last:border-0"
            >
              <span className="text-lg">
                {p.countryCode.toUpperCase().split("").map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397)).join("")}
              </span>
              <span className="font-body text-sm text-foreground">{p.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">{p.position}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
