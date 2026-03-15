"use client";

import { KeyboardEvent, useState } from "react";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  suggestions?: string[];
}

export function TagInput({
  value,
  onChange,
  placeholder = "Wpisz tag...",
  className,
  suggestions = [],
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setInputValue("");
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const availableSuggestions = suggestions.filter((s) => !value.includes(s));

  return (
    <div className={cn("space-y-2", className)}>
      {/* Added tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-2.5 py-0.5 text-xs font-medium"
            >
              #{tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="opacity-70 hover:opacity-100 transition-opacity"
                aria-label={`Usuń tag ${tag}`}
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input + Add button */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={() => addTag(inputValue)}
          disabled={!inputValue.trim()}
          className="inline-flex items-center gap-1 rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={14} />
          Dodaj
        </button>
      </div>

      {/* Suggestion chips — always visible */}
      {availableSuggestions.length > 0 && (
        <div>
          <p className="text-[11px] text-muted-foreground mb-1.5">Szybkie tagi — kliknij aby dodać:</p>
          <div className="flex flex-wrap gap-1.5">
            {availableSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addTag(s)}
                className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-muted-foreground/40 px-2.5 py-0.5 text-[11px] text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
              >
                <Plus size={9} />
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
