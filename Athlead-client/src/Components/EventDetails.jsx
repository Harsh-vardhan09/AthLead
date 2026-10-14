import React, { useEffect, useState } from "react";
import { sportIcon } from "../assets/assets";
import { Calendar, Clock, MapPin, Medal, Users } from "lucide-react";
import { useNavigate } from "react-router";
import { formatEventTime } from "../utils/formatEventTime";
import { formatDate } from "../utils/dateFormatter";
import { eventService } from "../api/eventService";
import { useAuth } from "../context/useAuth";
import toast from "react-hot-toast";

const EventDetails = ({ selected, setIsOpen }) => {
  const navigate = useNavigate();
  const { loggedIn, loading: authLoading } = useAuth();
  const [isRegistered, setIsRegistered] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(
    authLoading || loggedIn,
  );
  const [isLoading, setIsLoading] = useState(false);
  const formattedDate = formatDate(selected.date, "D MMM YYYY");
  const eventTime = formatEventTime(selected.time);
  const isFull =
    selected.capacity != null &&
    (selected.registeredCount || 0) >= selected.capacity;
  const spotsLeft =
    selected.capacity != null
      ? Math.max(0, selected.capacity - (selected.registeredCount || 0))
      : null;

  useEffect(() => {
    let isCurrent = true;

    if (authLoading) {
      setIsCheckingRegistration(true);
      return () => {
        isCurrent = false;
      };
    }

    if (!loggedIn) {
      setIsRegistered(false);
      setIsCheckingRegistration(false);
      return () => {
        isCurrent = false;
      };
    }

    setIsCheckingRegistration(true);
    eventService
      .getMyEvents()
      .then(({ data }) => {
        if (isCurrent) {
          setIsRegistered(
            data.some(
              (registration) => registration.event?._id === selected._id,
            ),
          );
        }
      })
      .catch((error) => {
        if (isCurrent) {
          toast.error(
            error.apiMessage || "Couldn't check your event registration.",
          );
        }
      })
      .finally(() => {
        if (isCurrent) setIsCheckingRegistration(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [authLoading, loggedIn, selected._id]);

  const handleCancelRegistration = async (e) => {
    e.stopPropagation();
    try {
      setIsLoading(true);
      await eventService.cancelRegistration(selected._id);
      setIsRegistered(false);
      toast.success("Event registration cancelled.");
    } catch (error) {
      toast.error(error.apiMessage || "Failed to cancel event registration.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <section
      onClick={() => setIsOpen(false)}
      className="fixed inset-0 z-10 min-h-screen h-full w-full bg-black/60 backdrop-blur-md flex items-center justify-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl h-full max-h-4/6 bg-[#040e1a]/95 rounded-4xl border border-[rgba(6,182,212,0.2)] shadow-[0_0_60px_rgba(6,182,212,0.15)]"
      >
        <div className="flex flex-col  justify-start my-5 gap-5 mx-5">
          <div className="text-3xl">{sportIcon(selected.sport)}</div>
          <div>
            <p className="text-white text-xl font-bold font-akkurat">
              {selected.title}
            </p>
            <p className="basic text-sm">
              {selected.sport} • {selected.category}
            </p>
          </div>
          <div>
            <p className="basic text-sm">{selected.description}</p>
          </div>

          <div className=" basic flex  justify-around gap-5  ">
            <div className=" text-xs  ">
              <div className="flex flex-col gap-1 items-start bg-white/5 border border-teal-200/10   w-auto lg:w-50  h-12 justify-center rounded-xl mb-3 p-3">
                <p className="flex">
                  <Calendar className="text-teal-600 h-4 w-4 mr-1" />
                  Date
                </p>
                <p className="text-md text-white font-bold">{formattedDate}</p>
              </div>
              <div className="flex flex-col gap-1 items-start bg-white/5 border border-teal-200/10   w-auto lg:w-50  h-12 justify-center rounded-xl  p-3">
                <p className="flex">
                  <MapPin className="text-teal-600 h-4 w-4 mr-1" />
                  Location
                </p>
                <p className="text-md text-white font-bold">
                  {selected.location}
                </p>
              </div>
            </div>
            <div className="text-xs">
              <div className="flex flex-col gap-1 items-start bg-white/5 border border-teal-200/10   w-auto lg:w-50  h-12 justify-center rounded-xl mb-3 p-3">
                <p className="flex">
                  <Clock className="text-teal-600 h-4 w-4 mr-1" />
                  Time
                </p>
                <p className="text-md text-white font-bold">{eventTime}</p>
              </div>
              <div className="flex flex-col gap-1 items-start bg-white/5 border border-teal-200/10   w-auto lg:w-50  h-12 justify-center rounded-xl  p-3">
                <p className="flex">
                  {selected.capacity != null ? (
                    <>
                      <Users className="text-teal-600 h-4 w-4 mr-1" />
                      Capacity
                    </>
                  ) : (
                    <>
                      <Medal className="text-teal-600 h-4 w-4 mr-1" />
                      Prize Pool
                    </>
                  )}
                </p>
                <p className="text-md text-white font-bold">
                  {selected.capacity != null
                    ? `${spotsLeft === 0 ? "Full" : `${spotsLeft} spots left`} (${selected.registeredCount || 0}/${selected.capacity})`
                    : selected.prize}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center max-w-3xl">
          {isRegistered ? (
            <button
              onClick={handleCancelRegistration}
              disabled={isLoading || isCheckingRegistration}
              className="text-center bg-red-600 hover:bg-red-700 text-white font-semibold w-full rounded-xl h-10 max-w-120 mx-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Cancelling..." : "Cancel Registration"}
            </button>
          ) : (
            <button
              onClick={() => {
                if (isFull) return;
                setIsOpen(false);
                navigate(`/events/${selected._id}`);
              }}
              disabled={isCheckingRegistration || isFull}
              className={`text-center w-full rounded-xl h-10 max-w-120 mx-4 disabled:opacity-50 disabled:cursor-not-allowed ${
                isFull
                  ? "bg-gray-600 text-gray-300"
                  : "bg-linear-to-br from-cyan-400 to-cyan-600 hover:from-cyan-600 hover:to-cyan-800"
              }`}
            >
              {isCheckingRegistration
                ? "Checking registration..."
                : isFull
                  ? "Event Full"
                  : "Register Now"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default EventDetails;
