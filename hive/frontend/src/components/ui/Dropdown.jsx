import {
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
  Transition,
} from "@headlessui/react";
import { Fragment, useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import Icon from "@/components/ui/Icon";

const Dropdown = ({
  label = "Dropdown",
  wrapperClass = "inline-block",
  labelClass = "label-class-custom",
  children,
  classMenuItems = "mt-2 w-[220px]",
  items = [
    {
      label: "Action",
      link: "#",
    },
    {
      label: "Another action",
      link: "#",
    },
    {
      label: "Something else here",
      link: "#",
    },
  ],
  classItem = "px-4 py-2",
  className = "",
}) => {
  return (
    <div className={`${wrapperClass} `}>
      <Menu as="div" className={`relative block w-full ${className}`}>
        <MenuButton
          as="div"
          className="block w-full focus:outline-none focus:ring-0"
        >
          <div className={`${labelClass} focus:outline-none`}>{label}</div>
        </MenuButton>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <MenuItems
            className={`absolute origin-top-right right-0 border border-slate-100 
            rounded bg-white shadow-dropdown z-[9999]
            max-w-[calc(100vw-1rem)]
            ${classMenuItems} focus:outline-none focus:ring-0
            `}
          >
            <div>
              {children
                ? children
                : items?.map((item, index) => (
                  <MenuItem key={index}>
                    {({ active, close }) => (
                      <div
                        className={`${active
                            ? "bg-slate-100 text-slate-900 "
                            : "text-slate-600"
                          } block     ${item.hasDivider
                            ? "border-t border-slate-100"
                            : ""
                          }`}
                      >
                        {item.link ? (
                          <NavLink
                            to={item.link}
                            onClick={() => {
                              if (item.action) item.action();
                              close();
                            }}
                            className={`block focus:outline-none focus:ring-0 ${classItem}`}
                          >
                            {item.icon ? (
                              <div className="flex items-center">
                                <span className="block text-xl ltr:mr-3 rtl:ml-3">
                                  <Icon icon={item.icon} />
                                </span>
                                <span className="block text-sm">
                                  {item.label}
                                </span>
                              </div>
                            ) : (
                              <span className="block text-sm">
                                {item.label}
                              </span>
                            )}
                          </NavLink>
                        ) : (
                          <div
                            onClick={() => {
                              if (item.action) item.action();
                              close();
                            }}
                            className={`block cursor-pointer focus:outline-none focus:ring-0 ${classItem}`}
                          >
                            {item.icon ? (
                              <div className="flex items-center">
                                <span className="block text-xl ltr:mr-3 rtl:ml-3">
                                  <Icon icon={item.icon} />
                                </span>
                                <span className="block text-sm">
                                  {item.label}
                                </span>
                              </div>
                            ) : (
                              <span className="block text-sm">
                                {item.label}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </MenuItem>
                ))}
            </div>
          </MenuItems>
        </Transition>
      </Menu>
    </div>
  );
};

export default Dropdown;
