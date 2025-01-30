import React from 'react'
import { BrowserRouter,Routes,Route } from 'react-router-dom'
import Signup from './User/SignUp';
import Login from './User/Login';



function AppRouter(){
    return(
        <div>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                </Routes>
            </BrowserRouter>
        </div>  
    )
}

export default AppRouter;