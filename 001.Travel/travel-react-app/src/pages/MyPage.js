import React from "react";
import { Routes, Route } from "react-router-dom";
import PersonalInfo from "../pages/PersonalInfo";
import MyPost from "./MyPost";
import styled from "styled-components";

const ContentWrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
`;

const MyPage = () => {
  return (
    <ContentWrapper>
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="personalInfo" element={<PersonalInfo />} />
          <Route path="mypost" element={<MyPost />} />
        </Routes>
      </div>
    </ContentWrapper>
  );
};

export default MyPage;
