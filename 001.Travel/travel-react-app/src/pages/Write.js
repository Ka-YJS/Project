import React, { useContext, useState, useEffect } from "react";
import { TextField, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ListContext } from "../context/ListContext";
import { UserContext } from "../context/UserContext";
import { Delete } from "@mui/icons-material";
import axios from "axios";
import '../css/Map.css';  // Map.css 파일을 import
import config from "../Apikey";

const Write = () => {
    const {user} = useContext(UserContext);
    const {list, setList} = useContext(ListContext);
    const [postTitle, setPostTitle] = useState("");
    const [postContent, setPostContent] = useState("");
    const [selectedFiles, setSelectedFiles] = useState([]); // 사용자가 선택한 파일들
    const [previewUrls, setPreviewUrls] = useState([]); // 미리보기 URL들
    const [isSocialLogin, setIsSocialLogin] = useState(false); // 소셜 로그인 여부
    const navigate = useNavigate();

    // 컴포넌트 마운트 시 소셜 로그인 여부 확인
    useEffect(() => {
        if (user) {
            // authProvider가 있으면 소셜 로그인으로 판단
            const socialLoginCheck = user.authProvider === 'GOOGLE' || user.authProvider === 'KAKAO';
            setIsSocialLogin(socialLoginCheck);
        }
    }, [user]);

    // list가 변경될 때마다 다른 필드 초기화하는 useEffect 제거
    // 컴포넌트 마운트 시에만 필요한 초기화 작업을 위한 useEffect
    useEffect(() => {
        // 컴포넌트가 마운트될 때 한 번만 실행
        // 필요한 경우 초기화 코드를 넣을 수 있음
    }, []); // 빈 의존성 배열로 컴포넌트 마운트 시에만 실행

    // 사용자 닉네임 가져오기 (소셜/일반 로그인 모두 지원)
    const getUserNickName = () => {
        if (!user) return "게스트";
        // 소셜 로그인 닉네임
        if (user.nickName) return user.nickName;
        if (user.name) return user.name;
        // 일반 로그인 닉네임
        if (user.userNickName) return user.userNickName;
        return "알 수 없는 사용자";
    };

    // 사용자 ID 가져오기
    const getUserId = () => {
        if (!user) {
            console.error("사용자 정보가 없습니다");
            return null;
        }
        
        // 소셜 로그인인 경우 접두사 추가
        if (isSocialLogin && user.id) {
            // 소셜 로그인 제공자에 따라 접두사 추가
            const provider = user.authProvider?.toLowerCase() || 'social';
            const socialId = `${provider}_${user.id}`;
            return socialId;
        }
        
        // 일반 로그인
        if (user.id) {
            console.log("일반 로그인 ID 사용:", user.id);
            return user.id;
        }
        if (user.userid) {
            console.log("일반 로그인 userid 사용:", user.userid);
            return user.userid;
        }
        
        console.error("유효한 사용자 ID를 찾을 수 없습니다");
        return null;
    };

    const getAuthToken = () => {
        // localStorage에서 먼저 확인
        const storedToken = localStorage.getItem('accessToken');
        
        if (storedToken) {
            const formattedToken = storedToken.startsWith("Bearer ") ? storedToken : `Bearer ${storedToken}`;
            return formattedToken;
        }
        
        if (user && user.accessToken) {
            return user.accessToken.startsWith("Bearer ") ? user.accessToken : `Bearer ${user.accessToken}`;
        }
        
        if (user && user.token) {
            return user.token.startsWith("Bearer ") ? user.token : `Bearer ${user.token}`;
        }
        
        return null;
    };

    //파일 추가 핸들러
    const handleAddImages = async (e) => {
        const files = Array.from(e.target.files);
        
        //10개 이미지 제한
        if (selectedFiles.length + files.length > 10) {
            alert("최대 10개의 이미지만 업로드 가능합니다.");
            return;
        }

        //파일 정보와 미리보기 URL 설정
        setSelectedFiles((prevFiles) => [...prevFiles, ...files]);
        const newPreviews = files.map((file) => URL.createObjectURL(file));
        setPreviewUrls((prevUrls) => [...prevUrls, ...newPreviews]);
    };

    //이미지 삭제 핸들러
    const handleDeleteImage = (index) => {
        setSelectedFiles((prevFiles) => prevFiles.filter((_, idx) => idx !== index));
        setPreviewUrls((prevUrls) => prevUrls.filter((_, idx) => idx !== index));
    };

    //저장 버튼 핸들러
    const handleSave = async () => {
        if (!user) {
            alert("로그인이 필요합니다.");
            navigate("/login");
            return;
        }

        if (!postTitle || !postContent) {
            alert("제목과 내용을 모두 입력해주세요.");
            return;
        }
        
        const token = getAuthToken();
        if (!token) {
            alert("인증 정보가 없습니다. 다시 로그인해주세요.");
            navigate("/login");
            return;
        }
    
        //허용된 파일 확장자 검사
        const allowedExtensions = ["png", "jpg", "jpeg", "gif"];
        const invalidFiles = selectedFiles.filter(
            (file) => !allowedExtensions.includes(file.name.split('.').pop().toLowerCase())
        );
    
        if (invalidFiles.length > 0) {
            alert("허용되지 않은 파일 형식이 포함되어 있습니다.");
            return;
        }
    
        //FormData 생성 및 전송
        const formData = new FormData();
        const userId = getUserId();
        const userNickName = getUserNickName();

        formData.append("postTitle", postTitle);
        formData.append("postContent", postContent);
        formData.append("userNickName", userNickName);
        formData.append("placeList", list.join(", "));
        selectedFiles.forEach((file) => formData.append("files", file));
    
        try {
            
            // API 엔드포인트 확인
            const endpoint = `https://${config.IP_ADD}/travel/write/${userId}`;
            
            // 헤더 설정 및 로깅
            const headers = {
                Authorization: token,
                'Accept': 'application/json'
            };
            console.log("요청 헤더:", headers);
            
            // Axios 요청
            const response = await axios.post(endpoint, formData, {
                headers,
                withCredentials: true
            });
        
            console.log("서버 응답:", response.data);
            
            if (response.data && response.data.postId) {
                // 직접 반환된 PostDTO
                // 저장 성공 후 모든 필드 초기화
                setPostTitle("");
                setPostContent("");
                setSelectedFiles([]);
                setPreviewUrls([]);
                // 여행지 목록 초기화
                setList([]);
                
                alert("글이 저장되었습니다!");
                navigate(`/postdetail/${response.data.postId}`);
            } else if (response.data && response.data.data && response.data.data[0] && response.data.data[0].postId) {
                // ResponseDTO로 감싸진 배열 형태
                // 저장 성공 후 모든 필드 초기화
                setPostTitle("");
                setPostContent("");
                setSelectedFiles([]);
                setPreviewUrls([]);
                // 여행지 목록 초기화
                setList([]);
                
                alert("글이 저장되었습니다!");
                navigate(`/postdetail/${response.data.data[0].postId}`);
            } else if (response.data && response.data.data && response.data.data.postId) {
                // ResponseDTO로 감싸진 단일 객체 형태
                // 저장 성공 후 모든 필드 초기화
                setPostTitle("");
                setPostContent("");
                setSelectedFiles([]);
                setPreviewUrls([]);
                // 여행지 목록 초기화
                setList([]);
                
                alert("글이 저장되었습니다!");
                navigate(`/postdetail/${response.data.data.postId}`);
            } else {
                // postId를 찾을 수 없을 경우
                // 저장 성공 후 모든 필드 초기화
                setPostTitle("");
                setPostContent("");
                setSelectedFiles([]);
                setPreviewUrls([]);
                // 여행지 목록 초기화
                setList([]);
                
                console.error("게시글 ID를 찾을 수 없습니다:", response.data);
                alert("글이 저장되었지만 상세 페이지로 이동할 수 없습니다. 게시글 목록으로 이동합니다.");
                navigate("/post");
            }

        } catch (error) {
            console.error("Error saving post:", error);
            console.error("Error response:", error.response?.data);
            console.error("Error status:", error.response?.status);
            console.error("Error message:", error.message);
            
            // 요청과 응답 상세 정보 로깅
            if (error.config) {
                console.log("Request config:", error.config);
            }
            if (error.request) {
                console.log("Request sent but no response received");
            }
        
            // API 응답이 HTML 형식인지 확인
            if (error.response && error.response.data && 
                (typeof error.response.data === 'string') && 
                error.response.data.includes('<!DOCTYPE html>')) {
                
                alert("인증이 필요합니다. 다시 로그인해주세요.");
                localStorage.removeItem('accessToken');
                navigate("/login");
                return;
            }
                
            alert("저장 중 오류가 발생했습니다. " + (error.response?.data || error.message));
        }
    };

    // 취소 버튼 핸들러
    const handleCancel = () => {
        if (window.confirm("글 작성을 취소하시겠습니까?")) {
            // 모든 필드 초기화
            setPostTitle("");
            setPostContent("");
            setSelectedFiles([]);
            setPreviewUrls([]);
            // 여행지 목록 초기화
            setList([]);
            
            alert("글 작성이 취소되었습니다.");
            navigate("/post");
        }
    };

    // list 값이 유효한지 확인하고 안전하게 표시하는 함수
    const getLocationDisplay = () => {
        
        if (!list) return "여행지를 추가해주세요";
        if (!Array.isArray(list)) {
            console.error("Write.js - list가 배열이 아님:", list);
            return "여행지 데이터가 올바르지 않습니다";
        }
        if (list.length === 0) {
            return "여행지가 없습니다. 지도에서 추가해주세요";
        }
        
        // 배열 항목이 2개 이상일 때만 화살표 추가
        if (list.length === 1) {
            return list[0];
        }
        
        // 배열 항목들 사이에 " -> " 삽입
        let result = list.join(" -> ");
        return result;
    };

    return (
        <div className="write">
            {/* 제목 입력 */}
            <div>
                <TextField
                    fullWidth
                    variant="outlined"
                    label="제목"
                    value={postTitle}
                    onChange={(e) => {setPostTitle(e.target.value)}}
                    placeholder="제목을 입력하세요."
                />
            </div>

            {/* 작성자 표시 */}
            <div>
                <TextField
                    InputProps={{ readOnly: true }}
                    label="작성자"
                    fullWidth
                    variant="outlined"
                    value={getUserNickName()}
                />
            </div>

            {/* 여행지 표시 */}
            <div>
                <TextField
                    inputProps={{readOnly: true}}
                    fullWidth
                    variant="outlined"
                    label="여행지"
                    value={getLocationDisplay()}
                    multiline
                    rows={2}
                />
            </div>

            {/* 내용 입력 */}
            <div>
                <TextField
                    fullWidth
                    variant="outlined"
                    label="내용"
                    value={postContent}
                    onChange={(e) => {setPostContent(e.target.value)}}
                    placeholder="내용을 입력하세요."
                    multiline
                    rows={7}
                />
            </div>

            {/* 이미지 업로드 */}
            <div className="photo_style">
                <label htmlFor="input-file" className="input-file-label">
                    사진추가
                </label>
                <input 
                    type="file" 
                    accept=".png, .jpg, .jpeg, .gif" 
                    id="input-file" 
                    multiple 
                    onChange={handleAddImages} 
                />
                {/* 저장해둔 이미지들을 순회하면서 화면에 이미지 출력 */}
                <div className="image-grid">
                    {previewUrls.map((url, index) => (
                        <div key={index}>
                            <img 
                                src={url} 
                                alt={`preview-${index}`}
                            />
                            <Delete onClick={() => handleDeleteImage(index)} />
                        </div>
                    ))}
                </div>
            </div>

            {/* 저장/취소 버튼 */}
            <div className="write-buttons">
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSave}
                >
                    저 장
                </Button>
                <Button
                    variant="outlined"
                    color="error"
                    onClick={handleCancel}
                >
                    취 소
                </Button>
            </div>
        </div>
    );
};

export default Write;