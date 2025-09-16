import { useState, useEffect } from "react";

const achievements = [
  {
    title: "Khelo India Initiative",
    description:
      "Nurturing grassroots talent through scholarships, training, and national level competitions.",
    image:
      "https://launchpadeducation.in/wp-content/uploads/2024/03/blog-pictures-1-1.png", // Khelo India
  },
  {
    title: "Olympic Excellence",
    description:
      "India achieved its best-ever medal tally at the Tokyo 2020 Olympics, inspiring future champions.",
    image:
      "https://img.olympics.com/images/image/private/t_social_share_thumb/f_auto/primary/ml1s1lhlu46v5vxidtvg", // Olympics
  },
  {
    title: "Fit India Movement",
    description:
      "Promoting fitness as an integral part of daily lifestyle for youth and citizens across India.",
    image:
      "https://static.mygov.in/static/s3fs-public/mygov_169321819950183151.jpg", // Fit India
  },
  {
    title: "Paralympic Achievements",
    description:
      "Indian para-athletes brought glory by winning a record number of medals at Tokyo Paralympics.",
    image:
      "https://assets.zeezest.com/blogs/PROD_Paralympics_Winners-banner_1630674795191_thumb_1200.jpeg", // Paralympics
  },
  {
    title: "Sports Infrastructure Development",
    description:
      "Modern sports academies, stadiums, and centers of excellence established nationwide.",
    image:
      "https://media.newindianexpress.com/newindianexpress%2F2024-09-29%2Ftws8apzb%2FBCCI-brings.jpg", // Infra
  },
  {
    title: "Youth Engagement & Training",
    description:
      "Skill-building, leadership, and volunteer programs to empower India’s youth in sports & society.",
    image: "https://bpac.in/wp-content/uploads/2024/01/Blog-Banner-3.jpg", // Youth programs
  },
];

export default function SelfChanging() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % achievements.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const current = achievements[currentIndex];

  return (
    <div className="relative w-full min-h-screen overflow-hidden flex items-center justify-center p-4">
      {achievements.map((item, index) => (
        <div
          key={index}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundImage: `url(${item.image})` }}
        ></div>
      ))}

      <div className="relative z-10 w-full flex justify-center items-center min-h-screen">
        <div
          className="relative bg-opacity-10 backdrop-filter backdrop-blur-lg border border-gray-200 border-opacity-20 rounded-xl shadow-2xl p-8 md:p-12
                     flex flex-col items-center justify-center text-white text-center
                     max-w-7xl w-full md:w-10/12 lg:w-9/12 xl:w-8/12 2xl:w-7/12
                     min-h-[50vh] transform transition-all duration-500 hover:scale-[1.01] hover:shadow-cyan-500/50 cursor-pointer"
        >
          <h1 className="text-2xl text-gray-800 md:text-3xl font-bold mb-2">
            Proud Moments
          </h1>

          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-lg leading-tight ">
            {current.title}
          </h2>
          <p className="text-xl md:text-2xl leading-relaxed max-w-4xl drop-shadow-md">
            {current.description}
          </p>
          <button className="mt-8 px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full text-lg transition-colors duration-300 shadow-lg hover:shadow-xl">
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}
