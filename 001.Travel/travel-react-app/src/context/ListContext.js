import React, { createContext, useState } from "react";

// 초기값을 빈 배열로 설정
export const ListContext = createContext({ list: [], setList: () => {} });

// ListProvider 컴포넌트 추가
export const ListProvider = ({ children }) => {
  const [list, setList] = useState([]);

  return (
    <ListContext.Provider value={{ list, setList }}>
      {children}
    </ListContext.Provider>
  );
};