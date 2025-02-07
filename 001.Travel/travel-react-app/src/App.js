import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomeScreen from "./pages/HomeScreen";
import MainScreen from "./pages/MainScreen";
import Login from "./pages/Login";
import Signup from "./pages/SignUp";
import PostDetail from "./pages/PostDetail";
import Post from "./pages/Post";
import Map from "./pages/Map";
import MyPage from "./pages/MyPage"; // Mypage 추가
import { PostContext } from "./context/PostContext";
import { UserContext } from "./context/UserContext";
import {PlaceContext} from "./context/PlaceContext";
import MapEdit from "./pages/MapEdit";
import { ListContext } from "./context/ListContext";
import { CopyListContext } from "./context/CopyListContext";
import Logo from "./pages/Logo"
import { CopyPlaceListContext } from "./context/CopyPlaceListContext";
import MyPost from "./pages/MyPost";


  
function App() {
  const [placeList, setPlaceList] = useState([]);
  const [list,setList] = useState([]);
  const [copyList,setCopyList] = useState([]);
  const [copyPlaceList,setCopyPlaceList] = useState([]);
  const [postList, setPostList] = useState([]);
  //user정보 저장useState
  const [user, setUser] = useState(() => {
    // 새로고침 시 로컬 스토리지에서 사용자 정보 복원
    const savedUser = localStorage.getItem("user");
    return savedUser && savedUser !== "undefined" ? JSON.parse(savedUser) : null;
  });
  const [googleUser,setGoogleUser] = useState({});
  
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
    <UserContext.Provider value={{user,setUser,googleUser,setGoogleUser }}>
      <PostContext.Provider value={{ postList, setPostList }}>
        <PlaceContext.Provider value={{placeList, setPlaceList}}>
          <ListContext.Provider value={{list, setList}}>
              <CopyListContext.Provider value={{copyList,setCopyList}}>
              <CopyPlaceListContext.Provider value={{copyPlaceList,setCopyPlaceList}}>
                <div className="AppWrapper">
                  <Router>
                    {/* <Logo /> */}
                    <Routes>
                      <Route path="/" element={<HomeScreen />} />
                      <Route path="/main" element={<MainScreen />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route path="postdetail/:id" element={<PostDetail />} />
                      <Route path="post" element={<Post />} />
                      <Route path="postEdit/:id" element={<MapEdit />} />
                      <Route path="map" element={<Map />} />
                      <Route path="/mypost/:id" element={<MyPost />} /> {/* Mypage 경로 추가 */}
                    </Routes>
                  </Router>
                </div>
                </CopyPlaceListContext.Provider>
              </CopyListContext.Provider>
          </ListContext.Provider>
        </PlaceContext.Provider>      
      </PostContext.Provider>
    </UserContext.Provider>
  );
}

export default App;
