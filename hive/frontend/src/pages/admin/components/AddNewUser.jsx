import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { useAuth } from "@/context/authContext";
import Modal from "@/components/ui/modal";

import Button from "@/components/ui/Button";
import Textinput from "@/components/ui/Textinput";
import Notification from "@/components/ui/Notification";
import { createUser } from "@/services";

const AdminValidationSchema = yup
  .object({
    name: yup.string().required("Name is Required"),
    email: yup
      .string()
      .email("Invalid email address")
      .required("email is Required"),
    password: yup.string().required("password is Required"),
    studentNumber: yup.string().required("Student Number is Required"),
  })
  .required();

const AddNewUserModel = ({ isOpen, closeModal }) => {
  const [loading, setLoading] = useState(false);
  const { authData } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm({
    resolver: yupResolver(AdminValidationSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      studentNumber: "",
    },
  });

  const handleUserSubmit = async (data) => {
    setLoading(true);
    try {
      await createUser({
        name: data.name,
        email: data.email,
        password: data.password,
        studentNumber: data.studentNumber,
      });

      Notification.success("User created successfully!");
      reset({
        name: "",
        email: "",
        password: "",
        studentNumber: "",
      });
      closeModal();
      navigate("/admin/users");
    } catch (error) {
      Notification.error(error?.message || "User creation failed!");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset({
      name: "",
      email: "",
      password: "",
      studentNumber: "",
    });
    closeModal();
  };

  return (
    <>
      <Modal
        activeModal={isOpen}
        onClose={handleClose}
        title="Add New User"
        themeClass="bg-white"
        mainYPadding="py-0"
      >
        <div className="max-w-[550px] mx-auto bg-white rounded-lg p-6">
          <form
            className="bg-white p-2 rounded-sm"
            onSubmit={handleSubmit(handleUserSubmit)}
          >
            <div className="">
              {/* Name */}
              <div>
                <Textinput
                  name="name"
                  label="Name"
                  placeholder="Enter the Name"
                  register={register}
                  error={errors.name}
                />
              </div>

              {/* Email */}
              <div>
                <Textinput
                  name="email"
                  label="Email"
                  placeholder="Enter the Email"
                  register={register}
                  error={errors.email}
                />
              </div>

              {/* Password */}
              <div>
                <Textinput
                  name="password"
                  label="Password"
                  placeholder="Enter the Password"
                  register={register}
                  error={errors.password}
                />
              </div>

              {/* Student Number */}
              <div>
                <Textinput
                  name="studentNumber"
                  label="Student Number"
                  placeholder="Enter the Student Number"
                  register={register}
                  error={errors.studentNumber}
                />
              </div>

              <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                <Button
                  text="+ Add User"
                  className="btn-primary btn-sm"
                  type="submit"
                  isLoading={loading}
                />
              </div>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
};

export default AddNewUserModel;
