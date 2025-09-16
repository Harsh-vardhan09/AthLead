import React from "react";
import youthImage from "/Assets/youth.jpg";
import desh from "/Assets/desh.jpeg";
import { cn } from "../utility/cn";

const About = () => {
  return (
    <div
      className={cn("min-h-screen flex items-center justify-center px-4 py-12 bg-[url('/Assets/rastra.jpg')] bg-cover bg-center bg-no-repeat")}>
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="flex justify-center">
          <img
            src={youthImage}
            alt="Ministry of Youth Affairs and Sports"
            className="rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-lg 
                       transform hover:scale-105 transition-transform duration-500 mt-10 "
          />
        </div>

        <div className="backdrop-blur-sm bg-black/50 p-6 sm:p-8 rounded-xl text-white">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-center md:text-left">
            About Our Initiative
          </h1>
          <p className="text-base sm:text-lg leading-relaxed mb-4 text-center md:text-left">
            The{" "}
            <span className="font-semibold">
              Ministry of Youth Affairs and Sports
            </span>
            proudly introduces the{" "}
            <span className="font-semibold">AI-Powered Mobile Platform</span>
            for Democratizing Sports Talent Assessment.
          </p>
          <p className="text-base sm:text-lg leading-relaxed mb-4 text-center md:text-left">
            Our vision is to create equal opportunities for athletes across the
            nation, empowering them with advanced technology and data-driven
            insights. This initiative leverages{" "}
            <span className="text-green-400 font-semibold">
              Artificial Intelligence
            </span>
            to identify, evaluate, and nurture sports talent at the grassroots
            level.
          </p>
          <p className="text-base sm:text-lg leading-relaxed mb-6 text-center md:text-left">
            By bridging the gap between aspiring athletes and professional
            ecosystems, we aim to unlock the true potential of India's sporting
            future.
          </p>

          <div className="flex justify-center md:justify-start">
            <a
              href="/get-started"
              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-md 
                         hover:bg-indigo-500 transition duration-300"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
