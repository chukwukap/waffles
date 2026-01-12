"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { SplashScreen } from "../SplashScreen";

interface SplashContextValue {
    showSplash: boolean;
    hideSplash: () => void;
}

const SplashContext = createContext<SplashContextValue | null>(null);

export function useSplash() {
    const context = useContext(SplashContext);
    if (!context) {
        throw new Error("useSplash must be used within SplashProvider");
    }
    return context;
}

interface SplashProviderProps {
    children: ReactNode;
    duration?: number;
}

export function SplashProvider({ children, duration = 2000 }: SplashProviderProps) {
    const [showSplash, setShowSplash] = useState(true);

    const hideSplash = useCallback(() => {
        setShowSplash(false);
    }, []);

    return (
        <SplashContext.Provider value={{ showSplash, hideSplash }}>
            {showSplash && <SplashScreen duration={duration} onComplete={hideSplash} />}
            {children}
        </SplashContext.Provider>
    );
}
