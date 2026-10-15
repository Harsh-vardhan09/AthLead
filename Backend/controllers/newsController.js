import GNews from "@gnews-io/gnews-io-js";
import dayjs from "dayjs"; // Using dayjs which is already in package.json

const client = new GNews(process.env.GNEWS_API);

export const getNews = async (req, res) => {
  try {
    // 1. Format the cutoff as true UTC
    const oneWeekAgo = dayjs().subtract(7, "day").toDate().toISOString();

    // 2. Constrain the "ministry" search term to sports policy
    const data = await client.search(
      'sports OR "sports ministry" OR athletics',
      {
        lang: "en",
        country: "in",
        max: 10,
        from: oneWeekAgo, // Dynamically fetch recent news
      },
    );

    return res.status(200).json({
      success: true,
      message: data.articles,
    });
  } catch (error) {
    // Keep server-side logging intact
    console.error("News API Error:", error);

    // 3. Return 503 for unavailable external service or rate limits, otherwise 500
    const statusCode = error.status === 429 || error.status >= 500 ? 503 : 500;

    // 4. Return fixed error message to prevent Information Disclosure
    return res.status(statusCode).json({
      success: false,
      message: "Failed to fetch news",
    });
  }
};
