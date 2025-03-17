import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PostContext } from "../context/PostContext";
import { Button } from "@mui/material";
import TopIcon from "../TopIcon/TopIcon";
import "../css/Post.css";
import axios from "axios";
import { PlaceContext } from "../context/PlaceContext";
import { ListContext } from "../context/ListContext";
import { UserContext } from "../context/UserContext";
import imageno from "../image/imageno.PNG";
import config from "../Apikey";
import backgroundImage from "../image/flowers.png";

const Post = () => {
    const navigate = useNavigate();
    const { user } = useContext(UserContext);
    const { postList, setPostList } = useContext(PostContext);
    const [likedPosts, setLikedPosts] = useState({});
    const [searchQuery, setSearchQuery] = useState(""); // 검색어
    const [currentPage, setCurrentPage] = useState(1); // 현재 페이지
    const postsPerPage = 10; // 페이지당 게시물 수
    const { list, setList } = useContext(ListContext);

    // 인증 토큰 일관되게 가져오기
    const getAuthToken = () => {
        // user.token이 가장 신뢰할 수 있는 소스
        if (user && user.token) {
            return user.token;
        }
        
        // 그 다음 accessToken 확인
        if (user && user.accessToken) {
            return user.accessToken;
        }
        
        // 마지막으로 localStorage 확인
        const storedToken = localStorage.getItem('accessToken');
        if (storedToken) {
            return storedToken;
        }
        
        return null;
    };

    // 사용자 ID 가져오기 - 일관된 방식
    const getUserId = () => {
        if (!user) return null;
        return user.id || null;
    };

    // 서버에서 게시물 가져오기
    const getPostList = async () => {
        try {
            const token = getAuthToken();
            if (!token) {
                console.error("인증 토큰이 없습니다.");
                return;
            }

            // Bearer 접두사 처리
            const authHeader = token.startsWith("Bearer ") ? token : `Bearer ${token}`;

            const response = await axios.get(`http://${config.IP_ADD}/travel/posts`, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: authHeader,
                },
            });

            const fetchedPosts = response.data.data;

            // 좋아요 상태 한번에 가져오기
            const likedStatusPromises = fetchedPosts.map((post) =>
                axios.get(`http://${config.IP_ADD}/travel/likes/${post.postId}/isLiked`, {
                    headers: { 
                        Authorization: authHeader,
                        Accept: '*/*'
                    },
                    withCredentials: true
                })
            );

            // 모든 API 호출 완료 후, 상태 설정
            const likedStatusResponses = await Promise.all(likedStatusPromises);
            const likedStatus = likedStatusResponses.reduce((acc, response, index) => {
                acc[fetchedPosts[index].postId] = response.data;
                return acc;
            }, {});

            setLikedPosts(likedStatus); // 좋아요 상태 업데이트
            setPostList(fetchedPosts); // 게시물 리스트 설정

        } catch (error) {
            console.error("Error fetching posts:", error);
            
            // 토큰 오류 처리
            if (error.response && error.response.status === 401) {
                alert("인증 정보가 만료되었습니다. 다시 로그인해주세요.");
                navigate("/login");
            }
        }
    };

    // 컴포넌트 마운트 시 list 초기화 추가
    useEffect(() => {
        // list가 있고 비어있지 않으면 초기화
        if (list && list.length > 0) {
            console.log("Post.js - list 초기화");
            setList([]);
        }
    }, []); // 마운트 시 한 번만 실행

    // 컴포넌트 마운트 시 게시물 가져오기
    useEffect(() => {
        if (user) {
            getPostList();
        }
    }, [user]);

    // 검색 및 필터링
    const filteredPosts = Array.isArray(postList)
        ? postList.filter((post) =>
            searchQuery === "" ||
            (post.postTitle && post.postTitle.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        : [];

    // 게시물 순서를 역순으로 변경
    const reversedPosts = filteredPosts.slice().reverse();

    // 페이지네이션 계산
    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    const currentPosts = reversedPosts.slice(indexOfFirstPost, indexOfLastPost);

    // 페이지 변경
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // 글쓰기 페이지 이동
    const toWritePage = () => {
        navigate("/map");
    };

    // 좋아요 버튼 클릭
    const likeButtonClick = async (postId) => {
        try {
            const token = getAuthToken();
            if (!token) {
                alert("인증 정보가 없습니다. 다시 로그인해주세요.");
                navigate("/login");
                return;
            }

            // Bearer 접두사 처리
            const authHeader = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
            
            const isLiked = likedPosts[postId];
            const url = `http://${config.IP_ADD}/travel/likes/${postId}`;
            const method = isLiked ? "delete" : "post";

            await axios({ 
                method, 
                url, 
                headers: { 
                    Authorization: authHeader,
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
            setPostList((prev) =>
                prev.map((post) =>
                    post.postId === postId
                        ? { ...post, likes: isLiked ? post.likes - 1 : post.likes + 1 }
                        : post
                )
            );
        } catch (error) {
            console.error("Error updating like:", error);
            
            // 토큰 오류 처리
            if (error.response && error.response.status === 401) {
                alert("인증 정보가 만료되었습니다. 다시 로그인해주세요.");
                navigate("/login");
                return;
            }
            
            alert("좋아요 처리 중 문제가 발생했습니다.");
        }
    };

    // 게시글 상세 페이지 이동
    const handlePostClick = (id) => {
        navigate(`/postdetail/${id}`, { state: { from: `/post` } });
    };

    // 나의 기록 페이지 이동
    const toMyPost = () => {
        const userId = getUserId();
        if (!userId) {
            alert("사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.");
            navigate("/login");
            return;
        }
        navigate(`/mypost/${userId}`);
    };

    return (
        <div style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }} >
            <TopIcon text="기록일지" />
            <div className="post">
                <table>
                    <tbody>
                        <tr
                            className="post_list"
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                justifyContent: "left",
                                gap: "39px",
                                margin: "0 auto",
                                maxWidth: "1100px",
                            }}
                        >
                            {currentPosts.length > 0 ? (
                                currentPosts.map((post) => (
                                    <td
                                        key={post.postId}
                                        style={{
                                            width: "180px",
                                            textAlign: "center",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <img
                                            onClick={() => handlePostClick(post.postId)}
                                            src={
                                                post.imageUrls && post.imageUrls.length > 0
                                                    ? `http://${config.IP_ADD}${post.imageUrls[0]}`
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
                                                alignItems: "flex-end",
                                                marginRight: "10px",
                                            }}
                                        >
                                            <h3
                                                style={{
                                                    margin: 0,
                                                    width: "150px",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    textAlign: "right",
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
                        gap: "20px",
                    }}
                >
                    <Button
                        variant="contained"
                        onClick={toMyPost}
                        sx={{ width: "10%", backgroundColor: "#4caf50", fontFamily: "'GowunDodum-Regular', sans-serif" }}
                    >
                        나의 기록
                    </Button>
                    <Button
                        variant="contained"
                        onClick={toWritePage}
                        sx={{
                            width: "10%",
                            backgroundColor: "#4caf50",
                            fontFamily: "'GowunDodum-Regular', sans-serif"
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
                            marginBottom: "20px",
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default Post;