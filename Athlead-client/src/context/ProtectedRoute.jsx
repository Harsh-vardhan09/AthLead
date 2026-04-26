import { Navigate, useNavigate } from "react-router"
import { useAuth } from "./AppProvider"
import { Children } from "react"




const ProtectedRoute = ({children}) => {

    const {loggedIn}=useAuth()
  
    if(!loggedIn){
        return <Navigate to={'/login'} replace/>
    }
  return children
}

export default ProtectedRoute
