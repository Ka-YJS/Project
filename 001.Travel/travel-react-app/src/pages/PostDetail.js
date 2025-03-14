import React, { useContext, useEffect, useState } from "react";
import { TextField, Button } from "@mui/material";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import axios from "axios";
import TopIcon from "../TopIcon/TopIcon";
import config from "../Apikey";

const PostDetail = () => {
    const { user } = useContext(UserContext); // 사용자 정보
    const { id } = useParams(); // 게시글 IDa
    const [previousPath, setPreviousPath] = useState(null);
    const [post, setPost] = useState({});
    const [imageUrls, setImageUrls] = useState([]);
    const [isLiked, setIsLiked] = useState(false); // 좋아요 상태
    const [likeCount, setLikeCount] = useState(0); // 좋아요 개수

    const navigate = useNavigate();
    const location = useLocation(); // 현재 위치 추적

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

    // 게시글 상세 데이터 가져오기
    const getPostDetail = async () => {
        if (!id || id === 'undefined') {
            console.error("Invalid post ID for detail fetching");
            return;
        }
    
        try {
            const token = getAuthToken();
            if (!token) {
                console.error("인증 토큰이 없습니다.");
                return;
            }
    
            // Bearer 접두사 처리
            const authHeader = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    
            const response = await axios.get(`http://${config.IP_ADD}/travel/posts/postDetail/${id}`, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: authHeader,
                    Accept: '*/*'
                },
                withCredentials: true
            });
            
            const data = response.data.data[0];
            setPost(data);
            setImageUrls(data.imageUrls || []);
            setLikeCount(data.likes || 0); // 초기 좋아요 개수 설정
        } catch (error) {
            console.error("Error fetching post details:", error);
            
            // 토큰 오류 처리
            if (error.response && error.response.status === 401) {
                alert("인증 정보가 만료되었습니다. 다시 로그인해주세요.");
                navigate("/login");
                return;
            }
            
            alert("게시글 정보를 불러오는 중 오류가 발생했습니다.");
            navigate(-1); // 이전 페이지로 이동
        }
    };

    // 좋아요 상태 가져오기
    const getLikeStatus = async () => {
        if (!id || id === 'undefined') {
            console.error("Invalid post ID for like status fetching");
            return;
        }
        
        try {
            const token = getAuthToken();
            if (!token) {
                console.error("인증 토큰이 없습니다.");
                return;
            }
            
            // Bearer 접두사 처리
            const authHeader = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
            
            const response = await axios.get(`http://${config.IP_ADD}/travel/likes/${id}/isLiked`, {
                headers: { 
                    Authorization: authHeader,
                    Accept: '*/*'
                },
                withCredentials: true
            });
            setIsLiked(response.data); // 좋아요 상태 설정
        } catch (error) {
            console.error("Error fetching like status:", error);
        }
    };

    // 좋아요 버튼 클릭
    const likeButtonClick = async () => {
        try {
            const token = getAuthToken();
            if (!token) {
                alert("인증 정보가 없습니다. 다시 로그인해주세요.");
                navigate("/login");
                return;
            }
            
            // Bearer 접두사 처리
            const authHeader = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
            
            console.log("isLiked"+isLiked)
            const url = `http://${config.IP_ADD}/travel/likes/${id}`;
            const method = isLiked ? "delete" : "post"; // Toggle between POST and DELETE
    
            // Make the API request to toggle like status
            const response = await axios({
                method,
                url,
                headers: { Authorization: authHeader },
                withCredentials: true
            });
    
            setIsLiked(!isLiked);
            if(isLiked){
                setLikeCount(count=>count-1)
            }else{
                setLikeCount(count=>count+1)
            }
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

    // 페이지 이동 전 이전 경로를 저장
    useEffect(() => {
        setPreviousPath(location.state?.from);
    }, [location]);

    useEffect(() => {
        
        // id가 존재하는지 확인하고 초기 데이터 로드
        if (id && id !== 'undefined' && user) {
            // 정상 케이스: ID와 사용자 정보가 있을 때
            getPostDetail();
            getLikeStatus();
        } else {
            // 에러 상황 세분화
            if (!id || id === 'undefined') {
                console.error("유효하지 않은 게시글 ID:", id);
                alert("게시글 정보를 찾을 수 없습니다.");
                // 게시글 목록으로 리다이렉트
                navigate('/post', { replace: true }); // replace: true로 이전 페이지를 대체
            } else if (!user) {
                console.error("사용자 정보 없음");
                alert("사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.");
                navigate('/login', { replace: true });
            }
        }
    }, [id, user, navigate]); // navigate도 의존성 배열에 추가

    if (!post) {
        return (
            <div style={{ textAlign: "center", padding: "20px", }}>
                <h2>잘못된 경로입니다.</h2>
                <Button variant="contained" color="primary" onClick={() => navigate("/Post")}>
                    게시글 목록으로 이동
                </Button>
            </div>
        );
    }

    // 목록 버튼 클릭
    const listButtonClick = () => {
        if (previousPath && previousPath.includes(`/mypost/${getUserId()}`)) {
            navigate(`/mypost/${getUserId()}`); // 이전 경로로 이동
        } else {
            navigate("/post");
        }
    };

    // 수정 버튼 클릭
    const toPostEdit = () => {
        navigate(`/postEdit/${id}`, { state: { from: location.state?.from } });
    };

    // 삭제 버튼 클릭
    const handleDelete = async () => {
        if (window.confirm("게시글을 삭제하시겠습니까?")) {
            try {
                const token = getAuthToken();
                if (!token) {
                    alert("인증 정보가 없습니다. 다시 로그인해주세요.");
                    navigate("/login");
                    return;
                }
                
                // Bearer 접두사 처리
                const authHeader = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
                
                const response = await axios.delete(`http://${config.IP_ADD}/travel/postDelete/${id}`, {
                    headers: {
                        Authorization: authHeader,
                        Accept: '*/*'
                    },
                    withCredentials: true
                });
                if (response.data) {
                    alert("삭제되었습니다.");
                    if (previousPath && previousPath.includes(`/mypost/${getUserId()}`)) {
                        navigate(`/mypost/${getUserId()}`); // 이전 경로로 이동
                    } else {
                        navigate("/post");
                    }
                } else {
                    alert("삭제에 실패했습니다.");
                }
            } catch (error) {
                console.error("Error deleting post:", error);
                alert("삭제 중 오류가 발생했습니다.");
            }
        }
    };

    return (
        <div>
            <TopIcon text=" 게시글 보기" />
            <div style={{ justifyItems: "center" }}>
                <div
                    style={{
                        position: "relative",
                        marginTop: "150px",
                        zIndex: "-1",
                        minWidth: "90%",
                        
                    }}
                >
                    {/* 제목 */}
                    <TextField
                        style={{ marginBottom: "20px" }}
                        InputProps={{
                            readOnly: true,
                        }}
                        value={post.postTitle || "제목"}
                        fullWidth
                        variant="outlined"
                        label="제목"
                    />
                    {/* 작성자 */}
                    <TextField
                        style={{ marginBottom: "20px" }} // 여백 추가
                        InputProps={{
                            readOnly: true,
                        }}
                        label="작성자"
                        fullWidth
                        variant="outlined"
                        value={post.userNickname || "알 수 없는 사용자"}
                    />
                    {/* 여행지 */}
                    <TextField
                        style={{ marginBottom: "20px" }} // 여백 추가
                        inputProps={{
                            readOnly: true,
                        }}
                        fullWidth
                        variant="outlined"
                        label="여행지"
                        value={post.placeList?.join(" -> ") || "등록된 여행지가 없습니다."}
                    />
                    {/* 내용 */}
                    <TextField
                        style={{ marginBottom: "20px"}} // 여백 추가
                        InputProps={{
                            readOnly: true,
                        }}
                        value={post.postContent || "내용"}
                        fullWidth
                        variant="outlined"
                        label="내용"
                        multiline
                        rows={8}
                    />
                    {/* 이미지 */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(5, 1fr)",
                            gap: "10px",
                            marginTop: "20px",
                            
                        }}
                    >
                        {imageUrls.map((image, index) => (
                            <div
                                key={index}
                                style={{
                                    display: "flex",
                                    width: "200px",
                                    height: "200px",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    border: "1px solid #ddd",
                                    borderRadius: "5px",
                                    overflow: "hidden",
                                    backgroundColor: "#f9f9f9",
                                   
                                }}
                            >
                                <img
                                    src={`http://${config.IP_ADD}${image}`}
                                    alt={`image-${index}`}
                                    style={{
                                        height: "20vh",
                                        width: "20vw",
                                        padding: 0,
                                        margin: 0,
                                        
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                    
                </div>
                {/* 좋아요 버튼 */}
                <div style={{ marginTop: "20px", display: "flex", alignItems: "center" }}>
                        <Button
                            onClick={likeButtonClick}
                            style={{
                                minWidth: "auto",
                                padding: "0px",
                                margin: "0px",
                                background: "none",
                                border: "none", // 테두리 제거
                                outline: "none", // 외부 테두리 제거
                                cursor: "pointer", // 클릭 커서 스타일
                            }}
                        >
                <span style={{ fontSize: "25px" }}>
                    {isLiked ? "❤️" : "🤍"} {/* 좋아요 상태에 따라 하트 색상 변경 */}
                </span>
                </Button>
                <span style={{ fontSize: "25px" }}>
                    {likeCount}
                </span>
                </div>

                {/* 버튼 영역 */}
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={listButtonClick}
                        style={{ width: "10%" ,backgroundColor :"#45a347",fontFamily: "'GowunDodum-Regular', sans-serif"
                        }}
 
                    >
                        목록
                    </Button>
                    {String(post.userId) === String(getUserId()) && (
                        <div>
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={toPostEdit}
                                style={{ width: "10%",fontFamily: "'GowunDodum-Regular', sans-serif"}}
                            >
                                수정
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={handleDelete}
                                style={{ width: "10%",fontFamily: "'GowunDodum-Regular', sans-serif" }}
                            >
                                삭제
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostDetail;