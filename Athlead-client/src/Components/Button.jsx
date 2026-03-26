import React from 'react'

const Button = ({label,classname}) => {
  return (
    <div className={`h-10 w-24 flex items-center justify-center rounded-xl ml-4 cursor-pointer  ${classname}`} >
      <div className='text-center'>
        {label}
      </div>   
    </div>
  )
}

export default Button
