import { Eye, EyeClosed } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { api } from "../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AppProvider";

const Login = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  const [show, setShow] = useState(false);
  const {setLoggedIn} =useAuth()

  const navigate = useNavigate();

  const toggleVisibility = () => {};

  const onSubmit = async(data) => {
    const res=await api.post('/api/auth/login',data)
    
    localStorage.setItem('accessToken',res.data.accessToken)
    setLoggedIn(true)
    if (res.data.success) {
      toast.success(res.data.message);
      navigate("/dashboard");
    } else{
      toast.error(res.data.message);
    }
    
    
    
  };

  return (
    <section className="dark-bg relative max-w-screen min-h-screen flex items-center justify-center bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[60px_60px] bg-repeat overflow-hidden">
      <div className=" h-2/3 max-w-96 w-full  bg-[#08325b]/30 border border-[#47a2bf]/60 text-start text-white rounded-xl p-2">
        <div className="px-5">
          <h3 className="text-white font-akkurat text-2xl font-extrabold pt-5  ">
            Login User
          </h3>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3 p-8"
        >
          <fieldset className="w-full">
            <label className="label">Email</label>
            <input
              type="email"
              placeholder="XXX@ABC.com"
              {...register("email", {
                required: { value: true, message: "Required for login" },
              })}
              className={`input ${errors.email ? "border-red-500/80" : "border-white/30"}`}
            />
            
          </fieldset>

          <fieldset className="w-full">
            <div className={`input mb-4 ${errors.password ? "border-red-500/80" : "border-white/30"}`}>
              <input
                type={show ? "text" : "password"}
                placeholder="Enter Password"
                {...register("password", {
                  required: { value: true, message: "Required for login" },
                })}
                className="transparent w-full h-full focus:outline-none focus:ring-0"
              />
              <div
                onClick={() => setShow((e) => (e = !e))}
                className="cursor-pointer"
              >
                {show ? <Eye /> : <EyeClosed />}
              </div>
            </div>
            
          </fieldset>
          <button
            type="submit"
            className="w-full border border-white/20 rounded-md h-9 bg-linear-to-r from-teal-400 via-teal-800 to-blue-400 cursor-pointer hover:from-teal-600 hover:to-blue-800 hover:scale-105 transition-all hover:duration-200"
          >
            Login
          </button>
        </form>
        <div className="flex items-center justify-center">
          <p className="basic text-sm pt-2">
            New Here?{" "}
            <span
              className="bg-linear-to-r from-teal-400 to-blue-200 bg-clip-text text-transparent text-lg cursor-pointer"
              onClick={() => navigate("/signup")}
            >
              Signup
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Login;
