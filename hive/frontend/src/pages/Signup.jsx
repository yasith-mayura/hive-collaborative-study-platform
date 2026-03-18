import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { useAuth } from "@/context/AuthContext";

import Notification from "@/components/ui/Notification";
import Textinput from "@/components/ui/Textinput";
import Button from "@/components/ui/Button";

const SignupValidationSchema = yup
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

function Signup() {
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm({
    resolver: yupResolver(SignupValidationSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      studentNumber: "",
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await signup({
        name: data.name,
        email: data.email,
        password: data.password,
        studentNumber: data.studentNumber,
      });

      Notification.success("Account created successfully!");
      navigate("/");
    } catch (error) {
      Notification.error(error?.message || "Signup failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-gray-100  min-h-screen">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto p-6">
        <div className="bg-white  shadow-lg rounded-lg p-8">
          <div className="mb-6 mt-4 text-center">
            <h1 className="text-2xl font-semibold text-gray-800 ">Welcome !</h1>
            <p className="text-sm text-gray-500 ">
              Enter your credentials to sign up for an account.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Textinput
                name="name"
                label="Name"
                type="text"
                placeholder="Enter your name"
                register={register}
                error={errors.name}
              />
            </div>
            <div>
              <Textinput
                name="email"
                label="Email"
                type="email"
                placeholder="Enter the Email Name"
                register={register}
                error={errors.email}
              />
            </div>

            {/* Password Field */}
            <div>
              <Textinput
                name="password"
                label="password"
                type="password"
                register={register}
                error={errors.password}
                hasicon
                placeholder="Enter the password"
              />
            </div>
            <div>
              <Textinput
                name="studentNumber"
                label="Student Number"
                type="text"
                placeholder="Enter your student number"
                register={register}
                error={errors.studentNumber}
              />
            </div>

            <Button
              type="submit"
              text="Sign Up"
              className="btn btn-primary block w-full text-center"
              isLoading={loading}
            />
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-500 hover:underline">
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Signup;
