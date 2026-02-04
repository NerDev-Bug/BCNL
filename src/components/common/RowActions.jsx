import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Check, Trash2 } from "lucide-react";

export function RowActions({
  onAccept,
  onDelete,
  acceptLabel = "Accept" // Default label
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const handleAccept = () => {
    onAccept?.();
    setIsOpen(false);
  };

  const handleDelete = () => {
    onDelete?.();
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = event => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center pl-2 text-gray-400 hover:text-gray-600"
      >
        <MoreHorizontal className="h-5 w-5 cursor-pointer" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          {onAccept && (
            <button
              onClick={handleAccept}
              className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50"
            >
              <Check className="h-4 w-4" />
              {acceptLabel}
            </button>
          )}
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 border-t border-gray-200"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
