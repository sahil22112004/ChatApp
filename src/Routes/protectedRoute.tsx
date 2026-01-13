import {useSelector} from "react-redux"
 import {Navigate, useLocation} from "react-router"
 import type{RootState} from '../redux/store'
import { ReactElement } from "react";


 const ProtectedRoute = ({children} : {children: ReactElement}) => {

     let location = useLocation();
     const user = useSelector((state:RootState) => state.auth.currentUser);

     if(!user) {
         return <Navigate to="/" state={{ from: location}} replace />
     }
  return children

 };

 export default ProtectedRoute;