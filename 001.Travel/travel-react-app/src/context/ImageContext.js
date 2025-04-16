import React, { createContext, useContext, useState } from "react";
import { UserContext } from "./UserContext";

export const ImageContext = createContext(null);

export const ImageProvider = ({ children }) => {
  const { user } = useContext(UserContext);
  const [imageCache, setImageCache] = useState({});

  // 인증 토큰 가져오기
  const getAuthToken = () => {
    const storedToken = localStorage.getItem('accessToken');
    
    if (storedToken) {
      return storedToken.startsWith("Bearer ") ? storedToken : `Bearer ${storedToken}`;
    }
    
    if (user && user.accessToken) {
      return user.accessToken.startsWith("Bearer ") ? user.accessToken : `Bearer ${user.accessToken}`;
    }
    
    if (user && user.token) {
      return user.token.startsWith("Bearer ") ? user.token : `Bearer ${user.token}`;
    }
    
    return null;
  };

  return (
    <ImageContext.Provider value={{ getAuthToken }}>
      {children}
    </ImageContext.Provider>
  );
};