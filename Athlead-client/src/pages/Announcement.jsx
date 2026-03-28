import React, { useEffect, useState } from 'react'
import { api } from '../api/axios'
import toast, {} from 'react-hot-toast'
import NewsCard from '../Components/NewsCard'

const Announcement = () => {
  const [news,setNews]=useState([])

  const getNews=async () => {
    try {
      const {data}=await api.get('/news');
      console.log(data.message);
      
      if(data.success){
        setNews(data.message);
      }
    } catch (error) {
      toast.error(error.message)
    }
  }
  useEffect(()=>{
    getNews();
  },[])


  return (
    <section className='relative min-h-screen flex flex-col items-center justify-center mt-10 mx-6'>
      <div className='flex item-start w-full max-w-4xl  text-lg lg:text-2xl  mb-6 '>
        <p className='bg-linear-to-b from-teal-600 to-blue-500 font-extrabold mx-1 bg-clip-text text-transparent'>|</p>
        <p className='bg-linear-to-r from-teal-400 to-blue-600 font-extrabold mx-1 bg-clip-text text-transparent'>All Announcements</p>
      </div>
     
      <div className='grid grid-col-1 max-w-4xl w-full items-center justify-start gap-5'>
        {
          news.map((e)=>(
            <NewsCard e={e}/>
          ))
        }
      </div>
      
    </section>
  )
}

export default Announcement
