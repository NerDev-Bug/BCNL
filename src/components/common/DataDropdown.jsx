// src/components/common/DataDropdown.jsx
import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

function DataDropdown({ items = [] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // close dropdown kapag nag-click sa labas
  useEffect(() => {
    const handleClickOutside = e => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900"
      >
        <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
            open ? "rotate-180" : "rotate-0"
            }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="max-h-64 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                No items
              </div>
            ) : (
              items.map((item, idx) => (
                <div
                  key={idx}
                  className="px-4 py-3 border-b last:border-b-0 text-sm"
                >
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500">
                    Qty: {item.quantity}
                  </div>
                  <div className="text-xs text-gray-500">
                    €{Number(item.price).toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DataDropdown;
