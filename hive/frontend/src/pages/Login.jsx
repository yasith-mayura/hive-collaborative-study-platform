import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { useAuth } from "@/context/AuthContext";
import Notification from "@/components/ui/Notification";

import Textinput from "@/components/ui/Textinput";
import Button from "@/components/ui/Button";

const LoginValidationSchema = yup
  .object({
    email: yup
      .string()
      .email("Invalid email address")
      .required("email is Required"),
    password: yup.string().required("password is Required"),
  })
  .required();

function Login() {
  const [loading, setLoading] = useState(false);
  const { login, role } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm({
    resolver: yupResolver(LoginValidationSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });


  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const verifiedUser = await login({
        email: data.email,
        password: data.password,
      });

      Notification.success("Login successful!");

      const userRole = verifiedUser?.role || "student";
      if (userRole === "admin") {
        navigate("/admin");
      } else if (userRole === "superadmin") {
        navigate("/superadmin");
      } else {
        navigate("/");
      }
    } catch (error) {
      Notification.error(error?.message || "Login failed!");
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
              Enter your credentials to a login panel.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit(onSubmit)();
              }
            }}
            className="space-y-6"
          >
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

            <Button
              type="submit"
              text="Login"
              className="btn btn-primary block w-full text-center"
              isLoading={loading}
            />
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{" "}
              <Link to="/signup" className="text-blue-500 hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Login;
