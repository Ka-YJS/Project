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
    const {list} = useContext(ListContext);
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
            console.log("소셜 로그인 여부:", socialLoginCheck);
            console.log("현재 사용자 정보:", user);
        }
    }, [user]);

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
        if (!user) return null;
        
        // 소셜 로그인, 일반 로그인 모두 id 그대로 사용
        if (user.id) return user.id;
        
        // 하위 호환성을 위해 남겨둠
        if (user.userid) return user.userid;
        
        return null;
    };

    const getAuthToken = () => {
        // localStorage에서 직접 토큰 확인 (가장 우선적으로 확인)
        const storedToken = localStorage.getItem('accessToken');
        if (storedToken) {
            console.log("localStorage 토큰 사용:", storedToken);
            return storedToken;
        }
        
        if (!user) return null;
        
        // 소셜 로그인 토큰
        if (user.accessToken) {
            console.log("user.accessToken 사용:", user.accessToken);
            return user.accessToken;
        }
        
        // 일반 로그인 토큰
        if (user.token) {
            console.log("user.token 사용:", user.token);
            return user.token;
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
        const token = getAuthToken();

        formData.append("postTitle", postTitle);
        formData.append("postContent", postContent);
        formData.append("userNickName", userNickName);
        formData.append("placeList", list.join(", "));
        selectedFiles.forEach((file) => formData.append("files", file));
    
        try {
            // 폼 데이터 로깅 (디버깅용)
            for (let [key, value] of formData.entries()) {
                console.log(key, value);
            }
            console.log("사용자 ID:", userId);
            console.log("사용자 토큰:", token);
            
            // API 엔드포인트 확인
            const endpoint = `http://${config.IP_ADD}/travel/write/${userId}`;
            console.log("API 엔드포인트:", endpoint);
            
            // 헤더 설정
            const headers = {
                "Content-Type": "multipart/form-data"
            };
            
            // 토큰이 있으면 Authorization 헤더 추가
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }
            
            const response = await axios.post(endpoint, formData, {
                headers: headers,
                withCredentials: true
            });

            console.log("Response:", response);
            alert("글이 저장되었습니다!");
            navigate("/PostDetail/" + response.data.postId);
        } catch (error) {
            console.error("Error saving post:", error);
            alert("저장 중 오류가 발생했습니다.");
            if (error.response) {
                console.log("Response Data:", error.response.data);
                console.log("Response Status:", error.response.status);
                
                // 토큰 오류인 경우
                if (error.response.status === 403 && error.response.data.includes("Token validation failed")) {
                    alert("인증 정보가 만료되었습니다. 다시 로그인해주세요.");
                    navigate("/login");
                }
            }
        }
    };

    // 취소 버튼 핸들러
    const handleCancel = () => {
        setPostTitle("");
        setPostContent("");
        if (window.confirm("글 작성을 취소하시겠습니까?")) {
            alert("글 작성이 취소되었습니다.");
            navigate("/post");
        }
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
                    value={list.join(" -> ")}
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