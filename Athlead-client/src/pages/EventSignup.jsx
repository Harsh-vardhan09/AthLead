import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from 'react-router-dom'
import { api } from "../api/axios";
import toast from "react-hot-toast";

const EventSignup = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const navigate=useNavigate()
  const {eventId}=useParams();
  const onSubmit = async(data) => {
    const res=await api.post(`/api/events/${eventId}/register`,data)
    if(res.data.success){
      toast.success(res.data.message)
      navigate('/events')
    }else{
       toast.error(res.data.message)
    }
  };

  return (
    <section className="dark-bg relative max-w-screen min-h-screen flex items-center justify-center ">
      <div className="h-2/3 max-w-180 w-full bg-linear-to-br from-[#0f2027] via-[#1a3a4a] to-[#0f2027] border border-[#1d9e75]/40 text-start text-white rounded-2xl shadow-xl">

        <div className="text-center pt-6 pb-2 px-8">
          <span className="inline-flex items-center gap-1.5 bg-[#1d9e75]/15 border border-[#1d9e75]/40 text-[#5dcaa5] text-xs font-medium px-3 py-1 rounded-full mb-3">
            ● Registration open
          </span>
        </div>

        {/* Stats Bar */}
        {/* <div className="grid grid-cols-3 gap-2.5 px-8 py-4">
          {[
            { num: "847", label: "Registered" },
            { num: "153", label: "Spots left" },
            { num: "25 days", label: "To go" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white/5 border border-white/8 rounded-xl py-2.5 text-center"
            >
              <span className="block text-lg font-semibold text-[#5dcaa5]">
                {s.num}
              </span>
              <span className="block text-[11px] text-white/35 mt-0.5">
                {s.label}
              </span>
            </div>
          ))}
        </div> */}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3 px-8 pb-8"
        >

          <div>
            <label className="block text-[11px] font-medium text-white/50 uppercase tracking-widest mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              placeholder="John Doe..."
              {...register("fullname", {
                required: true,
                maxLength: { value: 20, message: "Must be < 20 letters" },
              })}
              className={`w-full bg-white/7 border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:bg-[#1d9e75]/8 transition-all ${
                errors.fullname ? "border-red-500/80" : "border-white/12"
              }`}
            />
            {errors.fullname && (
              <p className="text-xs text-red-400 mt-1">
                {errors.fullname.message}
              </p>
            )}
          </div>


          <div className="grid md:grid-cols-2 gap-3 grid-cols-1">
            <div>
              <label className="block text-[11px] font-medium text-white/50 uppercase tracking-widest mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="you@email.com"
                {...register("email", {
                  required: true,
                  pattern: {
                    value:
                      /^[a-zA-Z0-9._%+-]+[@][a-zA-Z0-9.-]+[\.][a-zA-Z]{2,}$/,
                    message: "Wrong email format",
                  },
                })}
                className={`w-full bg-white/7 border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:bg-[#1d9e75]/8 transition-all ${
                  errors.email ? "border-red-500/80" : "border-white/12"
                }`}
              />
              {errors.email && (
                <p className="text-xs text-red-400 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="w-full">
              <label className="block text-[11px] font-medium text-white/50 uppercase tracking-widest mb-1.5">
                Date of Birth
              </label>
              <input
                type="date"
                {...register("DOB", { required: true })}
                className={`w-full bg-white/7 border rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:bg-[#1d9e75]/8 transition-all ${
                  errors.DOB ? "border-red-500/80" : "border-white/12"
                }`}
              />
              {errors.DOB && (
                <p className="text-xs text-red-400 mt-1">
                  {errors.DOB.message}
                </p>
              )}
            </div>
            
          </div>


          <div className="grid grid-cols-1 gap-3 ">
            <div>
              <label className="block text-[11px] font-medium text-white/50 uppercase tracking-widest mb-1.5">
                Phone
              </label>
              <div className="flex gap-2">
                <span className="bg-white/7 border border-white/12 rounded-xl px-3 py-2.5 text-sm text-white/50 whitespace-nowrap">
                  +91
                </span>
                <input
                  type="number"
                  placeholder="98765 43210"
                  {...register("phone", { required: true })}
                  className={`flex-1 max-w-full bg-white/7 border rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:bg-[#1d9e75]/8 transition-all ${
                    errors.phone ? "border-red-500/80" : "border-white/12"
                  }`}
                />
              </div>
            </div>
          </div>

  
          <div>
            <label className="block text-[11px] font-medium text-white/50 uppercase tracking-widest mb-1.5">
              Gender
            </label>
            <div className="flex gap-2.5">
              {["male", "female", "other"].map((g) => (
                <label
                  key={g}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/12 bg-white/5 text-sm text-white/50 cursor-pointer has-checked:border-[#1d9e75] has-checked:bg-[#1d9e75]/15 has-checked:text-[#5dcaa5] has-checked:font-medium transition-all"
                >
                  <input
                    type="radio"
                    value={g}
                    {...register("gender", {
                      required: { value: true, message: "Required" },
                    })}
                    className="hidden"
                  />
                  {g === "male" ? "♂" : g === "female" ? "♀" : "⚧"}{" "}
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </label>
              ))}
            </div>
            {errors.gender && (
              <p className="text-xs text-red-400 mt-1">
                {errors.gender.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full mt-1 py-3.5 rounded-xl bg-gradient-to-r from-[#1d9e75] to-[#378add] text-white text-sm font-semibold tracking-wide cursor-pointer hover:opacity-90 active:scale-99 transition-all"
          >
            Register Now
          </button>

          <p className="text-center text-[11px] text-white/25 mt-1">
            Your data is safe with us · No spam, ever
          </p>
        </form>
      </div>
    </section>
  );
};

export default EventSignup;
