import React, { useState, useEffect } from "react";
import sportsImage from "/Assets/Sports tool.jpg";
import court from "/Assets/court.jpg";

const organizations = [
  {
    name: "National Anti Doping Agency",
    logo: "https://kym.nadaindia.yas.gov.in/static/media/nada_logo_revised_logo.ca619401ab8771764c38.png",
    description: "Play fair",
  },
  {
    name: "Sports Authority of India",
    logo: "https://sportsauthorityofindia.gov.in/sai/assets/frontend/images/loader.jpeg",
    description: "",
  },
  {
    name: "Netaji Subhas National Institute of Sports",
    logo: "https://media.licdn.com/dms/image/v2/D4E0BAQHgiVzOGKt-RQ/company-logo_200_200/company-logo_200_200/0/1723462347920/netaji_subhas_national_institute_of_sports_patiala_logo?e=2147483647&v=beta&t=DjUVaOYiaYxRxHBuIQXIhK3S0a8vz9eKXIL5jC-xKzk",
    description: "RGNIYD",
  },
  {
    name: "Khelo India",
    logo: "https://play-lh.googleusercontent.com/ObOkXGLi0m9R3XL9pQ9dE9jRFYIoQmZ0WH4oDvXtLl6KqA49RxefU2RGAz41ImKgnNY=w240-h480-rw",
    description: "",
  },
  {
    name: "National Sports University",
    logo: "https://upload.wikimedia.org/wikipedia/en/f/f5/National_Sports_University_logo.png",
    description: "",
  },
  {
    name: "National Service Scheme",
    logo: "https://m.media-amazon.com/images/I/61cf-fMKNzL.jpg",
    description: "",
  },
  {
    name: "GeM Government e Marketplace",
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkbuYQqMpGWUXnO3RDwOJk8zurv2xGE4rVMg&s",
    description: "",
  },
  {
    name: "India.gov.in",
    logo: "https://www.india.gov.in/sites/upload_files/npi/files/newsletter/logo_share.png",
    description: "",
  },
  {
    name: "GOI Web Directory",
    logo: "https://pmndp.mohfw.gov.in/sites/default/files/2021-06/goi.jpg",
    description: "",
  },
  {
    name: "Digital India",
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTI0pMzckATJsmIGZQLdNhbj7c-0BEwntHTWw&s",
    description: "",
  },
  {
    name: "data.gov.in",
    logo: "https://pbs.twimg.com/profile_images/935771833382723584/JJ16JOYv_400x400.jpg",
    description: "",
  },
  {
    name: "Department of Administrative Reforms",
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTdghgamt2XsbfxOX1FazmqfTxbVHfVB7WoMQ&s",
    description: "",
  },
  {
    name: "Youth Sports",
    logo: "https://youthsportsindia.in/wp-content/uploads/2025/03/cropped-IMG-20250326-WA0002.jpg",
    description: "Empowering young athletes",
  },
  {
    name: "Sports For All",
    logo: "https://globalprimenews.com/wp-content/uploads/2023/05/IMG_20230524_173108.jpg",
    description: "Promoting community sports",
  },
];
const content = [
  {
    id: 1,
    title: "Soccer Championship",
    subTitle: "Upcoming Event",
    description:
      "Join the biggest soccer event of the year! Compete against the best teams and win amazing prizes.",
    image: "https://www.krqe.com/wp-content/uploads/sites/12/2023/10/soccer-bracket-pic.jpg?strip=1",
  },
  {
    id: 2,
    title: "Community Achievements",
    subTitle: "Sports Community",
    description:
      "Celebrate our community’s latest achievements and milestones. We are proud of our progress!",
    image: "https://www.popai.pro/resourcesasset/wp-content/uploads/2025/02/image-420.png",
  },
  {
    id: 3,
    title: "Basketball Tournament",
    subTitle: "Upcoming Event",
    description:
      "Sign up for the annual basketball tournament. All skill levels are welcome to participate.",
    image: "https://media.istockphoto.com/id/478289877/vector/basketball-tournament.jpg?s=612x612&w=0&k=20&c=1y-1rRb_qCZ9OeRYD2RCrDGtXiTrKL9eoBYndu87IEo=",
  },
  {
    id: 4,
    title: "Athletics Meet",
    subTitle: "Annual Sports Day",
    description:
      "Showcase your athletic skills at our annual meet. Track and field events for all age groups.",
    image: "https://www.ptvenglishmediumprimary.com/wp-content/uploads/2020/01/Sports-Day-612x306.jpg",
  },
  {
    id: 5,
    title: "Cricket League Finals",
    subTitle: "Major Tournament",
    description:
      "Witness the thrilling finals of the cricket league. Cheer for your favorite teams!",
    image: "https://img.cricketworld.com/images/e-154844/kerala-cricket-league-credit-cricket-world.jpg",
  },
  {
    id: 6,
    title: "Yoga & Wellness Camp",
    subTitle: "Health & Fitness",
    description:
      "Participate in our wellness camp focused on yoga, meditation, and healthy living.",
    image: "https://static.pib.gov.in/WriteReadData/userfiles/image/image002R3LC.jpg",
  },
  {
    id: 7,
    title: "Table Tennis Open",
    subTitle: "Open for All",
    description:
      "Compete in the open table tennis tournament. Prizes for winners and runners-up.",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzZMrpeU92ifE4Vh8w3ZEvPzQRdezqreG8Sg&s",
  },
  {
    id: 8,
    title: "Sports Leadership Workshop",
    subTitle: "Skill Development",
    description:
      "Enhance your leadership and teamwork skills with our interactive sports workshop.",
    image:
      "https://placehold.co/600x400/ef4444/ffffff?text=Leadership+Workshop",
  },
];

