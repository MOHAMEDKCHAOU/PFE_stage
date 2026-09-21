"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "faymoos_welcome_seen";

type Phase = "idle" | "title" | "tagline" | "exit" | "done";

function getInitialPhase(): Phase {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1" ? "done" : "title";
  } catch {
    return "title";
  }
}

export function WelcomeToFaymoos() {
  const [phase, setPhase] = useState<Phase>(getInitialPhase);

  const finish = useCallback(() => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }

    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }

    setPhase("done");
  }, []);

  const skip = useCallback(() => {
    setPhase("exit");
    window.setTimeout(finish, 550);
  }, [finish]);

  useEffect(() => {
    if (phase === "done") {
      return;
    }

    document.body.style.overflow = "hidden";

    const t1 = window.setTimeout(() => setPhase("tagline"), 1500);
    const t2 = window.setTimeout(() => setPhase("exit"), 5800);
    const t3 = window.setTimeout(finish, 6500);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      document.body.style.overflow = "";
    };
  }, [phase, finish]);

  if (phase === "idle" || phase === "done") {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-gradient-to-br from-stone-950 via-zinc-900 to-bordeaux-950 px-6 transition-[opacity,visibility] duration-500 ease-out ${
        phase === "exit"
          ? "pointer-events-none opacity-0"
          : "opacity-100"
      }`}
      aria-hidden={phase === "exit"}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 20%, rgba(198, 161, 91, 0.25), transparent 55%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(30, 20, 25, 0.5), transparent 50%)",
        }}
      />

      <div className="relative max-w-5xl text-center">
        <div
          className={`mb-6 flex justify-center sm:mb-8 md:mb-10 transition-all duration-700 ease-out ${
            phase === "title"
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-0 scale-[0.98] opacity-100"
          } animate-in fade-in`}
        >
          <div className="relative">
            <div
              className="absolute -inset-3 rounded-3xl bg-bordeaux-500/20 blur-2xl"
              aria-hidden
            />

            <Image
              src="/uploads/logofaymoos.jpeg"
              alt="Faymoos"
              width={200}
              height={200}
              className="relative h-24 w-24 rounded-2xl object-contain bg-stone-900/30 p-1 shadow-2xl ring-1 ring-white/20 sm:h-32 sm:w-32 md:h-40 md:w-40"
              priority
            />
          </div>
        </div>

        <h1
          className={`font-bold tracking-tight transition-all duration-700 ease-out ${
            phase === "title"
              ? "text-4xl sm:text-6xl md:text-8xl"
              : "text-3xl sm:text-4xl md:text-6xl"
          } animate-in fade-in`}
        >
          <span className="block bg-gradient-to-r from-[#C6A15B]/10 via-white to-[#C6A15B]/10 bg-clip-text text-transparent">
            Welcome to
          </span>

          <span className="mt-2 block bg-gradient-to-r from-[#C6A15B]/10 via-bordeaux-200 to-bordeaux-400 bg-clip-text text-transparent md:mt-3">
            Faymoos
          </span>
        </h1>

        <p
          className={`mt-8 max-w-3xl mx-auto text-balance text-base font-medium leading-relaxed text-zinc-400 transition-all duration-700 ease-out sm:text-lg md:text-xl ${
            phase === "tagline" || phase === "exit"
              ? "translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-2 opacity-0"
          }`}
        >
          Turn your ideas into dynamic interactive capsules, connect with your
          audience, and showcase your content in a more engaging and
          professional way.
        </p>
      </div>

      <div
        className={`absolute bottom-10 left-0 right-0 flex justify-center transition-opacity duration-300 ${
          phase === "exit" ? "opacity-0" : "opacity-100"
        }`}
      >
        <button
          type="button"
          onClick={skip}
          className="rounded-full border border-white/20 bg-zinc-900/5 px-5 py-2 text-sm font-medium text-zinc-500 backdrop-blur-sm transition-all hover:border-white/30 hover:bg-zinc-900/10 hover:text-zinc-300"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
