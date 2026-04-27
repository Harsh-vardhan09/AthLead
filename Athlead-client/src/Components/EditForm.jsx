import { PlusCircle } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { data, useNavigate } from "react-router";
import { api } from "../api/axios";
import toast from "react-hot-toast";

const EditForm = ({ setEditForm }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  const navigate=useNavigate()

  const profile = watch("profile_picture");

  const onSubmit = async (data) => {
    const formData=new FormData();
    formData.append('profile_picture',data.profile_picture[0])
    formData.append('fullname',data.fullname)
    formData.append('phone',data.phone)
    formData.append('address',data.address)
    formData.append('DOB',data.DOB)

    const res= await api.patch('/api/edit',formData)
    console.log(res);
    
    if(res.data.success){
        toast.success(res.data.message)
        navigate('/dashboard')
    }else{
        toast.error(res.data.message)
    }
  };
  return (
    <section
      onClick={() => setEditForm(false)}
      className="fixed inset-0 z-10 min-h-screen h-full w-full bg-black/60 backdrop-blur-md flex items-center justify-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full flex flex-col items-start gap-3 p-5 max-w-xl h-full max-h-145 bg-linear-to-br from-[#0f2027] via-[#1a3a4a] to-[#0f2027] rounded-4xl border border-[rgba(6,182,212,0.2)] shadow-[0_0_60px_rgba(6,182,212,0.15)]"
      >
        <div className="">
          <h1 className="text-3xl text-white font-akkurat">Edit Profile</h1>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full flex flex-col  gap-2"

        >
          <div className="flex items-center justify-center">
            <div className="w-30 h-30   border border-[#1d9e75]/40 text-[#5dcaa5] flex items-center justify-center rounded-full">
              <label
                htmlFor="profile_picture"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                <PlusCircle size={50} className={`${profile?'hidden':''}`}/>
                <input
                id="profile_picture"
                  type="file"
                  {...register("profile_picture")}
                  hidden
                  accept="image/*"
                  className="w-full p-3 border border-gray-200 rounded-lg"
                />
                <img
                  src={
                    profile && profile[0]
                      ? URL.createObjectURL(profile[0])
                      : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQw3k1c6JaNUexk2h38jFUHu4j3O73P8mgVkw&s"
                  }
                  alt=""
                  className=" w-30 h-30 rounded-full object-cover mt-2"
                />
              </label>
            </div>
          </div>

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
              <p className="text-xs text-red-400 mt-1">{errors.DOB.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor=""
              className="block text-[11px] font-medium text-white/50 uppercase tracking-widest mb-1.5"
            >
              Address
            </label>
            <input
              type="text"
              {...register("address")}
              className={`w-full bg-white/7 border rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:bg-[#1d9e75]/8 transition-all ${
                errors.DOB ? "border-red-500/80" : "border-white/12"
              }`}
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full mt-1 py-3.5 rounded-xl bg-linear-to-r from-[#1d9e75] to-[#378add] text-white text-sm font-semibold tracking-wide cursor-pointer hover:opacity-90 active:scale-99 transition-all"
            >
              {" "}
              Edit
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default EditForm;
