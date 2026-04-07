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

      sessionStorage.setItem("freshLogin", "true");
      sessionStorage.removeItem("hasSeenIntro");

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
    <div className="flex flex-col flex-1 bg-[#FDFCF9] min-h-screen font-inter">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto p-6">

        <div className="flex justify-center mb-8">
          <div className="w-32 h-32 rounded-3xl overflow-hidden bg-white/50 backdrop-blur-sm p-2">
            <img src="/splash.gif" alt="Hive" className="w-full h-full object-contain" />
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#F1EFE9] p-6">
          <form
            onSubmit={handleSubmit(onSubmit)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit(onSubmit)();
              }
            }}
            className="space-y-4"
          >
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

            <div className="pt-2">
              <Button
                type="submit"
                text="Login"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-14 rounded-2xl transition-all shadow-lg shadow-slate-900/20 capitalize"
                isLoading={loading}
              />
            </div>
          </form>

          <div className="mt-8 text-center space-y-3">
            <p className="text-sm font-medium text-[#8D7F67]">
              Didn't have an account?{" "}
              <Link to="/signup" className="text-slate-900 font-bold hover:underline">
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
