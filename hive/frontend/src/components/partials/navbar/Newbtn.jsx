import React from "react";

import Dropdown from "@/components/ui/Dropdown";
import Button from "@/components/ui/Button";

const NewBtn = () => {
  return (
    <div>
      <Dropdown
        label={
          <Button
            text="New"
            className="btn btn-sm btn-outline-primary font-normal "
            icon="heroicons-outline:plus-circle"
            iconPosition="left"
            iconClass="text-lg"
          />
        }
        labelClass="py-0"
        classMenuItems="mt-2 w-[200px]"
        items={[
          {
            label: "New Department",
            link: "/departments/new",
            icon: "heroicons-outline:building-office",
          },
          {
            label: "New Location",
            link: "/locations/new",
            icon: "heroicons-outline:map-pin",
          },
          {
            label: "New User",
            link: "/users/new",
            icon: "heroicons-outline:user-plus",
          },
        ]}
      ></Dropdown>
    </div>
  );
};

export default NewBtn;
