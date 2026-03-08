interface GuessHistoryProps {
  guesses: string[];
  correctName: string;
  maxGuesses: number;
}

export function GuessHistory({ guesses, correctName, maxGuesses }: GuessHistoryProps) {
  const slots = Array.from({ length: maxGuesses }, (_, i) => guesses[i] || null);

  return (
    <div className="flex gap-2 justify-center">
      {slots.map((guess, i) => {
        const isCorrect = guess?.toLowerCase() === correctName.toLowerCase();
        const isWrong = guess && !isCorrect;
        return (
          <div
            key={i}
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold transition-all ${
              isCorrect
                ? "bg-primary text-primary-foreground animate-bounce-in"
                : isWrong
                ? "bg-destructive/20 text-destructive border border-destructive/30"
                : "bg-secondary border border-border"
            }`}
          >
            {isCorrect ? "✓" : isWrong ? "✗" : i + 1}
          </div>
        );
      })}
    </div>
  );
}
