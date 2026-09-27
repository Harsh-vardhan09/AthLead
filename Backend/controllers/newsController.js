import GNews from "@gnews-io/gnews-io-js";
import dayjs from "dayjs"; // Using dayjs which is already in package.json

const client = new GNews(process.env.GNEWS_API);

export const getNews = async (req, res) => {
  try {
    // Dynamically calculate the date 7 days ago to ensure fresh news
    const oneWeekAgo = dayjs().subtract(7, 'day').format('YYYY-MM-DDTHH:mm:ss[Z]');

    const data = await client.search("sports OR ministry OR athletics", {
      lang: "en",
      country: "in",
      max: 10,
      from: oneWeekAgo, // Dynamically fetch recent news
    });

    return res.status(200).json({
      success: true,
      message: data.articles,
    });
  } catch (error) {
    console.error("News API Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch news",
    });
  }
};
