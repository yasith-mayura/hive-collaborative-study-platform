import {
  Dialog,
  DialogPanel,
} from "@headlessui/react";
import React, { useState } from "react";
import Icon from "@/components/ui/Icon";

const Modal = ({
  activeModal,
  onClose,
  disableBackdrop,
  className = "max-w-xl",
  children,
  footerContent,
  centered,
  scrollContent,
  themeClass = "bg-slate-900",
  title = "Basic Modal",
  mainXPadding = "px-6",
  mainYPadding = "py-8",
  footerXPadding = "px-4",
  footerYPadding = "py-3",
  type,
}) => {
  if (!activeModal) return null; // just don't render if not active

  return (
    <Dialog as="div" open={activeModal} className="relative z-[99999]" onClose={onClose}>
      {!disableBackdrop && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-filter backdrop-blur-sm" />
      )}

      <div className="fixed inset-0 overflow-y-auto">
        <div
          className={`flex min-h-full justify-center text-center p-6 ${
            centered ? "items-center" : "items-start"
          }`}
        >
          <DialogPanel
            className={`w-full transform overflow-hidden rounded-md bg-white  text-left align-middle shadow-xl ${className}`}
          >
            {type === "ai-skill" ? (
              <div className="flex w-full">
                <div className="w-[65%] bg-[#f1f5f9]">
                  <div className="py-6 px-5 text-secondary">
                    <h2 className="capitalize leading-6 tracking-normal font-medium text-base text-secondary">
                      {title}
                    </h2>
                  </div>
                </div>
                <div className="w-[35%] bg-[#E2E8F0] flex items-center justify-end">
                  <button onClick={onClose} className="text-[22px] mr-5">
                    <Icon icon="heroicons-outline:x" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`relative overflow-hidden py-4 px-5 text-secondary flex justify-between  ${themeClass}`}
              >
                <h2 className="capitalize leading-6 tracking-normal  font-medium text-base text-secondary">
                  {title}
                </h2>
                <button onClick={onClose} className="text-[22px]">
                  <Icon icon="heroicons-outline:x" />
                </button>
              </div>
            )}

            <div
              className={`${mainXPadding} ${mainYPadding} ${
                scrollContent ? "overflow-y-auto max-h-[400px]" : ""
              }`}
            >
              {children}
            </div>

            {footerContent && (
              <div
                className={`${footerXPadding} ${footerYPadding} flex justify-end space-x-3 border-t border-slate-100`}
              >
                {footerContent}
              </div>
            )}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};

export default Modal;
