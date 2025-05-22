import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import TopIcon from "../TopIcon/TopIcon";
import "../css/Post.css";
import axios from "axios";
import { UserContext } from "../context/UserContext";
import imageno from "../image/imageno.PNG";
import config from "../Apikey";
import backgroundImage from "../image/flowers.png";

const MyPost = () => {
    const navigate = useNavigate();

    const { user } = useContext(UserContext);
    
    const [myPostList, setMyPostList] = useState([]);
    const [likedPosts, setLikedPosts] = useState({});
    const [searchQuery, setSearchQuery] = useState(""); // 검색어
    const [currentPage, setCurrentPage] = useState(1); // 현재 페이지
    const postsPerPage = 10; // 페이지당 게시물 수

    // 인증 토큰 일관되게 가져오기
    const getAuthToken = () => {
        try {
            // 토큰 소스 확인
            let token = user?.token || user?.accessToken || localStorage.getItem('accessToken');
            
            if (!token) {
                console.error("인증 토큰이 없습니다.");
                return null;
            }
            
            // Bearer 접두사 중복 방지 처리
            if (token.startsWith("Bearer ")) {
                return token;
            } else {
                return `Bearer ${token}`;
            }
        } catch (error) {
            console.error("토큰 처리 중 오류:", error);
            return null;
        }
    };

    // 사용자 ID 가져오기
    const getUserId = () => {
        if (!user) {
            console.error("사용자 정보가 없습니다");
            return null;
        }
        
        // 단순하게 ID만 반환 (API 스펙에 맞게 수정 필요)
        return user.id || user.userid || null;
        
        // 만약 서버에서 소셜 로그인을 접두사 형식으로 기대한다면 아래 코드 사용
        /*
        const isSocialLogin = user.authProvider === 'GOOGLE' || user.authProvider === 'KAKAO';
        if (isSocialLogin && user.id) {
            const provider = user.authProvider?.toLowerCase() || 'social';
            return `${provider}_${user.id}`;
        }
        return user.id || user.userid || null;
        */
    };

    // 서버에서 게시물 가져오기
    const getMyPostList = async () => {
        try {
            const userId = getUserId();
            if (!userId) {
                console.error("사용자 ID를 찾을 수 없습니다.");
                alert("사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.");
                navigate("/login");
                return;
            }
            
            const token = getAuthToken();
            if (!token) {
                console.error("인증 토큰을 찾을 수 없습니다.");
                alert("인증 정보가 없습니다. 다시 로그인해주세요.");
                navigate("/login");
                return;
            }
            
            console.log("요청 사용자 ID:", userId);
            console.log("사용자 데이터:", user);
            console.log("인증 토큰:", token);
            
            // API 엔드포인트 호출
            const response = await axios.get(`https://${config.IP_ADD}/travel/myPosts/${userId}`, {
                headers: {
                    Authorization: token,
                    Accept: '*/*'
                },
                withCredentials: true // 필요한 경우에만 활성화 (문제 발생시 false로 변경)
            });
    
            console.log("응답 데이터:", response.data);
            
            // 데이터 구조 확인 로직 추가
            let fetchedPosts = [];
            if (response.data && response.data.data) {
                fetchedPosts = response.data.data;
            } else if (Array.isArray(response.data)) {
                fetchedPosts = response.data;
            } else {
                console.error("예상치 못한 응답 구조:", response.data);
                fetchedPosts = [];
            }

            console.log("처리된 게시물 데이터:", fetchedPosts);
            console.log("게시물 수:", fetchedPosts.length);

            // 좋아요 상태 가져오기
            if (fetchedPosts.length > 0) {
                const likedStatusPromises = fetchedPosts.map((post) =>
                    axios.get(`https://${config.IP_ADD}/travel/likes/${post.postId}/isLiked`, {
                        headers: { 
                            Authorization: token,
                            Accept: '*/*'
                        },
                        withCredentials: true
                    }).catch(error => {
                        console.log(`Post ${post.postId} like status error:`, error);
                        return { data: { liked: false } }; // 에러 발생 시 기본값 반환
                    })
                );

                const likedStatusResponses = await Promise.all(likedStatusPromises);
                const likedStatus = likedStatusResponses.reduce((acc, response, index) => {
                    acc[fetchedPosts[index].postId] = response.data?.liked || false;
                    return acc;
                }, {});

                setLikedPosts(likedStatus); // 좋아요 상태 업데이트
            }

            setMyPostList(fetchedPosts); // 게시물 리스트 설정

        } catch (error) {
            console.error("Error fetching posts:", error);
            console.error("Error details:", error.response || "No response");
            
            // 오류 응답 상세 로깅
            if (error.response) {
                console.error("Status:", error.response.status);
                console.error("Headers:", error.response.headers);
                console.error("Data:", error.response.data);
            }
            
            // HTML 응답 체크 - 덜 제한적인 방식으로 수정
            const isHtmlResponse = error.response && 
                typeof error.response.data === 'string' && 
                (error.response.data.includes('<!DOCTYPE html>') || 
                 error.response.data.includes('<html>'));
                
            if (isHtmlResponse) {
                console.log("HTML 응답 감지됨 - 로그인 필요");
                alert("세션이 만료되었습니다. 다시 로그인해주세요.");
                navigate("/login");
                return;
            }
            
            // 응답 상태 체크
            if (error.response) {
                if (error.response.status === 403) {
                    alert("접근 권한이 없습니다. 다시 로그인해주세요.");
                    navigate("/login");
                } else if (error.response.status === 401) {
                    alert("인증이 필요합니다. 다시 로그인해주세요.");
                    navigate("/login");
                } else {
                    alert("게시물을 불러오는 중 오류가 발생했습니다.");
                }
            } else {
                alert("서버 연결에 실패했습니다.");
            }
        }
    };

    // 컴포넌트 마운트 시 게시물 가져오기
    useEffect(() => {
        if (user) {
            console.log("사용자 정보 존재함, 게시물 가져오기 시도");
            getMyPostList();
        } else {
            console.log("사용자 정보 없음, 로그인 페이지로 이동");
            alert("로그인이 필요합니다.");
            navigate("/login");
        }
    }, [user, navigate]); // navigate 의존성 추가


    // 좋아요 버튼 클릭
    const likeButtonClick = async (postId) => {
        try {
            const token = getAuthToken();
            if (!token) {
                alert("인증 정보가 없습니다. 다시 로그인해주세요.");
                navigate("/login");
                return;
            }
            
            const isLiked = likedPosts[postId];
            const url = `https://${config.IP_ADD}/travel/likes/${postId}`;
            const method = isLiked ? "delete" : "post";
    
            await axios({ 
                method, 
                url, 
                headers: { 
                    Authorization: token,
                    Accept: '*/*'
                },
                withCredentials: true
            });
    
            // 좋아요 상태 업데이트
            setLikedPosts((prev) => ({
                ...prev,
                [postId]: !isLiked,
            }));
    
            // 게시물의 좋아요 수 업데이트
            setMyPostList((prev) =>
                prev.map((post) =>
                post.postId === postId
                    ? { ...post, likes: isLiked ? post.likes - 1 : post.likes + 1 }
                    : post
                )
            );
        } catch (error) {
            console.error("Error updating like:", error);
            
            // 오류 처리 개선
            if (error.response && error.response.status === 401) {
                console.error("인증 오류");
                alert("인증 정보가 만료되었습니다. 다시 로그인해주세요.");
                navigate("/login");
            } else {
                alert("좋아요 처리 중 문제가 발생했습니다.");
            }
        }
    };

    // 검색 및 필터링
    const filteredPosts = Array.isArray(myPostList)
        ? myPostList.filter((post) =>
            searchQuery === "" ||
            (post.postTitle && post.postTitle.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        : [];
        
    
    // 게시물 순서를 역순으로 변경
    const reversedPosts = filteredPosts.slice().reverse(); 

    // 페이지네이션 계산
    const totalPages = Math.ceil(filteredPosts.length / postsPerPage); // 전체 페이지 수
    const indexOfLastPost = currentPage * postsPerPage; // 현재 페이지 마지막 게시물 인덱스
    const indexOfFirstPost = indexOfLastPost - postsPerPage; // 현재 페이지 첫 게시물 인덱스
    const currentPosts = reversedPosts.slice(indexOfFirstPost, indexOfLastPost); // 현재 페이지에 표시할 게시물

    // 페이지 변경
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // 글쓰기 페이지 이동
    const toWritePage = () => {
        navigate("/map");
    };

    // 게시글 상세 페이지 이동
    const handlePostClick = (id) => {
        navigate(`/postdetail/${id}`, { state: { from: `/mypost/${user?.id || ''}` } });
    };

    return (
        <div style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }} >
            <TopIcon text="내 기록 보기"/>
            <div className="post">
                <table>
                    <tbody>
                        <tr 
                            className="post_list" 
                            style={{ 
                                display: "flex",
                                flexWrap: "wrap", // 아이템들이 화면에 맞게 줄 바꿈
                                justifyContent: "center", // 중앙 정렬
                                gap: "20px", // 아이템들 간의 간격
                                margin: "0 auto",
                                maxWidth: "1100px", // 최대 너비 설정
                            }}
                        >
                            {currentPosts.length > 0 ? (
                                currentPosts.map((post) => (
                                    <td
                                        key={post.postId}
                                        style={{
                                            width: "180px", // 각 게시물의 너비
                                            textAlign: "center",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <img
                                            onClick={() => handlePostClick(post.postId)}
                                            src={
                                                post.imageUrls && post.imageUrls.length > 0
                                                    ? `https://${config.IP_ADD}${post.imageUrls[0]}`
                                                    : imageno
                                            }
                                            alt="썸네일"
                                            style={{
                                                width: "100%",
                                                height: "180px",
                                                borderRadius: "5px",
                                                objectFit: "cover",
                                            }}
                                        />
                                        <div 
                                            style={{ 
                                                display: "flex", 
                                                flexDirection: "column", 
                                                alignItems: "flex-start" 
                                            }}
                                        >
                                            <span
                                                className="span_style"
                                                onClick={() => likeButtonClick(post.postId)}
                                                style={{
                                                    cursor: "pointer",
                                                    color: "red",
                                                    marginLeft: "5px",
                                                }}
                                            >
                                                <span style={{ color: "red" }}>
                                                    {likedPosts[post.postId] ? "❤️" : "🤍"}
                                                </span>
                                                <span style={{ color: "black", marginLeft: "5px" }}>
                                                    {post.likes}
                                                </span>  
                                                </span>                                  
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "flex-end", // 오른쪽 정렬
                                                marginRight: "10px", // 오른쪽 여백 추가
                                            }}
                                        >
                                            <h3 
                                                style={{ 
                                                    margin: 0, 
                                                    width:"150px",
                                                    whiteSpace: "nowrap", /* 한 줄로 제한 */
                                                    overflow: "hidden",   /* 넘치는 텍스트 숨기기 */
                                                    textOverflow: "ellipsis", /* 넘치면 '...'으로 표시 */
                                                    textAlign: "right", // 오른쪽 정렬
                                                }}
                                            >
                                                {post.postTitle}                                                
                                            </h3>
                                            <div>
                                                작성자:{post.userNickname}
                                            </div>                                
                                            <div>
                                                {post.postCreatedAt}
                                            </div>                      
                                        </div>
                                    </td>
                                ))
                            ) : (
                                <td>게시글이 없습니다.</td>
                            )}
                        </tr>
                    </tbody>
                </table>

                {/* 글쓰기 버튼 */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginTop: "20px",
                        gap: "20px", // 버튼 간 간격
                    }}
                >
                    <Button
                        variant="contained"
                        onClick={()=>navigate("/post")}
                        sx={{ width: "10%" ,backgroundColor: "#4caf50",fontFamily: "'GowunDodum-Regular', sans-serif"
                         }}
                    >
                        기록일지
                    </Button>
                    <Button
                        variant="contained"
                        onClick={toWritePage}
                        sx={{ width: "10%" ,backgroundColor: "#4caf50",fontFamily: "'GowunDodum-Regular', sans-serif"
                        }}
                    >
                        기록하기
                    </Button>
                </div>

                {/* 페이지네이션 */}
                <div
                    style={{
                        marginTop: "20px",
                        display: "flex",
                        justifyContent: "center",
                        gap: "5px",
                    }}
                >
                    {Array.from({ length: totalPages }, (_, index) => (
                        <button
                            key={index + 1}
                            onClick={() => handlePageChange(index + 1)}
                            style={{
                                padding: "10px 15px",
                                fontSize: "14px",
                                backgroundColor:
                                    currentPage === index + 1 ? "#007bff" : "#fff",
                                color: currentPage === index + 1 ? "#fff" : "#007bff",
                                border: "1px solid #ddd",
                                borderRadius: "5px",
                                cursor: "pointer",
                            }}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>

                {/* 검색 기능 */}
                <div style={{ marginTop: "30px", textAlign: "center" }}>
                    <input
                        type="text"
                        placeholder="게시글 제목 검색 후 엔터"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: "60%",
                            padding: "10px",
                            fontSize: "16px",
                            border: "1px solid #ddd",
                            borderRadius: "5px",
                            textAlign: "center",
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default MyPost;