"use client";

import { useState } from "react";

type Branch = {
  headline: string;
  description: string;
  cta: string;
  proof: string | null;
};

type Option = {
  id: string;
  label: string;
  branch: Branch | null;
};

type CapsuleViewerProps = {
  identity: {
    name: string;
    headline: string | null;
    avatar: string | null;
  };
  capsule: {
    title: string;
    objective: string;
    options: Option[];
  };
};

export function CapsuleViewer({ identity, capsule }: CapsuleViewerProps) {
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  function handleSelect(option: Option) {
    if (selectedOption?.id === option.id) {
      // Deselect → go back to options
      setIsTransitioning(true);
      setTimeout(() => {
        setSelectedOption(null);
        setIsTransitioning(false);
      }, 300);
      return;
    }

    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedOption(option);
      setIsTransitioning(false);
    }, 300);
  }

  function handleBack() {
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedOption(null);
      setIsTransitioning(false);
    }, 300);
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Identity header */}
      <div className="text-center mb-10">
        {identity.avatar && (
          <div className="mx-auto mb-4 h-16 w-16 rounded-full overflow-hidden ring-2 ring-white/10">
            <img
              src={identity.avatar}
              alt={identity.name}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <h2 className="text-sm font-medium uppercase tracking-widest text-zinc-500">
          {identity.name}
        </h2>
        {identity.headline && (
          <p className="mt-1 text-xs text-zinc-600">{identity.headline}</p>
        )}
      </div>

      {/* Capsule card */}
      <div className="relative rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-sm shadow-2xl overflow-hidden">
        {/* Question section */}
        <div className="px-8 pt-10 pb-6 text-center border-b border-white/5">
          <p className="text-xs font-medium uppercase tracking-widest text-indigo-400 mb-3">
            {capsule.title}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
            {capsule.objective}
          </h1>
        </div>

        {/* Content area with transition */}
        <div
          className={`px-8 py-8 transition-opacity duration-300 ${
            isTransitioning ? "opacity-0" : "opacity-100"
          }`}
        >
          {!selectedOption ? (
            /* Options grid */
            <div className="flex flex-col gap-3">
              {capsule.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option)}
                  className="group relative w-full rounded-xl border border-white/10 bg-white/[0.03] px-6 py-4 text-left transition-all duration-200 hover:border-indigo-500/40 hover:bg-indigo-500/5 hover:shadow-lg hover:shadow-indigo-500/5 active:scale-[0.98]"
                >
                  <span className="text-base font-medium text-zinc-200 group-hover:text-white transition-colors">
                    {option.label}
                  </span>
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 group-hover:text-indigo-400 transition-colors">
                    →
                  </span>
                </button>
              ))}
            </div>
          ) : (
            /* Branch content */
            <div>
              {selectedOption.branch ? (
                <div className="space-y-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                    {selectedOption.branch.headline}
                  </h3>

                  <p className="text-zinc-400 leading-relaxed text-base">
                    {selectedOption.branch.description}
                  </p>

                  {selectedOption.branch.proof && (
                    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                      <p className="text-xs font-medium uppercase tracking-widest text-zinc-500 mb-2">
                        Proof
                      </p>
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        {selectedOption.branch.proof}
                      </p>
                    </div>
                  )}

                  <a
                    href={selectedOption.branch.cta}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98]"
                  >
                    {selectedOption.branch.cta}
                  </a>

                  <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mx-auto"
                  >
                    ← Back to options
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-zinc-500">
                    No content available for this option yet.
                  </p>
                  <button
                    onClick={handleBack}
                    className="mt-4 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    ← Back to options
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected option pill */}
        {selectedOption && (
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-400">
              {selectedOption.label}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="mt-8 text-center text-xs text-zinc-700">
        Powered by <span className="text-zinc-500 font-medium">Faymoos</span>
      </p>
    </div>
  );
}
