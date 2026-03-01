import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { menuItems, settingMenuItems } from "@/constant/data";
import Notification from "@/components/partials/header/Tools/Notification";
import { useTopbarPlaceholder } from "@/hooks/useTopbarPlaceholder";
import Dropdown from "@/components/ui/Dropdown";
import Button from "@/components/ui/Button";

import useWidth from "@/hooks/useWidth";
import Profile from "../partials/header/Tools/Profile";

const Breadcrumbs = ({ subscriptionData }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationName = location.pathname.replace("/", "");

  const { width, breakpoints } = useWidth();
  const [isHide, setIsHide] = useState(null);
  const [groupTitle, setGroupTitle] = useState("");
  const [title, setTitle] = useState("");

  const [placeholderContent, setPlaceholderContent] = useState(
    useTopbarPlaceholder.getContent()
  );

  useEffect(() => {
    const unsubscribe = useTopbarPlaceholder.subscribe(setPlaceholderContent);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const currentMenuItem = menuItems.find((item) =>
      locationName.startsWith(item.link)
    );

    const currentChild = menuItems.find((item) =>
      item.child?.find((child) => locationName.startsWith(item.link))
    );
    const subURL = menuItems.find((item) =>
      item.sub?.find((child) => locationName.startsWith(child.link))
    );

    const currentSetting = settingMenuItems.find((item) =>
      location.pathname.startsWith(item.link)
    );

    if (currentSetting && !currentSetting.isHeadr) {
      setGroupTitle("Settings");
      setTitle(currentSetting.title);
      return;
    }

    if (currentMenuItem) {
      setIsHide(currentMenuItem.isHide);
      setTitle(currentMenuItem.title);
      setGroupTitle(currentMenuItem.group);
      if (subURL) {
        const matchedSub = subURL.sub?.find(
          (child) => child.link === locationName
        );
        if (matchedSub) {
          setIsHide(matchedSub.isHide);
          setTitle(matchedSub.title);
          setGroupTitle(subURL.group);
        }
      }
    } else if (currentChild) {
      setIsHide(currentChild?.isHide || false);
      setGroupTitle(currentChild?.group);
      setTitle(currentChild?.title);
    } else {
      if (locationName.indexOf("jobs/") !== -1) {
        //edit jobs link
        setGroupTitle("Manage");
        setTitle("Jobs");
      }
      if (locationName.indexOf("client/") !== -1) {
        //edit jobs link
        setGroupTitle("Manage");
        setTitle("Client");
      }
      if (locationName.indexOf("setting/profile") !== -1) {
        //edit jobs link
        setGroupTitle("Manage");
        setTitle("Profile");
      }
      if (locationName.indexOf("applicants/invite") !== -1) {
        //edit jobs link
        setGroupTitle("Manage");
        setTitle("invite");
      }
      if (locationName.indexOf("employer/") !== -1 || locationName.indexOf("employees/") !== -1) {
        setGroupTitle("");
        setTitle("Employees");
      }
      if (locationName.indexOf("departments/") !== -1) {
        setGroupTitle("");
        setTitle("Departments");
      }
      if (locationName.indexOf("locations/") !== -1) {
        setGroupTitle("");
        setTitle("Locations");
      }
    }
  }, [location, locationName]);

  const renderSubscriptionInfo = () => {
    if (!subscriptionData) return null;
    if (subscriptionData.trial?.enable) {
      if (subscriptionData.trial?.expired) {
        return (
          <a
            className="btn animated-gradient-danger transition-transform duration-300 transform px-2 py-1 rounded-md text-sm font-semibold text-white"
            href="/setting/payments"
          >
            Trial Expired
          </a>
        );
      } else {
        if (subscriptionData.trial?.expireDays < 3) {
          return (
            <a
              className="btn animated-gradient-warning transition-transform duration-300 transform px-2 py-1 rounded-md text-sm font-semibold text-white"
              href="/setting/payments"
            >
              Trial : {subscriptionData.trial.expireDays} days left
            </a>
          );
        } else {
          return (
            <a
              className="btn animated-gradient-info transition-transform duration-300 transform px-2 py-1 rounded-md text-sm font-semibold text-white"
              href="/setting/payments"
            >
              Trial : {subscriptionData.trial.expireDays} days left
            </a>
          );
        }
      }
    } else {
      return (
        <a
          className="btn animated-gradient-success transition-transform duration-300 transform px-2 py-1 rounded-md text-sm font-semibold text-white"
          href="/setting/payments"
        >
          {subscriptionData.package.name}
        </a>
      );
    }
  };

  return (
    <>
      {!isHide ? (
        <div className="grid grid-cols-6 gap-2">
          <div className="col-start-1 col-end-3">
            {groupTitle ? (
              <div className="card-title custom-class font-medium">
                {groupTitle} / <span className="text-md">{title}</span>
              </div>
            ) : (
              <div className="card-title custom-class font-medium">{title}</div>
            )}
          </div>
          <div className="col-end-7 col-span-3 flex flex-wrap justify-end gap-4 items-center">
            {/*placeholderContent*/}
            <Button
              text="HR Co-Pilot"
              className="btn btn-sm inline-flex justify-center btn-light light text-blue-700 font-normal py-35rem"
              icon="heroicons-outline:sparkles"
              iconPosition="left"
              iconClass="text-lg animate-ai-text-color-cycle transition-colors duration-300"
              onClick={() => navigate("/ai-copilot")}
            />

            <div>
              <Dropdown
                label={
                  <Button
                    div
                    text="New"
                    className="btn btn-sm btn-outline-primary font-normal py-35rem"
                    icon="heroicons-outline:plus-circle"
                    iconPosition="left"
                    iconClass="text-lg"
                  />
                }
                items={[
                  {
                    label: "New Job Opening",
                    link: "/jobs/new",
                    icon: "heroicons-outline:briefcase",
                  },
                  {
                    label: "New Candidate",
                    link: "/applicants/invite",
                    icon: "heroicons-outline:academic-cap",
                  },
                  {
                    label: "New Employee",
                    link: "/employer/new",
                    icon: "heroicons-outline:user-plus",
                  },
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
                ]}
              ></Dropdown>
            </div>
            {renderSubscriptionInfo()}
            {width >= breakpoints.md && <Notification />}
            {width >= breakpoints.md && <Profile />}
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Breadcrumbs;
