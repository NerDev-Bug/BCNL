import { useState } from "react";

/**
 * StarRating Component
 * Displays interactive or read-only star ratings with theme colors
 * @param {number} rating - Current rating (0-5)
 * @param {function} onRatingChange - Callback when rating changes (for interactive mode)
 * @param {boolean} interactive - Whether stars are clickable
 * @param {string} size - Size of stars: 'sm', 'md', 'lg'
 * @param {string} color - Theme color: 'primary' (#7B2220) or 'secondary' (#502455)
 */
export default function StarRating({ 
  rating = 0, 
  onRatingChange, 
  interactive = false,
  size = 'sm',
  color = 'primary'
}) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'w-4 h-4',      // 12px
    md: 'w-5 h-5',      // 16px
    lg: 'w-6 h-6'       // 20px
  };

  const colorClasses = {
    primary: {
      filled: 'text-[#7B2220]',
      empty: 'text-gray-300',
      hover: 'text-[#7B2220]/70'
    },
    secondary: {
      filled: 'text-[#502455]',
      empty: 'text-gray-300',
      hover: 'text-[#502455]/70'
    }
  };

  const colors = colorClasses[color] || colorClasses.primary;
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  const handleClick = (value) => {
    if (interactive && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value) => {
    if (interactive) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= displayRating;
        const isHovered = interactive && hoverRating >= star;
        
        return (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
            disabled={!interactive}
            className={`
              ${sizeClass}
              ${interactive ? 'cursor-pointer transition-all hover:scale-110' : 'cursor-default'}
              ${isFilled ? colors.filled : colors.empty}
              ${isHovered ? colors.hover : ''}
              ${!interactive ? 'pointer-events-none' : ''}
              flex-shrink-0
            `}
            aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={isFilled ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={isFilled ? 0 : 1.5}
              className="w-full h-full"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
