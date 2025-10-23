"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TickerResult {
  id: string;
  symbol: string;
  name: string;
  city?: string;
  assetType: string;
}

interface TickerAutocompleteProps {
  value: string;
  onValueChange: (value: string) => void;
  onTickerSelect?: (ticker: TickerResult) => void;
  assetType: "STOCK" | "FUND";
  placeholder?: string;
  disabled?: boolean;
}

export function TickerAutocomplete({
  value,
  onValueChange,
  onTickerSelect,
  assetType,
  placeholder = "Ticker ara...",
  disabled = false
}: TickerAutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [results, setResults] = React.useState<TickerResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Debounce search
  React.useEffect(() => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/tickers/search?q=${encodeURIComponent(searchQuery)}&type=${assetType}&limit=10`
        );
        const data = await response.json();
        
        if (data.success) {
          setResults(data.data || []);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error('Ticker search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery, assetType]);

  const handleSelect = (ticker: TickerResult) => {
    onValueChange(ticker.symbol);
    setSearchQuery(ticker.symbol);
    setOpen(false);
    
    // Notify parent about selected ticker
    if (onTickerSelect) {
      onTickerSelect(ticker);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-left"
          disabled={disabled}
        >
          <span className="truncate flex-1 min-w-0 mr-2" title={value || placeholder}>
            {(value && value.length > 40) ? value.substring(0, 40) + '...' : (value || placeholder)}
          </span>
          <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`${assetType === 'STOCK' ? 'BIST' : 'TEFAS'} ticker ara... (min 2 karakter)`}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Aranıyor...
                </div>
              ) : searchQuery.length < 2 ? (
                <div className="py-6 text-center text-sm">
                  En az 2 karakter girin
                </div>
              ) : (
                <div className="py-6 text-center text-sm">
                  Sonuç bulunamadı
                </div>
              )}
            </CommandEmpty>
            {results.length > 0 && (
              <CommandGroup>
                {results.map((ticker) => (
                  <CommandItem
                    key={ticker.id}
                    value={ticker.symbol}
                    onSelect={() => handleSelect(ticker)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === ticker.symbol ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{ticker.symbol}</span>
                        {ticker.city && (
                          <span className="text-xs text-muted-foreground">
                            {ticker.city}
                          </span>
                        )}
                      </div>
                      <span
                        className="text-sm text-muted-foreground"
                        title={ticker.name}
                        style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            wordBreak: 'break-word',
                            lineHeight: '1.2',
                            maxHeight: '2.4em'
                        }}
                      >
                        {ticker.name}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
