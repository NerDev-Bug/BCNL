import React from "react";

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const renderPageNumbers = () => {
    const delta = 2; // how many pages to show around current
    const pages = [];

    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);

    // Always show first page
    pages.push(1);

    // Left ellipsis
    if (start > 2) {
      pages.push("left-ellipsis");
    }

    // Middle pages
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Right ellipsis
    if (end < totalPages - 1) {
      pages.push("right-ellipsis");
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages.map((item) => {
      if (typeof item === "string") {
        return (
          <span
            key={item}
            className="px-3 py-1 mx-1 text-gray-500"
          >
            …
          </span>
        );
      }

      return (
        <button
          key={item}
          onClick={() => onPageChange(item)}
          className={`px-2 py-1 sm:px-3 sm:py-1 rounded-md text-xs sm:text-sm font-medium ${
            item === currentPage
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {item}
        </button>
      );
    });
  };


  return (
    <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 mt-4">
      <button
        onClick={handlePrev}
        disabled={currentPage === 1}
        className="px-2 py-1.5 sm:px-3 sm:py-1 rounded-md text-xs sm:text-sm bg-gray-200 text-gray-700 disabled:opacity-50"
      >
        Prev
      </button>

      {renderPageNumbers()}

      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="px-2 py-1.5 sm:px-3 sm:py-1 rounded-md text-xs sm:text-sm bg-gray-200 text-gray-700 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}

export default Pagination;