const Home = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % content.length);
  };

  const goToPrev = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + content.length) % content.length
    );
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % content.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [content.length]);

  const currentItem = content[currentIndex];

  return (
    <main className="bg-[#1e1e1e] text-white">
      <section
        className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-400 absolute top-0 left-0 w-full h-full bg-cover bg-center"
        style={{ backgroundImage: `url(${court})` }}
      >
        <div className="absolute top-0 left-0 w-full h-full bg-black opacity-30"></div>
        <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center justify-between text-center md:text-left">
          <div className="md:w-1/2">
            <p className="text-xl font-medium tracking-widest uppercase mb-4">
              Custom Wellness
            </p>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              The Future of Sports <br /> Talent Discovery
            </h1>
            <p className="mt-4 text-xl">Ministry of Youth Affairs and Sports</p>
          </div>
        </div>
      </section>

      <section className="w-full bg-gray-50 py-16 px-6 md:px-12 lg:px-20 flex flex-col lg:flex-row items-center gap-12">
        <div className="relative w-full lg:w-1/2 flex justify-center">
          <img
            src={sportsImage}
            alt="Sports Tools"
            className="rounded-3xl shadow-xl object-cover w-full h-[400px] md:h-[500px]"
          />

          <div className="absolute bottom-6 left-6 bg-gray-100 backdrop-blur-md rounded-2xl shadow-lg p-6 max-w-xs">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Our Vision</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Empowering youth through sports, innovation, and leadership.
            </p>
          </div>
        </div>

        <div className="lg:w-1/2 flex flex-col gap-6 bg-gray-200 p-7 rounded-2xl">
          <p className="uppercase text-orange-600 font-semibold tracking-wide">
            featured section --
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
            About <span className="text-orange-600">Us</span>
          </h2>
          <p className="text-xl text-gray-700 leading-relaxed">
            The <strong>Ministry of Youth Affairs & Sports</strong> is committed
            to nurturing talent and building India’s sporting culture with a
            focus on health, innovation, and global excellence.
          </p>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700 font-bold">
            <li className="flex items-center gap-2">
              ✅ Talent Identification
            </li>
            <li className="flex items-center gap-2">🏋️ Fitness for All</li>
            <li className="flex items-center gap-2">
              🏟️ Infrastructure Development
            </li>
            <li className="flex items-center gap-2">
              🥇 Global Sporting Excellence
            </li>
            <li className="flex items-center gap-2">👩‍💻 Youth Empowerment</li>
          </ul>

          <button className="mt-6 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-full font-semibold shadow-md w-fit transition-all">
            Explore More
          </button>
        </div>
      </section>



      <div className="flex flex-col items-center min-h-screen bg-gray-800 p-4 font-sans">
        <div className="w-full max-w-4xl relative">
          <h1 className="text-5xl font-bold text-gray-100 mb-25 mt-15 text-center ">
            Upcoming Events & Achievements
          </h1>

          <div className="bg-white p-8 rounded-3xl shadow-lg flex flex-col sm:flex-row items-center">
            <div className="w-full sm:w-1/2 relative rounded-2xl overflow-hidden mb-4 sm:mb-0">
              <img
                src={currentItem.image}
                alt={currentItem.title}
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="w-full sm:w-1/2 sm:pl-8 flex flex-col justify-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                {currentItem.title}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {currentItem.subTitle}
              </p>
              <p className="text-gray-800 mb-6">{currentItem.description}</p>
              <button className="w-full bg-blue-600 text-white font-semibold py-2 rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-md">
                Learn More
              </button>
            </div>
          </div>

          <button
            onClick={goToPrev}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -ml-6 w-12 h-12 flex items-center justify-center bg-gray-200 rounded-full shadow-lg hover:bg-gray-300 transition-colors duration-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 -mr-6 w-12 h-12 flex items-center justify-center bg-gray-200 rounded-full shadow-lg hover:bg-gray-300 transition-colors duration-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          <div className="flex justify-center mt-8 space-x-2">
            {content.map((_, index) => (
              <span
                key={index}
                className={`block w-3 h-3 rounded-full cursor-pointer ${
                  currentIndex === index ? "bg-blue-600" : "bg-gray-400"
                }`}
                onClick={() => setCurrentIndex(index)}
              ></span>
            ))}
          </div>
        </div>
      </div>



      <div className="bg-gradient-to-r from-gray-100 to-gray-200 py-16 px-4 font-sans">
        <div className="container mx-auto">
          <h2 className="text-center text-6xl font-semibold text-gray-800 mb-10">
            Our Valued Partners
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-8 md:gap-12 justify-items-center">
            {organizations.map((org, index) => (
              <div
                key={index}
                className="flex flex-col items-center p-4 bg-white rounded-xl shadow-lg transition-transform transform hover:scale-105 h-56 w-52"
              >
                <img
                  src={org.logo}
                  alt={org.name}
                  className="w-20 h-20 object-contain mb-4 rounded-full"
                />
                <p className="text-md font-bold text-gray-900 text-center mb-1">
                  {org.name}
                </p>
                {org.description && (
                  <p className="text-sm text-gray-600 text-center">
                    {org.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="bg-gray-900 text-gray-400 py-12 px-4 font-sans">
        <div className="container mx-auto flex flex-wrap justify-between gap-8">
          <div className="w-full md:w-1/4 mb-6 md:mb-0">
            <h3 className="text-4xl font-bold text-white mb-4">AthLead</h3>
            <p className="text-sm">
              Empowering athletes with the tools to train, track, and triumph.
              We provide a platform for community, events, and performance
              analytics.
            </p>
          </div>

          <div className="w-full md:w-1/4 mb-6 md:mb-0">
            <h4 className="text-lg font-semibold text-white mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="hover:text-white transition-colors duration-300"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-white transition-colors duration-300"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-white transition-colors duration-300"
                >
                  Events
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-white transition-colors duration-300"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div className="w-full md:w-1/4 mb-6 md:mb-0">
            <h4 className="text-lg font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="hover:text-white transition-colors duration-300"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-white transition-colors duration-300"
                >
                  Community
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-white transition-colors duration-300"
                >
                  FAQs
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-white transition-colors duration-300"
                >
                  Support
                </a>
              </li>
            </ul>
          </div>

          <div className="w-full md:w-1/4 mb-6 md:mb-0">
            <h4 className="text-lg font-semibold text-white mb-4">Follow Us</h4>
            <div className="flex space-x-4 mb-6">
              <a
                href="#"
                className="hover:text-white transition-colors duration-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.77 1.624 4.938 4.938.058 1.265.07 1.645.07 4.849 0 3.204-.012 3.584-.07 4.85-2.08 3.252-1.624 4.77-4.938 4.938-1.265.058-1.645.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.77-1.624-4.938-4.938-.058-1.265-.07-1.645-.07-4.85s.012-3.584.07-4.85c.148-3.252 1.624-4.77 4.938-4.938 1.265-.058 1.645-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.981 6.981-.058 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.947.201 4.358 2.618 6.78 6.981 6.981 1.28.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.947-.072 4.358-.201 6.78-2.618 6.981-6.981.058-1.28.072-1.689.072-4.948 0-3.259-.014-3.668-.072-4.947-.201-4.358-2.618-6.78-6.981-6.981-1.28-.058-1.689-.073-4.948-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.44-.645 1.44-1.44s-.645-1.44-1.44-1.44z" />
                </svg>
              </a>
              <a
                href="#"
                className="hover:text-white transition-colors duration-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M22.675 3.325c-.244.108-.49.208-.737.302-1.23.468-2.483.754-3.763.754-.25 0-.5-.008-.75-.024-1.127-.08-2.26-.308-3.342-.647-1.082-.338-2.115-.81-3.08-1.41-1.07-.665-1.996-1.5-2.827-2.486-1.08-.85-1.996-1.89-2.78-3.1-1.08-1.58-1.62-3.35-1.62-5.26 0-1.89.5-3.66 1.5-5.25.996-1.55 2.296-2.9 3.86-3.95 1.564-1.05 3.34-1.8 5.26-2.25 1.92-.45 3.96-.58 6.01-.396-.51-1.35-1.25-2.61-2.22-3.8-1.29-1.59-2.86-2.9-4.57-4.04-1.71-1.14-3.56-1.9-5.54-2.3-1.98-.4-4.04-.32-6.01.21-1.97.53-3.8 1.4-5.4 2.56-1.6 1.16-2.9 2.54-4 4.14-1.07 1.6-1.6 3.4-1.6 5.25 0 1.89.51 3.66 1.5 5.25.996 1.55 2.296 2.9 3.86 3.95 1.564 1.05 3.34 1.8 5.26 2.25 1.92.45 3.96.58 6.01.396.51 1.35 1.25 2.61 2.22 3.8 1.29 1.59 2.86 2.9 4.57 4.04 1.71 1.14 3.56 1.9 5.54 2.3 1.98.4 4.04.32 6.01-.21 1.97-.53 3.8-1.4 5.4-2.56 1.6-1.16 2.9-2.54 4-4.14 1.07-1.6 1.6-3.4 1.6-5.25z" />
                </svg>
              </a>
            </div>
            <p className="text-sm">
              Stay updated with our latest news and events.
            </p>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-center">
          <p className="text-sm">&copy; 2025 AthLead. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
};

export default Home;
