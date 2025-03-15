import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomeScreen from "./pages/HomeScreen";
import MainScreen from "./pages/MainScreen";
import Login from "./pages/Login";
import Signup from "./pages/SignUp";
import PostDetail from "./pages/PostDetail";
import Post from "./pages/Post";
import Map from "./pages/Map";
import MyPage from "./pages/MyPage"; 
import { PostContext } from "./context/PostContext";
import { UserContext } from "./context/UserContext";
import { PlaceContext } from "./context/PlaceContext";
import MapEdit from "./pages/MapEdit";
import { ListContext } from "./context/ListContext";
import { CopyListContext } from "./context/CopyListContext";
import Logo from "./pages/Logo"
import { CopyPlaceListContext } from "./context/CopyPlaceListContext";
import MyPost from "./pages/MyPost";
import { ListProvider } from "./context/ListContext"; // ListProvider 임포트 확인

function App() {
  const [placeList, setPlaceList] = useState([]);
  const [copyList, setCopyList] = useState([]);
  const [copyPlaceList, setCopyPlaceList] = useState([]);
  const [postList, setPostList] = useState([]);
  
  // user 정보 저장 useState
  const [user, setUser] = useState(() => {
    // 새로고침 시 로컬 스토리지에서 사용자 정보 복원
    const savedUser = localStorage.getItem("user");
    return savedUser && savedUser !== "undefined" ? JSON.parse(savedUser) : null;
  });
  const [googleUser, setGoogleUser] = useState({});
  
  // user 상태가 변경될 때 로컬 스토리지에 저장
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }
  }, [user]);

  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(process.env.REACT_APP_KAKAO_KEY);
    }
  }, []);

  return (
    <ListProvider>
      <UserContext.Provider value={{user, setUser, googleUser, setGoogleUser}}>
        <PostContext.Provider value={{postList, setPostList}}>
          <PlaceContext.Provider value={{placeList, setPlaceList}}>
            <CopyListContext.Provider value={{copyList, setCopyList}}>
              <CopyPlaceListContext.Provider value={{copyPlaceList, setCopyPlaceList}}>
                <div className="AppWrapper">
                  <Router>
                    <Routes>
                      <Route path="/" element={<HomeScreen />} />
                      <Route path="/main" element={<MainScreen />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route path="postdetail/:id" element={<PostDetail />} />
                      <Route path="post" element={<Post />} />
                      <Route path="postEdit/:id" element={<MapEdit />} />
                      <Route path="map" element={<Map />} />
                      <Route path="/mypost/:id" element={<MyPost />} />
                    </Routes>
                  </Router>
                </div>
              </CopyPlaceListContext.Provider>
            </CopyListContext.Provider>
          </PlaceContext.Provider>
        </PostContext.Provider>
      </UserContext.Provider>
    </ListProvider>
  );
}

export default App;