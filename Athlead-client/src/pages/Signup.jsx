import { Eye, EyeClosed } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";

const Signup = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  const [show, setShow] = useState(false);

  const navigate = useNavigate();

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <section className="dark-bg relative max-w-screen min-h-screen flex items-center justify-center bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[60px_60px] bg-repeat overflow-hidden">
      <div className=" h-2/3 max-w-96 w-full  bg-[#08325b]/30 border border-[#47a2bf]/60 text-start text-white rounded-xl">
        <div className="px-5">
          <h3 className="text-white font-akkurat text-2xl font-extrabold pt-5  ">
            Create Account
          </h3>
          <p className="basic text-sm pt-2">
            Already Registered?{" "}
            <span
              className=" text-lg bg-linear-to-r from-teal-400 to-blue-200 bg-clip-text text-transparent cursor-pointer"
              onClick={() => navigate("/login")}
            >
              Sign In
            </span>
          </p>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3 p-8"
        >
          <div className="w-full">
            <label className="label">Full Name</label>
            <input
              type="text"
              placeholder="John Doe..."
              {...register("fullname", {
                required:true ,
                maxLength: { value: 20, message: "Must be < 20 letters" },
              })}
              className={`input mb-4 ${errors.fullname ? "border-red-500/80" : "border-white/30"}`}
            />
            {errors.fullname && (
              <p className="text-sm text-red-700">{errors.fullname.message}</p>
            )}
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              placeholder="XXX@ABC.com"
              {...register("email", {
                required:true ,
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+[@][a-zA-Z0-9.-]+[\.][a-zA-Z]{2,}$/,
                  message: "Wrong email format",
                },
              })}
              className={`input mb-4 ${errors.email ? "border-red-500/80" : "border-white/30"}`}
            />
            {errors.email && (
              <p className="text-sm text-red-700">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="label">Phone</label>
            <input
              type="number"
              placeholder="+91 XXX XXX"
              {...register("phone")}
              className={`input mb-4 ${errors.phone ? "border-red-500/80" : "border-white/30"}`}
            />
          </div>

            <div>
            
            <div className="flex gap-2.5">
              {["male", "female"].map((g) => (
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
                  {g === "male" ? "♂" : "♀"}{" "}
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
            


          <div>
            <fieldset className={`input mb-4 ${errors.password ? "border-red-500/80" : "border-white/30"}`}>
              <input
                type={show ? "text" : "password"}
                placeholder="Enter Password"
                {...register("password", {
                  required:true,
                  pattern: {
                    value: /[a-zA-z0-9_\-\.\@\$]{7,16}/i,
                    message: "Need 7-16,special Character,uppercase",
                  },
                })}
                className="transparent w-full h-full focus:outline-none focus:ring-0"
              />
              <div
                onClick={() => setShow((e) => (e = !e))}
                className="cursor-pointer"
              >
                {show ? <Eye /> : <EyeClosed />}
              </div>
            </fieldset>
            {errors.password && (
              <p className="text-sm text-red-700">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full border border-white/20 rounded-md h-9 bg-linear-to-r from-teal-400 via-teal-800 to-blue-400 cursor-pointer hover:from-teal-600 hover:to-blue-800 hover:scale-105 transition-all hover:duration-200"
          >
            Create Account
          </button>
        </form>
      </div>
    </section>
  );
};

export default Signup;
