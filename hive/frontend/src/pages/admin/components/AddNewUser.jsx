import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Modal from "@/components/ui/modal";
import Button from "@/components/ui/Button";
import Textinput from "@/components/ui/Textinput";
import Notification from "@/components/ui/Notification";
import { createUser } from "@/services";

const BUTTON_COLORS = {
  primary: { backgroundColor: "#DDF2FF", color: "#0A435B", border: "1px solid #00BFD8" },
};

const UserValidationSchema = yup
  .object({
    name: yup.string().required("Name is Required"),
    email: yup.string().email("Invalid email address").required("Email is Required"),
    password: yup.string().required("Password is Required").min(6, "Password must be at least 6 characters"),
    studentNumber: yup.string().required("Student Number is Required").matches(/^SE\/\d{4}\/\d{3}$/, 'Format must be SE/YYYY/NNN'),
  })
  .required();

const AddNewUserModel = ({ isOpen, closeModal, onUserAdded }) => {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(UserValidationSchema),
  });

  const handleUserSubmit = async (data) => {
    setLoading(true);
    try {
      await createUser(data);
      Notification.success("User created successfully!");
      reset();
      closeModal();
      onUserAdded(); // Callback to refresh the user list
    } catch (error) {
      Notification.error(error?.response?.data?.message || "User creation failed!");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    closeModal();
  };

  return (
    <Modal
      activeModal={isOpen}
      onClose={handleClose}
      title="Add New User"
      themeClass="bg-white"
    >
      <form onSubmit={handleSubmit(handleUserSubmit)} className="space-y-4">
        <Textinput
          name="name"
          label="Name"
          placeholder="Enter the Name"
          register={register}
          error={errors.name}
        />
        <Textinput
          name="email"
          label="Email"
          placeholder="Enter the Email"
          register={register}
          error={errors.email}
        />
        <Textinput
          name="password"
          label="Password"
          type="password"
          placeholder="Enter the Password"
          register={register}
          error={errors.password}
        />
        <Textinput
          name="studentNumber"
          label="Student Number"
          placeholder="SE/YYYY/NNN"
          register={register}
          error={errors.studentNumber}
        />
        <div className="flex justify-end gap-3 mt-6">
          <Button
            text="Cancel"
            className="btn-secondary"
            onClick={handleClose}
          />
          <Button
            text="+ Add User"
            className="rounded-md"
            style={BUTTON_COLORS.primary}
            type="submit"
            isLoading={loading}
          />
        </div>
      </form>
    </Modal>
  );
};

export default AddNewUserModel;
