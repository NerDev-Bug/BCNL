import { Link, useLocation } from 'react-router-dom'
import DeliveryLayout from './layouts/delivery'

function NavLink({ to, children }) {
  const location = useLocation()
  const isActive = location.pathname === to
  
  return (
    <Link 
      to={to} 
      className={`mr-10 pb-1 ${isActive ? 'border-b-4 border-[#7B2220]' : ''}`}
    >
      {children}
    </Link>
  )
}

function Navbar() {
  return (
    <>
      <nav className="fixed top-0 left-0 right-0 p-3 bg-gray-100 z-50">
        <div className="flex items-center justify-between">
          <div className="">
            <img src="./images/bcnl_logo.png" alt="Logo" className='w-17 h-10' />
          </div>
          <div className='text-black font-semibold'>
            <NavLink to="/">Home</NavLink>
            <NavLink to="/order">Order</NavLink>
            <NavLink to="/menu">Menu</NavLink>
            <NavLink to="/our-story">Our Story</NavLink>
          </div>
          <div className='flex flex-row'>
            <img src="./images/favorite.png" alt="favorite" className='w-5 h-5 mr-4' />
            <img src="./images/user.png" alt="user" className='w-5 h-5 mr-4' />
            <img src="./images/cart.png" alt="cart" className='w-5 h-5' />
          </div>
        </div>
      </nav>
      <DeliveryLayout />
    </>
  )
}

export default Navbar
