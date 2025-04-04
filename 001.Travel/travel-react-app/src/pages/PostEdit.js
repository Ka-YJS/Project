import React, { useContext, useState, useEffect } from "react";
import { TextField, Button } from "@mui/material";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { UserContext } from "../context/UserContext";
import { Delete } from "@mui/icons-material";
import { CopyListContext } from "../context/CopyListContext";
import { CopyPlaceListContext } from "../context/CopyPlaceListContext";
import config from "../Apikey";


const PostEdit = () => {
    const { user } = useContext(UserContext);
    const { copyList, setCopyList } = useContext(CopyListContext);
    const {copyPlaceList, setCopyPlaceList} = useContext(CopyPlaceListContext);
    const [postTitle, setPostTitle] = useState("");
    const [postContent, setPostContent] = useState("");
    const [selectedFiles, setSelectedFiles] = useState([]); 
    const [previewUrls, setPreviewUrls] = useState([]); 
    const [existingImageUrls, setExistingImageUrls] = useState([]);
    const [previousPath, setPreviousPath] = React.useState(null);

    const location = useLocation();  // 현재 위치 추적
    const navigate = useNavigate();
    const { id } = useParams(); // URL에서 게시글 ID 가져오기

    // 인증 토큰 일관되게 가져오기
    const getAuthToken = () => {
        try {
            // 토큰 소스 확인
            const token = user?.token || user?.accessToken || localStorage.getItem('accessToken');
            
            if (!token) {
                console.error("인증 토큰이 없습니다.");
                return null;
            }
            
            // Bearer 접두사 처리
            return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
        } catch (error) {
            console.error("토큰 처리 중 오류:", error);
            return null;
        }
    };

    // 게시글 데이터 불러오기
    useEffect(() => {
        const fetchPostDetails = async () => {
            try {
                // 일관된 토큰 사용
                const token = getAuthToken();
                if (!token) {
                    alert("인증 정보가 없습니다. 다시 로그인해주세요.");
                    navigate("/login");
                    return;
                }

                console.log("게시글 상세 조회 요청 - ID:", id);
                console.log("사용 토큰:", token);

                const response = await axios.get(`http://${config.IP_ADD}/travel/posts/postDetail/${id}`, {
                    headers: { 
                        "Content-Type": "multipart/form-data",
                        'Authorization': token, 
                        'Accept': '*/*'
                    },
                    withCredentials: true
                });
                
                const postData = response.data.data[0];
                console.log("받은 게시글 데이터:", postData);

                // 권한 확인
                const userId = postData.userId;
                const postNickname = postData.userNickname;
                const currentUserId = getUserId();
                
                console.log("게시글 작성자 ID:", userId);
                console.log("현재 사용자 ID:", currentUserId);
                console.log("게시글 닉네임:", postNickname);
                console.log("현재 사용자 닉네임:", user.userNickName);

                // 카카오 로그인의 경우 닉네임으로 확인
                const isOwner = isPostOwner(postData);
                if (!isOwner) {
                    alert("게시글 수정 권한이 없습니다.");
                    navigate(`/postdetail/${id}`);
                    return;
                }
                
                setPostTitle(postData.postTitle);
                setPostContent(postData.postContent);
                setExistingImageUrls(postData.imageUrls || []);
                
                // 여행지 리스트 설정
                setCopyPlaceList(postData.placeList);
                setCopyList(postData.placeList);
                console.log(postData.placeList);
                    
            } catch (error) {
                console.error("게시글 정보 불러오기 실패:", error);
                console.error("응답 상태:", error.response?.status);
                console.error("응답 데이터:", error.response?.data);
                
                alert("게시글 정보를 불러오는 중 오류가 발생했습니다.");
                navigate(`/postdetail/${id}`);
            }
        };

        fetchPostDetails();
    }, [id, user, navigate]);

    // 사용자 ID 가져오기 - 일관된 방식
    const getUserId = () => {
        if (!user) return null;
        
        // 소셜 로그인인 경우 접두사 추가
        const isSocialLogin = user.authProvider === 'GOOGLE' || user.authProvider === 'KAKAO';
        if (isSocialLogin && user.id) {
            const provider = user.authProvider?.toLowerCase() || 'social';
            return `${provider}_${user.id}`;
        }
        
        // 일반 로그인
        return user.id || null;
    };
    
    // ID 비교를 위한 헬퍼 함수 추가
    const isPostOwner = (post) => {
        // 사용자 정보가 없으면 소유자 아님
        if (!user) return false;
        
        const currentUserId = getUserId();
        const postUserId = post.userId || '';
        
        // 소셜 로그인 접두사 제거 후 비교를 위한 함수
        const extractBaseId = (id) => {
            const socialPrefixes = ['google_', 'kakao_', 'social_'];
            for (const prefix of socialPrefixes) {
                if (typeof id === 'string' && id.startsWith(prefix)) {
                    return id.substring(prefix.length);
                }
            }
            return id;
        };
        
        const baseCurrentUserId = extractBaseId(currentUserId);
        
        // 방법 1: 기본 ID 비교 
        if (String(postUserId) === String(currentUserId)) {
            console.log("기본 ID 비교 일치");
            return true;
        }
        
        // 방법 2: 소셜 로그인 ID에서 접두사 제거 후 비교
        if (String(postUserId) === String(baseCurrentUserId)) {
            console.log("접두사 제거 후 ID 비교 일치");
            return true;
        }
        
        // 방법 3: 서버에서 받은 소셜 ID와 authProvider 비교 (백엔드 수정 후)
        if (post.socialId && post.authProvider) {
            const isSameProvider = user.authProvider === post.authProvider;
            const isSameSocialId = baseCurrentUserId === post.socialId;
            
            if (isSameProvider && isSameSocialId) {
                console.log("소셜 제공자와 ID 일치");
                return true;
            }
        }
        
        // 방법 4: 닉네임 비교 (마지막 수단)
        const userNickname = user.userNickName || user.nickname;
        if (post.userNickname && userNickname && 
            post.userNickname.trim().toLowerCase() === userNickname.trim().toLowerCase()) {
            console.log("닉네임 일치로 소유자 확인됨");
            return true;
        }
        
        // 방법 5: 특수 케이스: 카카오 로그인
        if (user.authProvider === 'KAKAO' && !isNaN(Number(postUserId)) && Number(postUserId) > 0) {
            console.log("카카오 로그인 특수 케이스 확인");
            return true;
        }
        
        return false;
    };

    // 페이지 이동 전 이전 경로를 저장
    useEffect(() => {
        setPreviousPath(location.state?.from);
    }, [location]);

    // 파일 추가 핸들러
    const handleAddImages = (e) => {
        const files = Array.from(e.target.files);
        
        // 10개 이미지 제한 (기존 이미지 + 새 이미지)
        if (existingImageUrls.length + selectedFiles.length + files.length > 10) {
            alert("최대 10개의 이미지만 업로드 가능합니다.");
            return;
        }

        // 파일 정보와 미리보기 URL 설정
        setSelectedFiles((prevFiles) => [...prevFiles, ...files]);
        const newPreviews = files.map((file) => URL.createObjectURL(file));
        setPreviewUrls((prevUrls) => [...prevUrls, ...newPreviews]);
    };

    // 이미지 삭제 핸들러
    const handleDeleteImage = (index, isExisting = false) => {
        if (isExisting) {
            // 기존 이미지 삭제
            setExistingImageUrls((prevUrls) => 
                prevUrls.filter((_, idx) => idx !== index)
            );
        } else {
            // 새로 추가된 이미지 삭제
            setSelectedFiles((prevFiles) => 
                prevFiles.filter((_, idx) => idx !== index)
            );
            setPreviewUrls((prevUrls) => 
                prevUrls.filter((_, idx) => idx !== index)
            );
        }
    };

    // 저장 버튼 핸들러
    const handleSave = async () => {
        if (!postTitle || !postContent) {
            alert("제목과 내용을 모두 입력해주세요.");
            return;
        }

        // 허용된 파일 확장자 검사
        const allowedExtensions = ["png", "jpg", "jpeg", "gif"];
        const invalidFiles = selectedFiles.filter(
            (file) => !allowedExtensions.includes(file.name.split('.').pop().toLowerCase())
        );

        if (invalidFiles.length > 0) {
            alert("허용되지 않은 파일 형식이 포함되어 있습니다.");
            return;
        }

        // FormData 생성 및 전송
        const formData = new FormData();
        
        formData.append("postTitle", postTitle);
        formData.append("postContent", postContent);
        formData.append("userNickName", user.userNickName);
        formData.append("placeList", copyList?.join(", "));        
        formData.append("existingImageUrls", JSON.stringify(existingImageUrls));

        // 새 파일 추가
        selectedFiles.forEach((file) => formData.append("files", file));

        // FormData 디버깅
        for (let [key, value] of formData.entries()) {
            console.log(`${key}:`, value);
        }

        try {
            // 일관된 토큰 사용
            const token = getAuthToken();
            if (!token) {
                alert("인증 정보가 없습니다. 다시 로그인해주세요.");
                navigate("/login");
                return;
            }

            console.log("수정 요청 보내기 전 데이터:", {
                postTitle,
                postContent,
                userNickName: user.userNickName,
                placeList: copyList?.join(", "),
                existingImageUrls
            });
            
            console.log("요청 URL:", `http://${config.IP_ADD}/travel/posts/postEdit/${id}`);
            console.log("인증 토큰:", token);

            const response = await axios.put(`http://${config.IP_ADD}/travel/posts/postEdit/${id}`, formData, {
                headers: { 
                    "Content-Type": "multipart/form-data",
                    'Authorization': token,
                    'Accept': '*/*'
                },
                withCredentials: true
            });

            console.log("응답 데이터:", response.data);
            alert("글이 수정되었습니다!");

            console.log("Redirecting to post ID:", id);
            navigate(`/postdetail/${id}`, { state: { from: location.state?.from } });  // 이전 경로로 이동
            
        } catch (error) {
            console.error("Error updating post:", error);
            console.error("응답 상태:", error.response?.status);
            console.error("응답 데이터:", error.response?.data);
            
            alert(
                `수정 중 오류가 발생했습니다: ${
                error.response?.data?.message || "서버와의 통신에 실패했습니다."
                }`
            );
        };
    }

    // 취소 버튼 핸들러
    const handleCancel = () => {
        if (window.confirm("수정을 취소하시겠습니까?")) {
            alert("수정이 취소되었습니다.");
            navigate(`/postdetail/${id}`, { state: { from: location.state?.from } });
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
                    value={user.userNickName || "알 수 없는 사용자"}
                />
            </div>

            {/* 여행지 표시 */}
            <div>
                <TextField
                    inputProps={{readOnly: true}}
                    fullWidth
                    variant="outlined"
                    label="여행지"
                    value={copyList && copyList.length > 0 ? copyList.join(" -> ") : ""}
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
                    {existingImageUrls.map((url, index) => (
                        <div key={`existing-${index}`}>
                            <img 
                                src={`http://${config.IP_ADD}${url}`} 
                                alt={`existing-${index}`}
                            />
                            <Delete onClick={() => handleDeleteImage(index,true)} />
                        </div>
                    ))}
                    {previewUrls.map((url, index) => (
                        <div key={index}>
                            <img 
                                src={url} 
                                alt={`preview-${index}`}
                            />
                            <Delete onClick={() => handleDeleteImage(index,false)} />
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

export default PostEdit;