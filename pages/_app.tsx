import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DiscoProvider } from "@/contexts/DiscoContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import SmoothScroll from "@/components/SmoothScroll";
import ScrollToTop from "@/components/ScrollToTop";
import "@/index.css";
import "@/pages/ccd.css";
import React from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ThemeProvider>
          <DiscoProvider>
            <SmoothScroll>
              <ScrollToTop />
              <Component {...pageProps} />
              <ThemeSwitcher />
            </SmoothScroll>
          </DiscoProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
