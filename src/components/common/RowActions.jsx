import { Check, Trash2 } from "lucide-react";

export function RowActions({
  onAccept,
  onDelete,
  acceptLabel = "Accept", // Default label
}) {
  const handleAccept = () => {
    onAccept?.();
  };

  const handleDelete = () => {
    onDelete?.();
  };

  return (
    <div className="flex flex-col items-end gap-1 min-w-[100px]">
      {onAccept && (
        <button
          type="button"
          onClick={handleAccept}
          className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-medium text-white bg-green-600 rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 w-full justify-center"
        >
          <Check className="h-3 w-3" />
          {acceptLabel}
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={handleDelete}
          className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-medium text-red-600 bg-red-50 rounded-full hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 w-full justify-center"
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </button>
      )}
    </div>
  );
}
