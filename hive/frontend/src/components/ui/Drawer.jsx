import React, { Fragment, useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import Icon from "@/components/ui/Icon";

const Drawer = ({
  activeModal,
  onClose,
  noFade,
  disableBackdrop,
  children,
  footerContent,
  themeClass = "max-w-[90%]",
  title = "Basic Drawer",
  mainXPadding = "px-0",
  mainYPadding = "py-0",
  uncontrol,
  label = "Basic Drawer",
  labelClass,
  type,
  ref,
}) => {
  const [showModal, setShowModal] = useState(false);

  const closeModal = () => {
    setShowModal(false);
    if(onClose!=null) {
      onClose();
    }
  };

  return (
    <Transition appear show={activeModal} as={Fragment}>
      <Dialog 
        as="div"
        onClose={closeModal}
        className="relative z-[99999]">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className={`pointer-events-none fixed inset-y-0 right-0 flex ${themeClass}`}>
              <TransitionChild
                as={Fragment}
                enter="transform transition ease-in-out duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <DialogPanel className="pointer-events-auto relative bg-white shadow-xl">
                  <div className={`absolute top-0 left-0 -ml-8 flex pt-4 pr-2 sm:-ml-10 sm:pr-4`} >
                    <button
                      type="button"
                      onClick={() => closeModal(false)}
                      className="relative rounded-md text-gray-300 hover:text-white focus:ring-2 focus:ring-white focus:outline-hidden"
                    >
                      <span className="absolute -inset-2.5" />
                      <span className="sr-only">Close panel</span>
                      <Icon icon="heroicons-outline:x" />
                    </button>
                  </div>
                
                  <div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-xl">
                      <div className="px-4 sm:px-6 mb-4">
                        <DialogTitle className="text-lg font-semibold text-gray-900">{title}</DialogTitle>
                      </div>
                      <div className={`relative mt-6 flex-1 px-4 sm:px-6 ${mainXPadding} ${mainYPadding}`}>
                        {children}
                      </div>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
};

export default Drawer;