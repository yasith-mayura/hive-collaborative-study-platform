import React, { useState, useEffect } from "react";

const RateComponent = ({ defaultValue = 0, disabled, onChange }) => {
  const [rating, setRating] = useState(defaultValue);
  const [hover, setHover] = useState(null);
  const totalStars = 5;

  useEffect(() => {
    setRating(defaultValue);
  }, [defaultValue]);

  const handleRating = (currentRating) => {
    if (!disabled) {
      setRating(currentRating);
      if (onChange) {
        onChange(currentRating);
      }
    }
  };

  const getStarClass = (index) => {
    if (hover) {
      if (hover >= index + 1) {
        return "text-yellow-400";
      } else if (hover > index && hover < index + 1) {
        return "half-star";
      } else {
        return "text-gray-300";
      }
    } else {
      if (rating >= index + 1) {
        return "text-yellow-400";
      } else if (rating > index && rating < index + 1) {
        return "half-star";
      } else {
        return "text-gray-300";
      }
    }
  };

  return (
    <div className="flex">
      {[...Array(totalStars)].map((star, index) => {
        const currentRating = index + 1;

        return (
          <label
            key={index}
            className={`${disabled ? "cursor-default" : "cursor-pointer"}`}
          >
            <input
              type="radio"
              name="rating"
              value={currentRating}
              onChange={() => handleRating(currentRating)}
              className="hidden"
              disabled={disabled}
            />
            <span
              className={`star text-2xl mx-1 ${getStarClass(index)}`}
              onMouseEnter={() => !disabled && setHover(currentRating)}
              onMouseLeave={() => !disabled && setHover(null)}
              onClick={() => handleRating(currentRating)}
            >
              &#9733;
            </span>
          </label>
        );
      })}
      <style jsx="true">{`
        .half-star::before {
          content: "\\2605";
          position: absolute;
          width: 50%;
          overflow: hidden;
          color: #ffc107;
        }
        .half-star {
          position: relative;
          display: inline-block;
          color: #e4e5e9;
        }
      `}</style>
    </div>
  );
};

export default RateComponent;
