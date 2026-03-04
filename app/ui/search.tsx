// app/ui/search.tsx
"use client";

import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { useState, useRef, useTransition, useEffect } from "react";

export default function Search({ placeholder }: { placeholder: string }) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const [value, setValue] = useState(
        searchParams.get("query")?.toString() || "",
    );
    const [isPending, startTransition] = useTransition();
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Atalho Ctrl+K para focar no input
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                inputRef.current?.focus();
            }
            if (e.key === "Escape" && isFocused) {
                inputRef.current?.blur();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isFocused]);

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", "1");
        if (term) {
            params.set("query", term);
        } else {
            params.delete("query");
        }
        startTransition(() => {
            replace(`${pathname}?${params.toString()}`);
        });
    }, 300);

    const handleClear = () => {
        setValue("");
        handleSearch("");
        inputRef.current?.focus();
    };

    return (
        <div className="relative flex flex-1 shrink-0 max-w-md">
            <label htmlFor="search" className="sr-only">
                Buscar
            </label>
            <input
                ref={inputRef}
                id="search"
                className="peer block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 pl-10 pr-20 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-400 dark:hover:border-gray-600 transition-all"
                placeholder={placeholder}
                value={value}
                onChange={(e) => {
                    setValue(e.target.value);
                    handleSearch(e.target.value);
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
            />

            {/* Ícone de busca ou loading */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                {isPending ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 dark:border-gray-600 border-t-blue-400" />
                ) : (
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 peer-focus:text-blue-400 transition-colors" />
                )}
            </div>

            {/* Lado direito: limpar ou atalho */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {value && !isPending ? (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="p-0.5 rounded text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </button>
                ) : (
                    <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 text-xs text-gray-500">
                        <span className="text-[10px]">⌘</span>K
                    </kbd>
                )}
            </div>
        </div>
    );
}
