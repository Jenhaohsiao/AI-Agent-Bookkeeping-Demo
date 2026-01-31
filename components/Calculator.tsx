import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Copy, Calculator as CalcIcon, Check, Bot } from "lucide-react";

interface CalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Calculator: React.FC<CalculatorProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState("0");
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [isAiControlled, setIsAiControlled] = useState(false);

  // Dragging state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const calculatorRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  // Center calculator on first open
  useEffect(() => {
    if (isOpen && !initialized.current) {
      const calcWidth = 280;
      const calcHeight = 400;
      setPosition({
        x: (window.innerWidth - calcWidth) / 2,
        y: (window.innerHeight - calcHeight) / 2,
      });
      initialized.current = true;
    }
  }, [isOpen]);

  // Handle mouse events for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      // Keep within viewport bounds
      const maxX = window.innerWidth - 280;
      const maxY = window.innerHeight - 100;
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Handle touch events for mobile dragging
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      const newX = touch.clientX - dragOffset.x;
      const newY = touch.clientY - dragOffset.y;
      const maxX = window.innerWidth - 280;
      const maxY = window.innerHeight - 100;
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, dragOffset]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragOffset({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  };

  // Calculator logic
  const inputDigit = useCallback(
    (digit: string) => {
      setDisplay((prev) => {
        if (waitingForOperand) {
          setWaitingForOperand(false);
          return digit;
        }
        return prev === "0" ? digit : prev + digit;
      });
    },
    [waitingForOperand],
  );

  const inputDecimal = useCallback(() => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }
    setDisplay((prev) => (prev.includes(".") ? prev : prev + "."));
  }, [waitingForOperand]);

  const clearAll = useCallback(() => {
    setDisplay("0");
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  }, []);

  const clearEntry = useCallback(() => {
    setDisplay("0");
  }, []);

  const toggleSign = useCallback(() => {
    setDisplay((prev) => String(parseFloat(prev) * -1));
  }, []);

  const inputPercent = useCallback(() => {
    setDisplay((prev) => String(parseFloat(prev) / 100));
  }, []);

  const performOperation = useCallback(
    (nextOperator: string) => {
      setDisplay((currentDisplay) => {
        const inputValue = parseFloat(currentDisplay);

        setPrevValue((prev) => {
          if (prev === null) {
            return inputValue;
          } else if (operator) {
            let result = 0;
            switch (operator) {
              case "+":
                result = prev + inputValue;
                break;
              case "-":
                result = prev - inputValue;
                break;
              case "×":
                result = prev * inputValue;
                break;
              case "÷":
                result = inputValue !== 0 ? prev / inputValue : 0;
                break;
            }
            setDisplay(String(result));
            return result;
          }
          return prev;
        });

        setWaitingForOperand(true);
        setOperator(nextOperator);
        return currentDisplay;
      });
    },
    [operator],
  );

  const calculate = useCallback(() => {
    if (operator === null || prevValue === null) return;

    setDisplay((currentDisplay) => {
      const inputValue = parseFloat(currentDisplay);
      let result = 0;

      switch (operator) {
        case "+":
          result = prevValue + inputValue;
          break;
        case "-":
          result = prevValue - inputValue;
          break;
        case "×":
          result = prevValue * inputValue;
          break;
        case "÷":
          result = inputValue !== 0 ? prevValue / inputValue : 0;
          break;
      }

      setPrevValue(null);
      setOperator(null);
      setWaitingForOperand(true);
      return String(result);
    });
  }, [operator, prevValue]);

  // Button press simulation for AI - uses refs to avoid closure issues
  const displayRef = useRef(display);
  const prevValueRef = useRef(prevValue);
  const operatorRef = useRef(operator);
  const waitingRef = useRef(waitingForOperand);

  // Keep refs in sync
  useEffect(() => {
    displayRef.current = display;
    prevValueRef.current = prevValue;
    operatorRef.current = operator;
    waitingRef.current = waitingForOperand;
  }, [display, prevValue, operator, waitingForOperand]);

  const simulateButtonPress = useCallback((label: string): Promise<void> => {
    return new Promise((resolve) => {
      setActiveButton(label);
      setTimeout(() => {
        // Execute the button action based on label
        if (label === "C") {
          setDisplay("0");
          setPrevValue(null);
          setOperator(null);
          setWaitingForOperand(false);
        } else if (label === "CE") {
          setDisplay("0");
        } else if (label === "%") {
          setDisplay((prev) => String(parseFloat(prev) / 100));
        } else if (label === "±") {
          setDisplay((prev) => String(parseFloat(prev) * -1));
        } else if (label === ".") {
          if (waitingRef.current) {
            setDisplay("0.");
            setWaitingForOperand(false);
          } else {
            setDisplay((prev) => (prev.includes(".") ? prev : prev + "."));
          }
        } else if (/[0-9]/.test(label)) {
          if (waitingRef.current) {
            setDisplay(label);
            setWaitingForOperand(false);
          } else {
            setDisplay((prev) => (prev === "0" ? label : prev + label));
          }
        } else if (["+", "-", "×", "÷"].includes(label)) {
          const inputValue = parseFloat(displayRef.current);
          if (prevValueRef.current === null) {
            setPrevValue(inputValue);
          } else if (operatorRef.current) {
            let result = prevValueRef.current;
            const prev = prevValueRef.current;
            switch (operatorRef.current) {
              case "+":
                result = prev + inputValue;
                break;
              case "-":
                result = prev - inputValue;
                break;
              case "×":
                result = prev * inputValue;
                break;
              case "÷":
                result = inputValue !== 0 ? prev / inputValue : 0;
                break;
            }
            setDisplay(String(result));
            setPrevValue(result);
          }
          setOperator(label);
          setWaitingForOperand(true);
        } else if (label === "=") {
          if (operatorRef.current !== null && prevValueRef.current !== null) {
            const inputValue = parseFloat(displayRef.current);
            const prev = prevValueRef.current;
            let result = 0;
            switch (operatorRef.current) {
              case "+":
                result = prev + inputValue;
                break;
              case "-":
                result = prev - inputValue;
                break;
              case "×":
                result = prev * inputValue;
                break;
              case "÷":
                result = inputValue !== 0 ? prev / inputValue : 0;
                break;
            }
            setDisplay(String(result));
            setPrevValue(null);
            setOperator(null);
            setWaitingForOperand(true);
          }
        }

        setTimeout(() => {
          setActiveButton(null);
          resolve();
        }, 150);
      }, 100);
    });
  }, []);

  // Keyboard support
  useEffect(() => {
    if (!isOpen || isAiControlled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere if user is typing in an input field
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key;

      // Number keys
      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        setActiveButton(key);
        inputDigit(key);
        setTimeout(() => setActiveButton(null), 100);
        return;
      }

      // Operators
      if (key === "+") {
        e.preventDefault();
        setActiveButton("+");
        performOperation("+");
        setTimeout(() => setActiveButton(null), 100);
        return;
      }
      if (key === "-") {
        e.preventDefault();
        setActiveButton("-");
        performOperation("-");
        setTimeout(() => setActiveButton(null), 100);
        return;
      }
      if (key === "*") {
        e.preventDefault();
        setActiveButton("×");
        performOperation("×");
        setTimeout(() => setActiveButton(null), 100);
        return;
      }
      if (key === "/") {
        e.preventDefault();
        setActiveButton("÷");
        performOperation("÷");
        setTimeout(() => setActiveButton(null), 100);
        return;
      }

      // Decimal point
      if (key === "." || key === ",") {
        e.preventDefault();
        setActiveButton(".");
        inputDecimal();
        setTimeout(() => setActiveButton(null), 100);
        return;
      }

      // Enter or = for calculate
      if (key === "Enter" || key === "=") {
        e.preventDefault();
        setActiveButton("=");
        calculate();
        setTimeout(() => setActiveButton(null), 100);
        return;
      }

      // Escape to close
      if (key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      // Backspace for clear entry
      if (key === "Backspace") {
        e.preventDefault();
        setActiveButton("CE");
        clearEntry();
        setTimeout(() => setActiveButton(null), 100);
        return;
      }

      // Delete for clear all
      if (key === "Delete") {
        e.preventDefault();
        setActiveButton("C");
        clearAll();
        setTimeout(() => setActiveButton(null), 100);
        return;
      }

      // Percent
      if (key === "%") {
        e.preventDefault();
        setActiveButton("%");
        inputPercent();
        setTimeout(() => setActiveButton(null), 100);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    isOpen,
    isAiControlled,
    inputDigit,
    inputDecimal,
    performOperation,
    calculate,
    clearEntry,
    clearAll,
    inputPercent,
    onClose,
  ]);

  // Listen for AI calculation requests
  useEffect(() => {
    const handleAiCalculate = async (e: CustomEvent) => {
      const { expression, requestId } = e.detail;
      setIsAiControlled(true);

      // Clear first
      await simulateButtonPress("C");

      // Parse and execute the expression
      // Convert expression like "1+22" into button presses
      const tokens = expression.match(/(\d+\.?\d*|[+\-×÷*/])/g) || [];

      for (const token of tokens) {
        if (/^\d+\.?\d*$/.test(token)) {
          // It's a number, press each digit
          for (const digit of token) {
            await simulateButtonPress(digit);
          }
        } else {
          // It's an operator
          let op = token;
          if (token === "*") op = "×";
          if (token === "/") op = "÷";
          await simulateButtonPress(op);
        }
      }

      // Press equals
      await simulateButtonPress("=");

      // Wait a moment for state to update, then send result back using ref
      setTimeout(() => {
        const result = displayRef.current;
        window.dispatchEvent(
          new CustomEvent("ai-calculator-result", {
            detail: { result, requestId },
          }),
        );
        setIsAiControlled(false);
      }, 300);
    };

    window.addEventListener("ai-calculate", handleAiCalculate as EventListener);
    return () => {
      window.removeEventListener(
        "ai-calculate",
        handleAiCalculate as EventListener,
      );
    };
  }, [simulateButtonPress]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(display);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Format display for readability
  const formatDisplay = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    if (value.endsWith(".")) return value;
    if (value.includes(".") && value.split(".")[1]?.length > 8) {
      return num.toFixed(8);
    }
    return value;
  };

  if (!isOpen) return null;

  const buttons = [
    {
      label: "C",
      action: clearAll,
      className: "bg-gray-200 text-gray-700 hover:bg-gray-300",
    },
    {
      label: "CE",
      action: clearEntry,
      className: "bg-gray-200 text-gray-700 hover:bg-gray-300",
    },
    {
      label: "%",
      action: inputPercent,
      className: "bg-gray-200 text-gray-700 hover:bg-gray-300",
    },
    {
      label: "÷",
      action: () => performOperation("÷"),
      className: "bg-amber-400 text-white hover:bg-amber-500",
    },

    {
      label: "7",
      action: () => inputDigit("7"),
      className: "bg-white hover:bg-gray-100",
    },
    {
      label: "8",
      action: () => inputDigit("8"),
      className: "bg-white hover:bg-gray-100",
    },
    {
      label: "9",
      action: () => inputDigit("9"),
      className: "bg-white hover:bg-gray-100",
    },
    {
      label: "×",
      action: () => performOperation("×"),
      className: "bg-amber-400 text-white hover:bg-amber-500",
    },

    {
      label: "4",
      action: () => inputDigit("4"),
      className: "bg-white hover:bg-gray-100",
    },
    {
      label: "5",
      action: () => inputDigit("5"),
      className: "bg-white hover:bg-gray-100",
    },
    {
      label: "6",
      action: () => inputDigit("6"),
      className: "bg-white hover:bg-gray-100",
    },
    {
      label: "-",
      action: () => performOperation("-"),
      className: "bg-amber-400 text-white hover:bg-amber-500",
    },

    {
      label: "1",
      action: () => inputDigit("1"),
      className: "bg-white hover:bg-gray-100",
    },
    {
      label: "2",
      action: () => inputDigit("2"),
      className: "bg-white hover:bg-gray-100",
    },
    {
      label: "3",
      action: () => inputDigit("3"),
      className: "bg-white hover:bg-gray-100",
    },
    {
      label: "+",
      action: () => performOperation("+"),
      className: "bg-amber-400 text-white hover:bg-amber-500",
    },

    { label: "±", action: toggleSign, className: "bg-white hover:bg-gray-100" },
    {
      label: "0",
      action: () => inputDigit("0"),
      className: "bg-white hover:bg-gray-100",
    },
    {
      label: ".",
      action: inputDecimal,
      className: "bg-white hover:bg-gray-100",
    },
    {
      label: "=",
      action: calculate,
      className:
        "bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600",
    },
  ];

  return (
    <div
      ref={calculatorRef}
      className="fixed z-50 print:hidden"
      style={{
        left: position.x,
        top: position.y,
      }}
      tabIndex={0}
      onFocus={() => {}}
    >
      <div
        className={`w-[280px] bg-white rounded-2xl shadow-2xl border overflow-hidden transition-all ${isAiControlled ? "border-amber-400 ring-2 ring-amber-200" : "border-gray-200"}`}
      >
        {/* Header - Draggable */}
        <div
          className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 p-3 cursor-move flex items-center justify-between select-none"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="flex items-center gap-2">
            {isAiControlled ? (
              <Bot size={18} className="text-white animate-pulse" />
            ) : (
              <CalcIcon size={18} className="text-white" />
            )}
            <span className="text-white font-semibold text-sm">
              {isAiControlled ? "AI Calculating..." : "Calculator"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            title="Close"
          >
            <X size={16} className="text-white" />
          </button>
        </div>

        {/* Display */}
        <div
          className={`p-3 border-b transition-colors ${isAiControlled ? "bg-amber-50 border-amber-100" : "bg-gray-50 border-gray-100"}`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 text-right text-3xl font-bold text-gray-800 overflow-hidden">
              <input
                type="text"
                readOnly
                value={formatDisplay(display)}
                data-calc-display
                className="w-full text-right bg-transparent outline-none cursor-text select-all"
                onClick={(e) => (e.target as HTMLInputElement).select()}
                onKeyDown={(e) => {
                  // Allow copy shortcuts but prevent other keys from interfering
                  if (e.ctrlKey || e.metaKey) return;
                  e.preventDefault();
                }}
              />
            </div>
            <button
              onClick={copyToClipboard}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                copied
                  ? "bg-green-100 text-green-600"
                  : "bg-gray-100 text-gray-500 hover:bg-amber-100 hover:text-amber-600"
              }`}
              title="Copy to clipboard (Ctrl+C)"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
          {operator && (
            <div className="text-right text-xs text-gray-400 mt-1">
              {prevValue} {operator}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="p-2 grid grid-cols-4 gap-1.5">
          {buttons.map((btn, index) => (
            <button
              key={index}
              onClick={btn.action}
              disabled={isAiControlled}
              className={`h-12 rounded-xl font-semibold text-lg transition-all shadow-sm active:scale-95 ${btn.className} ${
                activeButton === btn.label
                  ? "ring-2 ring-amber-500 scale-95 brightness-110"
                  : ""
              } ${isAiControlled ? "cursor-not-allowed" : ""}`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div className="px-3 pb-2 text-center text-[10px] text-gray-400 select-none">
          {isAiControlled
            ? "AI is using the calculator"
            : "Keyboard: 0-9 +-*/ Enter=計算 Esc=關閉"}
        </div>
      </div>
    </div>
  );
};
