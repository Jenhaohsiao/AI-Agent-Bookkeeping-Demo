import React, { useState, useRef, useEffect, useCallback } from "react";
import { LeftPanel } from "./components/LeftPanel";
import { RightPanel } from "./components/RightPanel";
import {
  Lock,
  Unlock,
  ArrowLeftToLine,
  ArrowRightToLine,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Breakpoint for responsive layout (md = 768px)
const MD_BREAKPOINT = 768;

// Configuration for split sizes
const DEFAULT_LEFT_PCT = 30; // Default Left Width % (Right is 70%)
const HOVER_LEFT_PCT = 70; // Left Width % when hovering Left

const App: React.FC = () => {
  // State
  const [leftWidth, setLeftWidth] = useState(HOVER_LEFT_PCT); // Start with Left panel larger
  const [isLocked, setIsLocked] = useState(true);
  const [maximized, setMaximized] = useState<"left" | "right" | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<"left" | "right">("left"); // Which panel to show on mobile

  // Refs for hover detection
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<number | null>(null);

  // Check screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MD_BREAKPOINT);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // -- Handlers --

  const handleMouseEnterLeft = () => {
    if (isLocked || maximized) return;
    // Debounce hover effect slightly to prevent jitter
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = window.setTimeout(() => {
      setLeftWidth(HOVER_LEFT_PCT);
    }, 100);
  };

  const handleMouseEnterRight = () => {
    if (isLocked || maximized) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = window.setTimeout(() => {
      setLeftWidth(DEFAULT_LEFT_PCT);
    }, 100);
  };

  const toggleLock = () => setIsLocked(!isLocked);

  const maximizeLeft = () => {
    setMaximized(maximized === "left" ? null : "left");
    // If un-maximizing, return to default state based on lock or default
    if (maximized === "left") setLeftWidth(DEFAULT_LEFT_PCT);
  };

  const maximizeRight = () => {
    setMaximized(maximized === "right" ? null : "right");
    if (maximized === "right") setLeftWidth(DEFAULT_LEFT_PCT);
  };

  const restoreView = () => {
    setMaximized(null);
    setLeftWidth(DEFAULT_LEFT_PCT);
  };

  // Calculate actual width based on state
  const getActiveLeftWidth = () => {
    if (maximized === "left") return 100;
    if (maximized === "right") return 0;
    return leftWidth;
  };

  const currentLeftWidth = getActiveLeftWidth();

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 p-4 md:p-8">
      {/* MacOS Window Frame */}
      <div className="relative w-full h-full max-w-7xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-300/50">
        {/* Fake Window Controls (Traffic Lights) */}
        <div className="h-8 bg-gray-100 border-b border-gray-200 flex items-center px-4 space-x-2 shrink-0 z-20 print:hidden">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
          <div className="ml-4 text-xs font-medium text-gray-500">
            My Ledger Agent
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        {isMobile && (
          <div className="flex bg-gray-100 border-b border-gray-200 print:hidden">
            <button
              onClick={() => setMobileView("left")}
              className={`flex-1 py-3 text-sm font-medium transition-all ${
                mobileView === "left"
                  ? "bg-white text-amber-600 shadow-sm"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              📊 記帳本
            </button>
            <button
              onClick={() => setMobileView("right")}
              className={`flex-1 py-3 text-sm font-medium transition-all ${
                mobileView === "right"
                  ? "bg-white text-amber-600 shadow-sm"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              🤖 AI 助理
            </button>
          </div>
        )}

        {/* Content Area */}
        <div
          ref={containerRef}
          className="flex-1 flex relative overflow-hidden"
        >
          {/* LEFT PANEL */}
          <div
            className={`h-full transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] overflow-hidden relative print:!w-full ${
              isMobile 
                ? mobileView === "left" ? "w-full" : "w-0"
                : ""
            }`}
            style={!isMobile ? { width: `${currentLeftWidth}%` } : undefined}
            onMouseEnter={handleMouseEnterLeft}
          >
            <div className="w-full h-full min-w-[320px]">
              {" "}
              {/* Min width ensures content doesn't squash too much */}
              <LeftPanel className="h-full" />
            </div>
          </div>

          {/* DIVIDER / CONTROLS (Central Pill) - Hidden on mobile */}
          {!isMobile && (
            <div
              className={`absolute top-0 bottom-0 z-30 flex items-center justify-center w-0 transition-all duration-500 print:hidden`}
              style={{
                left: `${currentLeftWidth}%`,
                opacity: maximized ? 0 : 1, // Hide central control when maximized
                pointerEvents: maximized ? "none" : "auto",
              }}
            >
              {/* Floating Control Pill */}
              <div className="bg-white/90 backdrop-blur shadow-lg border border-gray-200 rounded-full py-2 px-1 flex flex-col gap-2 transform -translate-x-1/2">
                <button
                  onClick={toggleLock}
                  className={`p-1.5 rounded-full hover:bg-gray-100 transition ${isLocked ? "text-red-500" : "text-gray-400"}`}
                  title={isLocked ? "Unlock View" : "Lock View"}
                >
                  {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                </button>

                <div className="w-4 h-px bg-gray-200 mx-auto"></div>

                <button
                  onClick={maximizeLeft}
                  className={`p-1.5 rounded-full hover:bg-gray-100 transition ${maximized === "left" ? "text-blue-600" : "text-gray-500"}`}
                  title="Full Screen Ledger"
                >
                  <ArrowRightToLine size={16} />
                </button>

                <button
                  onClick={maximizeRight}
                  className={`p-1.5 rounded-full hover:bg-gray-100 transition ${maximized === "right" ? "text-blue-600" : "text-gray-500"}`}
                  title="Full Screen Chat"
                >
                  <ArrowLeftToLine size={16} />
                </button>
              </div>
            </div>
          )}

          {/* RESTORE BUTTONS (Edge Overlays) - Hidden on mobile */}
          {!isMobile && maximized === "left" && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-40 animate-fade-in">
              <button
                onClick={restoreView}
                className="bg-white/90 backdrop-blur shadow-lg border border-gray-200 p-3 rounded-full text-gray-500 hover:text-blue-600 hover:scale-110 transition-all"
                title="Restore Chat View"
              >
                <ChevronLeft size={24} />
              </button>
            </div>
          )}

          {!isMobile && maximized === "right" && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-40 animate-fade-in">
              <button
                onClick={restoreView}
                className="bg-white/90 backdrop-blur shadow-lg border border-gray-200 p-3 rounded-full text-gray-500 hover:text-blue-600 hover:scale-110 transition-all"
                title="Restore Ledger View"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          )}

          {/* RIGHT PANEL */}
          <div
            className={`h-full transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] overflow-hidden bg-white relative print:hidden ${
              isMobile 
                ? mobileView === "right" ? "w-full" : "w-0"
                : ""
            }`}
            style={!isMobile ? { width: `${100 - currentLeftWidth}%` } : undefined}
            onMouseEnter={handleMouseEnterRight}
          >
            <div className="w-full h-full min-w-[320px]">
              <RightPanel className="h-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
