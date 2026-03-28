import GNews from "@gnews-io/gnews-io-js";

const client = new GNews(process.env.GNEWS_API);

export const getNews = async (req, res) => {
  // Search for articles
  try {
    const data= await client.search("sports", {
      lang: "en", // Optional, languages of articles
      country: "in", // Optional, country of origin of the source
      max: 10, // Optional, maximum number of articles to be returned
      //   from: "2025-01-01T00:00:00Z", // Optional, minimum publication date (included)
    //   to: new Date(), // Optional, maximum publication date (included)
      // ..., any additional parameter specified in the documentation (see https://docs.gnews.io)
    });
    
    res.json({
        success:true,
        message:data.articles
    })
  } catch (error) {
    console.log(error);
    return res.json({
        success:false,
        message:error.message
    })
  }
};
