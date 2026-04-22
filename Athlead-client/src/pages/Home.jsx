import React from "react";
import { ArrowRight, PlayCircle, Section} from "lucide-react";
import { faqs, features, sportsSupported } from "../assets/assets";
import FaqItem from "../Components/FaqItem";
import Footer from "../Components/Footer";

const Home = () => {
  return (
    <section className="relative max-w-screen min-h-screen bg-[#050d1a] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[60px_60px] bg-repeat overflow-hidden">
      <main className="relative min-h-screen flex items-center justify-center font-segoe mt-20">
        {/* background style */}
        <div className="absolute -top-15 right-220 w-120 h-120 rounded-full bg-teal-radial " />
        <div className="absolute top-100 right-0 w-120 h-120 rounded-full bg-teal-radial " />
        <div className="absolute top-400 left-0 w-150 h-150 rounded-full bg-teal-radial "/>

        <div className=" flex-1 w-full flex flex-col items-center justify-start text-center ">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white leading-snug">
            Future of Sports Discovered <br />
            <span className="bg-linear-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent ">
              Now with AI
            </span>
          </h1>
          <p className=" text-sm md:text-lg basic font-medium">
            A unified Ai powered Platform for users to rank, evaluate talent
            accross india,
            <br /> --Giving every athleate an fair Data driven shot at greatness
          </p>

          <div className="flex m-8 gap-8">
            <button className="h-8 w-35 md:h-12 bg-linear-to-r from-teal-300 to-teal-800 rounded-lg text-white font-medium flex items-center justify-center gap-2 hover:from-teal-500 hover:to-blue-600 transition-all hover:ease-in-out">
              Get Started <ArrowRight className="w-5 h-5" />
            </button>
            <button className="h-8 w-35 md:h-12 text-white font-medium border border-gray-100/20 rounded-lg flex justify-center items-center gap-2 hover:bg-gray-700 transition-all hover:ease-in-out">
              <PlayCircle className="w-5 h-5 font-light" />
              Watch Demo
            </button>
          </div> 

          <div className="  flex max-lg:flex-wrap items-center  gap-5 lg:gap-10 mb-5">
            <div className="border border-gray-100/10 h-25 w-35 rounded-xl flex flex-col justify-center text-xl text-white font-bold transition-all ease-in-out hover:shadow-[0_10px_20px_rgba(255,255,255,0.25)] hover:scale-105">
              12,000+ <br />
              <span className="text-xs basic font-medium">
                Atheletes Tracked
              </span>{" "}
            </div>
            <div className="border border-gray-100/10 h-25 w-35 rounded-xl flex flex-col justify-center text-xl text-white font-bold transition-all ease-in-out hover:shadow-[0_10px_20px_rgba(255,255,255,0.25)] hover:scale-105">
              90.3% <br />
              <span className="text-xs basic font-medium">Accuracy</span>{" "}
            </div>
            <div className="border border-gray-100/10 h-25 w-35 rounded-xl flex flex-col justify-center text-xl text-white font-bold transition-all ease-in-out hover:shadow-[0_10px_20px_rgba(255,255,255,0.25)] hover:scale-105">
              28 <br />
              <span className="text-xs basic font-medium">
                States Covered
              </span>{" "}
            </div>{" "}
          </div>
        </div>
      </main>

      <section className="flex-1 flex flex-col gap-8 items-center justify-center mb-20">
        {features.map((feature) => {
          const Icon = feature.Icon;

          return (
            <div
              key={feature.title}
              className={`p-6 w-80 lg:w-250 rounded-2xl ${feature.bg} ${feature.border} border cursor-pointer transition hover:shadow-md hover:scale-105 duration-200`}
            >
              <div
                className={`w-10 h-10 rounded-lg ${feature.iconBg} flex items-center justify-center mb-4`}
              >
                <Icon className={feature.ic} size={20} />
              </div>

              <div className="text-[10px] font-bold text-white uppercase tracking-widest mb-2">
                {feature.tag}
              </div>

              <div className="font-extrabold text-white text-[16px] mb-2">
                {feature.title}
              </div>

              <p className="basic text-[13px] leading-relaxed">
                {feature.desc}
              </p>
            </div>
          );
        })}
      </section>

      <section className="relative max-w-200 mx-auto mb-24 text-center leading-snug">
        <h1 className="text-3xl  text-white font-semibold font-segoe">Coverage</h1>
        <p className="basic text-md mt-5 wrap-normal">AI model fine tuned for each dicipline. Growing with the players </p>
        <div className="flex flex-wrap justify-center gap-4 mt-5">
          {
            sportsSupported.map((s,i)=>(
              <div key={i} className="text-white text-lg border border-white/10 py-3 px-3 rounded-full hover:scale-105">
                  {s}
              </div>
            ))
          }
        </div>
      </section>

      <section className="relative z-10 max-w-225 mx-auto px-8 pb-28 text-center">
          <div className=" font-semibold text-xl bg-linear-to-r from-teal-300 via-teal-600 to-blue-300 bg-clip-text text-transparent">FAQ</div>
          <h2 className="text-3xl font-black text-center text-white mb-6  font-segoe">Frequently Asked Questions</h2>
          <div className="flex flex-col items-center gap-10 ">
            {faqs.map((faq)=>(
              <FaqItem key={faq.q} {...faq}/>
            ))}
          </div>
      </section>

          <Footer/>
    </section>
  );
};

export default Home;
