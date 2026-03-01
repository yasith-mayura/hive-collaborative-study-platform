import React, { useState, Fragment } from "react";

const CurrencyInput = ({
  type,
  label,
  placeholder = "0.00",
  currencyPlaceholder = "",
  classLabel = "form-label",
  className = "",
  classGroup = "",
  register,
  name,
  currencyName,
  readonly,
  value,
  currencyValue,
  error,
  icon,
  disabled,
  id,
  currencyId,
  horizontal,
  validate,
  isMask,
  msgTooltip,
  description,
  hasicon,
  onChange,
  onCurrencyChange,
  options,
  onFocus,
  defaultValue,
  currencyDefaultValue,
  ...rest
}) => {
  const [open, setOpen] = useState(false);
  const handleOpen = () => {
    setOpen(!open);
  };

  options = options || Array(3).fill("option");

  return (
    <div
      className={`fromGroup  ${error ? "has-error" : ""}  ${horizontal ? "flex" : ""}  ${validate ? "is-valid" : ""} `}
    >
      {label && (
        <label
          htmlFor={id}
          className={`form-label block capitalize ${classLabel}  ${
            horizontal ? "flex-0 mr-6 md:w-[100px] w-[60px] break-words" : ""
          }`}
        >
          {label}
        </label>
      )}

      <div className={`flex items-center justify-center border rounded-md ${horizontal ? "flex-1" : ""}`}>
        <input
          id={id}
          type="number"
          {...register(name)}
          {...rest}
          className={`${
            error ? " has-error" : " "
          } rounded-md py-2 block w-[65%] px-2 border-none focus:outline ${className}  `}
          placeholder={placeholder}
          readOnly={readonly}
          defaultValue={defaultValue}
          disabled={disabled}
          onChange={onChange}
        />
        <div className="flex items-center justify-center w-[35%] relative">
          <select
            id={currencyId}
            {...register(currencyName)}
            {...rest}
            className={`${
              error ? "border-red-500" : "border-gray-300"
            } h-full w-full rounded-md bg-white py-2 text-sm text-gray-500 appearance-none focus:outline  ${className}`}
            readOnly={readonly}
            disabled={disabled}
            value={currencyValue}
            defaultValue={currencyDefaultValue}
            onChange={onCurrencyChange}
          >
            {options.map((option, i) => (
              <Fragment key={i}>
                {option.value && option.label ? (
                  <option key={i} value={option.value}>
                    {option.label}
                  </option>
                ) : (
                  <option key={i} value={option}>
                    {option}
                  </option>
                )}
              </Fragment>
            ))}
          </select>
          <div className="absolute inset-y-0 right-2 flex items-center justify-center pointer-events-none">
            <svg
              className="w-6 h-6 text-gray-300 border-l pl-1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>
      {/* error and success message*/}
      {error && (
        <div
          className={` mt-2 ${
            msgTooltip
              ? " inline-block bg-danger-500 text-white text-[10px] px-2 py-1 rounded"
              : " text-danger-500 block text-sm"
          }`}
        >
          {error.message}
        </div>
      )}
    </div>
  );
};

export default CurrencyInput;
