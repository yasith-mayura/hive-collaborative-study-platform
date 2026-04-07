import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import Notification from "@/components/ui/Notification";

export default function IntroVideoSplash() {
  const { user } = useAuth();
  const [showSplash, setShowSplash] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  const handleAnimationFinish = useCallback(() => {
    setFadingOut(true);
    sessionStorage.setItem("hasSeenIntro", "true");

    if (sessionStorage.getItem("freshLogin")) {
      Notification.success("Login successful!");
      sessionStorage.removeItem("freshLogin");
    }

    setTimeout(() => {
      setShowSplash(false);
    }, 800);
  }, []);

  useEffect(() => {
    if (user && !sessionStorage.getItem("hasSeenIntro")) {
      setShowSplash(true);

      // GIFs don't natively trigger an onEnded event.
      // Set to 3.5 seconds fallback timer. You can adjust this matching the exact GIF duration!
      const timer = setTimeout(() => {
        handleAnimationFinish();
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [user, handleAnimationFinish]);

  if (!showSplash) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-sm transition-opacity duration-700 ease-in-out ${fadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
    >
      <div className="relative w-full h-full flex flex-col items-center justify-center pointer-events-auto">
        <img
          src="/splash.gif"
          alt="Loading animation"
          className="w-full max-w-5xl h-[25vh] object-contain opacity-60 mix-blend-multiply"
          onError={handleAnimationFinish}
        />
      </div>
    </div>
  );
}
