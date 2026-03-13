import React from 'react'
import { Link } from 'react-router'
import { navItems,HiddenItems } from '../constants'
import Button from './Button'

const Navbar = () => {
  return (
    <section className=''>
      <nav className='flex justify-between items-center'>
        <Link to="/"> AthLead</Link>
        <ul className='flex justify-around items-center gap-8'>
          {navItems.map((item)=>(
            <li key={item.name}>
              <Link to={item.path}>{item.name}</Link>
            </li>
          ))}
        </ul>
        <div>
          <Button/>
        </div>
      </nav>
    </section>
  )
}

export default Navbar

