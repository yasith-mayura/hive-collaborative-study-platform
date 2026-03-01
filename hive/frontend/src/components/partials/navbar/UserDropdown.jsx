import {  React } from "react";
import { useAuth } from "@/context/authContext";

import Dropdown from "@/components/ui/Dropdown";

const UserDropdown = ({ user }) => {
  const { logout } = useAuth();


  return (
    <div className=" flex gap-5 items-center">
      <div>
        <Dropdown
          label={
            <>
            <div
              className="flex items-center text-gray-700"
            >
              <span className="mr-3 overflow-hidden rounded-full h-10 w-10">
                <img
                  src="https://img.freepik.com/premium-photo/happy-man-ai-generated-portrait-user-profile_1119669-1.jpg"
                  alt="User"
                />
              </span>

              <div className="flex flex-col justify-center items-start">
                <span className="block mr-1 font-medium text-sm">
                  {" "}
                  {user.name}
                </span>
                <span className="block mr-1 font-medium text-xs">
                  {" "}
                  {user.role}
                </span>
              </div>
              {/* <svg
                className={`stroke-gray-500  transition-transform duration-200 `}
                width="18"
                height="20"
                viewBox="0 0 18 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg> */}
            </div>
            </>
          }
          labelClass="py-0 "
          classMenuItems="mt-2 w-[200px]"
          items={[
            {
              label: "Edit profile",
              link: "/profile",
              icon: "heroicons-outline:user-circle",
            },
            {
              label: "Account settings",
              link: "/locations/new",
              icon: "heroicons-outline:cog-6-tooth",
            },
            {
              label: "Support",
              link: "/users/new",
              icon: "heroicons-outline:information-circle",
            },
            {
              label: "Logout",
              link: "/login",
              icon: "heroicons-outline:login",
              action: logout,
            },
          ]}
        ></Dropdown>
      </div>
    </div>
  );
};

export default UserDropdown;
