import { api } from "@/api/axios";
import React from "react";
import { CalendarPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const fields = [
  {
    name: "title",
    label: "Title",
    type: "text",
    placeholder: "Summer Sprint Meet",
  },
  { name: "sport", label: "Sport", type: "text", placeholder: "Athletics" },
  { name: "level", label: "Level", type: "text", placeholder: "State" },
  { name: "location", label: "Location", type: "text", placeholder: "Delhi" },
  { name: "prize", label: "Prize (₹)", type: "number", placeholder: "50000" },
  { name: "date", label: "Date", type: "date" },
  { name: "time", label: "Time", type: "time" },
];

const tagOptions = ["Freestyle", "national", "Youth", "singles", "doubles"];

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white";

const CreateEvent = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const res = await api.post("/api/events", {
        data: { ...data, prize: Number(data.prize) },
      });
      if (res.data.success) {
        toast.success(res.data.message);
        navigate("/admin/events");
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Could not create event");
    }
  };

  return (
    <section className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 p-5 sm:p-10">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <header className="flex items-center gap-4 border-b border-slate-200 bg-slate-50/80 px-6 py-5 sm:px-8">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700">
            <CalendarPlus size={22} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
              Enlist Event
            </h1>
            <p className="text-sm text-slate-500">
              Publish a new competition to the events board.
            </p>
          </div>
        </header>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5 px-6 py-6 sm:px-8"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <label key={f.name} className="flex flex-col gap-1">
                <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  {f.label}
                </span>
                <input
                  type={f.type}
                  placeholder={f.placeholder}
                  {...register(f.name, { required: `${f.label} is required` })}
                  className={inputClass}
                />
                {errors[f.name] && (
                  <p className="text-xs text-red-500">
                    {errors[f.name].message}
                  </p>
                )}
              </label>
            ))}
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Description
            </span>
            <textarea
              rows={4}
              placeholder="What is this event about?"
              {...register("description", {
                required: "Description is required",
              })}
              className={inputClass}
            />
            {errors.description && (
              <p className="text-xs text-red-500">
                {errors.description.message}
              </p>
            )}
          </label>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Tags
            </legend>
            <div className="flex flex-wrap gap-2">
              {tagOptions.map((tag) => (
                <label
                  key={tag}
                  className="cursor-pointer rounded-full border border-slate-300 px-3 py-1 text-sm text-slate-600 has-checked:border-emerald-600 has-checked:bg-emerald-50 has-checked:text-emerald-700"
                >
                  <input
                    type="checkbox"
                    value={tag}
                    {...register("tags")}
                    className="hidden"
                  />
                  {tag}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-1 flex flex-col-reverse gap-2 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/admin/events")}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-99 disabled:opacity-50"
            >
              {isSubmitting ? "Creating…" : "Create event"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default CreateEvent;
