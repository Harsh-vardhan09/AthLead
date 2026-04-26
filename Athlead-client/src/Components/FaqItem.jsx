import { ChevronDown } from 'lucide-react';
import React, { useState } from 'react'

const FaqItem = ({q,a}) => {
    const [open,setOpen]=useState(false);
  return (
    <section className='  text-white border  border-gray-50/8 rounded-2xl lg:w-250 min-w-100 overflow-hidden '>
      <button onClick={(v)=>setOpen(v=>!v)} className='w-full flex items-center justify-between px-6 py-4 bg-white/2.5 hover:bg-white/4 transition-colors cursor-pointer border-none text-left rounded-2xl '>
        <span className='text-lg font-semibold text-slate-200'>{q}</span>
        <ChevronDown
          size={16}
          className={`text-teal-400 shrink-0 ml-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-6 py-4 bg-white/1.5 border-t border-white/5">
          <p className="text-[13px] text-slate-400 leading-[1.75]">{a}</p>
        </div>
      )}
    </section>
  )
}

export default FaqItem
