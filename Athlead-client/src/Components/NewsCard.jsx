import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const NewsCard = ({ e, loading }) => {
  return (
    <div className="flex items-start border  border-white/40 rounded-xl bg-white/4 hover:scale-105 ease-in-out duration-200 transition-all">
      <div className="mx-4 my-4">
        {loading ? (
          <Skeleton width={360} height={120} />
        ) : (
          <img
            src={e.image}
            alt=""
            className="w-auto lg:w-40 h-30 rounded-xl "
          />
        )}
      </div>
      <div className="text-start mx-4 my-4 ">
        <p className="text-xl font-bold font-segoe text-white">{loading ? <Skeleton width={200} /> : e?.title}</p>
        <p className="basic text-xs hidden lg:flex my-4"> {loading ? <Skeleton count={2} /> : e?.content}</p>
        <a
          href={e?.url}
          className="my-4 bg-linear-to-b from-teal-200 to-teal-700 bg-clip-text text-transparent font-extrabold"
        >
          <span className="basic"></span>
           {loading ? <Skeleton width={100} /> : e?.source?.name}
        </a>
      </div>
    </div>
  );
};

export default NewsCard;
