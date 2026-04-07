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
    <div className="flex flex-col flex-1 bg-[#FDFCF9] min-h-screen font-inter">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto p-6">

        <div className="flex flex-col items-center mb-8">
          <div className="w-32 h-32 rounded-3xl overflow-hidden bg-white/50 backdrop-blur-sm p-2 mb-4">
            <img src="/splash.gif" alt="Hive" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-center">
            Hive Collaborative Study Platform
          </h1>
        </div>

        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#F1EFE9] p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Textinput
                name="name"
                type="text"
                placeholder="Full Name"
                register={register}
                error={errors.name}
                className="bg-[#F7F6F2] border-none rounded-2xl h-14 px-6 text-sm placeholder:text-[#BBB4A5] focus:bg-white transition-all shadow-none"
              />
            </div>
            <div>
              <Textinput
                name="email"
                type="email"
                placeholder="Email address"
                register={register}
                error={errors.email}
                className="bg-[#F7F6F2] border-none rounded-2xl h-14 px-6 text-sm placeholder:text-[#BBB4A5] focus:bg-white transition-all shadow-none"
              />
            </div>

            <div>
              <Textinput
                name="password"
                type="password"
                register={register}
                error={errors.password}
                hasicon
                placeholder="Password"
                className="bg-[#F7F6F2] border-none rounded-2xl h-14 px-6 text-sm placeholder:text-[#BBB4A5] focus:bg-white transition-all shadow-none"
              />
            </div>

            <div>
              <Textinput
                name="studentNumber"
                type="text"
                placeholder="Student Number"
                register={register}
                error={errors.studentNumber}
                className="bg-[#F7F6F2] border-none rounded-2xl h-14 px-6 text-sm placeholder:text-[#BBB4A5] focus:bg-white transition-all shadow-none"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                text="Create Account"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-14 rounded-2xl transition-all shadow-lg shadow-slate-900/20 capitalize"
                isLoading={loading}
              />
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm font-medium text-[#8D7F67]">
              Already have an account?{" "}
              <Link to="/login" className="text-slate-900 font-bold hover:underline">
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
