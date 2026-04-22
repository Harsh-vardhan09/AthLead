
const Input = ({placeholder,type,value,error}) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[12px] font-semibold text-slate-400 tracking-wide">{label}</label>
      )}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150
        ${error
          ? "bg-red-500/[0.06] border-red-500/30 focus-within:border-red-500/50"
          : "bg-white/[0.04] border-white/[0.08] focus-within:border-teal-500/50 focus-within:bg-teal-500/[0.04]"
        }`}>
        {Icon && <Icon size={15} className={error ? "text-red-400 flex-shrink-0" : "text-slate-500 flex-shrink-0"} />}
        <input
          type={type}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none outline-none text-[13px] text-slate-200 placeholder-slate-600"
          {...register(value)}
        />
        {rightEl}
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-[11px] text-red-400">
          <AlertCircle size={11} />
          {error}
        </div>
      )}
    </div>
  );
}
    

export default Input
