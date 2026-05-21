import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { useState, useRef, useEffect } from "react";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const CalendarPicker = ({ selectedDate, onSelect, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [openDropdown, setOpenDropdown] = useState(null); // 'month' | 'year' | null
  const monthButtonRef = useRef(null);
  const yearButtonRef = useRef(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 1920 + 1 },
    (_, i) => currentYear - i,
  );

  const handleDateSelect = (date) => {
    if (date) {
      const formatted = format(date, "dd/MM/yyyy");
      onSelect(formatted);
      onClose();
    }
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return undefined;
    const [day, month, year] = dateStr.split("/");
    return new Date(year, month - 1, day);
  };

  const monthName = format(currentMonth, "MMM");
  const year = format(currentMonth, "yyyy");

  const handleMonthSelect = (monthIndex) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), monthIndex));
    setOpenDropdown(null);
  };

  const handleYearSelect = (selectedYear) => {
    setCurrentMonth(new Date(selectedYear, currentMonth.getMonth()));
    setOpenDropdown(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        monthButtonRef.current &&
        !monthButtonRef.current.contains(event.target) &&
        yearButtonRef.current &&
        !yearButtonRef.current.contains(event.target)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="absolute z-50 bottom-full mb-2 bg-[#08325b]/95 border border-[#47a2bf]/60 rounded-xl p-2 backdrop-blur-md">
      <style>{`
        .rdp-month_caption {
          display: none !important;
        }
        .rdp-nav {
          display: none !important;
        }
      `}</style>

      {/* Custom Header */}
      <div className="flex justify-between items-center pt-4 pb-2 px-2 relative">
        <button
          onClick={() =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
            )
          }
          className="h-10 w-10 flex items-center justify-center rounded-md hover:bg-[#1d9e75]/20 text-white transition-colors text-sm font-bold"
        >
          ◀
        </button>

        <div className="flex items-center gap-1">
          {/* Month Dropdown */}
          <div className="relative" ref={monthButtonRef}>
            <button
              onClick={() =>
                setOpenDropdown(openDropdown === "month" ? null : "month")
              }
              className="text-sm font-medium text-white hover:bg-[#1d9e75]/20 rounded-md px-2 py-1 transition-colors"
            >
              {monthName}
            </button>
            {openDropdown === "month" && (
              <div className="absolute top-full left-0 mt-1 bg-[#08325b] border border-[#47a2bf]/60 rounded-md shadow-lg overflow-hidden z-50 max-h-60 overflow-y-auto">
                {MONTHS.map((month, index) => (
                  <button
                    key={month}
                    onClick={() => handleMonthSelect(index)}
                    className="block w-full text-left px-3 py-2 text-sm text-white hover:bg-[#1d9e75]/20 transition-colors"
                  >
                    {month}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Year Dropdown */}
          <div className="relative" ref={yearButtonRef}>
            <button
              onClick={() =>
                setOpenDropdown(openDropdown === "year" ? null : "year")
              }
              className="text-sm font-medium text-white hover:bg-[#1d9e75]/20 rounded-md px-2 py-1 transition-colors"
            >
              {year}
            </button>
            {openDropdown === "year" && (
              <div className="absolute top-full left-0 mt-1 bg-[#08325b] border border-[#47a2bf]/60 rounded-md shadow-lg overflow-hidden z-50 max-h-60 overflow-y-auto">
                {years.map((y) => (
                  <button
                    key={y}
                    onClick={() => handleYearSelect(y)}
                    className="block w-full text-left px-3 py-2 text-sm text-white hover:bg-[#1d9e75]/20 transition-colors"
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
            )
          }
          className="h-10 w-10 flex items-center justify-center rounded-md hover:bg-[#1d9e75]/20 text-white transition-colors text-sm font-bold"
        >
          ▶
        </button>
      </div>

      {/* Calendar */}
      <DayPicker
        mode="single"
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        selected={parseDate(selectedDate)}
        onSelect={handleDateSelect}
        classNames={{
          root: "text-white text-xs",
          months: "flex flex-col gap-2",
          month: "flex flex-col gap-2",
          caption: "hidden",
          nav: "hidden",
          table: "w-full border-collapse",
          head_row: "flex",
          head_cell: "text-white/50 rounded-md w-8 font-normal text-[0.7rem]",
          row: "flex w-full mt-1",
          cell: "text-center text-xs p-0 relative [&:has([aria-selected])]:bg-[#1d9e75]/20 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: "h-8 w-8 p-0 font-normal text-white hover:bg-[#5dcaa5]/20 rounded-md transition-colors text-xs text-center",
          day_selected:
            "bg-gradient-to-r from-teal-400 via-teal-800 to-blue-400 text-white hover:opacity-90 text-xs",
          day_today: "bg-[#5dcaa5]/10 text-[#5dcaa5]",
          day_outside: "text-white/20",
          day_disabled: "text-white/20",
        }}
      />
    </div>
  );
};

export default CalendarPicker;
