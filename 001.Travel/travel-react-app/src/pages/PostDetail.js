import React, { useContext, useEffect, useState } from "react";
import { TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { ImageContext } from "../context/ImageContext";
import axios from "axios";
import TopIcon from "../TopIcon/TopIcon";
import config from "../Apikey";
import { Delete } from "@mui/icons-material";
import { CopyListContext } from "../context/CopyListContext";
import { CopyPlaceListContext } from "../context/CopyPlaceListContext";


const PostDetail = () => {
   const { user } = useContext(UserContext); // 사용자 정보
   const { getAuthToken } = useContext(ImageContext); // 이미지 인증 컨텍스트
   const { id } = useParams(); // 게시글 ID
   const [previousPath, setPreviousPath] = useState(null);
   const [post, setPost] = useState({});
   const [imageUrls, setImageUrls] = useState([]);
   const [isLiked, setIsLiked] = useState(false); // 좋아요 상태
   const [likeCount, setLikeCount] = useState(0); // 좋아요 개수
   const [isLikeLoading, setIsLikeLoading] = useState(false); // 좋아요 로딩 상태

   // 수정 모드를 위한 상태 추가
   const [isEditMode, setIsEditMode] = useState(false);
   const [editedTitle, setEditedTitle] = useState("");
   const [editedContent, setEditedContent] = useState("");
   const [selectedFiles, setSelectedFiles] = useState([]); 
   const [previewUrls, setPreviewUrls] = useState([]);
   const [existingImageUrls, setExistingImageUrls] = useState([]);
   
   // CopyList 컨텍스트 사용 (수정 시 필요)
   const { copyList, setCopyList } = useContext(CopyListContext);
   const { copyPlaceList, setCopyPlaceList } = useContext(CopyPlaceListContext);

   const navigate = useNavigate();
   const location = useLocation(); // 현재 위치 추적

   // 인증 토큰 일관되게 가져오기 (ImageContext 사용으로 중복 제거 가능하지만 기존 코드 유지)
   const getLocalAuthToken = () => {
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
   const isPostOwner = () => {
       // 사용자 정보가 없으면 소유자 아님
       if (!user) return false;
       
       const currentUserId = getUserId();
       const postUserId = post.userId || '';
       
       // 디버깅용 로그
       console.log("게시글 상세 정보:", post);
       console.log("post.userId:", postUserId);
       console.log("currentUserId:", currentUserId);
       console.log("사용자 닉네임:", user.userNickName || user.nickname);
       console.log("게시글 닉네임:", post.userNickname);
       
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
       console.log("extractBaseId(currentUserId):", baseCurrentUserId);
       
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
           console.log("게시글 소셜 정보:", post.authProvider, post.socialId);
           console.log("사용자 소셜 정보:", user.authProvider, baseCurrentUserId);
           
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
           console.log("카카오 로그인 특수 케이스 확인:", postUserId, baseCurrentUserId);
           
           // 임시 조치: 개발 단계에서 카카오 로그인 사용자는 모든 게시물의 소유자로 인정
           // 실제 운영 환경에서는 제거해야 함
           return true;
       }
       
       return false;
   };

   // 게시글 상세 데이터 가져오기
   const getPostDetail = async () => {
       if (!id || id === 'undefined') {
           console.error("Invalid post ID for detail fetching");
           return;
       }
   
       try {
           const token = getAuthToken ? getAuthToken() : getLocalAuthToken();
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
           
           // 소셜 로그인 정보 디버깅
           console.log("받은 게시글 데이터:", data);
           if (data.authProvider && data.socialId) {
               console.log("게시글 소셜 정보:", data.authProvider, data.socialId);
           }
           
           // 현재 사용자 정보 디버깅
           if (user) {
               console.log("현재 사용자:", user.authProvider, user.id);
               console.log("현재 사용자 닉네임:", user.userNickName || user.nickname);
           }
           
           setPost(data);
           setImageUrls(data.imageUrls || []);
           setExistingImageUrls(data.imageUrls || []); // 기존 이미지 URL 설정
           setLikeCount(data.likes || 0); // 초기 좋아요 개수 설정
           
           // 수정 모드를 위한 초기값 설정
           setEditedTitle(data.postTitle || "");
           setEditedContent(data.postContent || "");
           
           // 여행지 리스트 설정 (수정 시 필요)
           if (data.placeList) {
               setCopyPlaceList(data.placeList);
               setCopyList(data.placeList);
           }
           
           // 소유권 확인 즉시 실행
           console.log("소유권 확인 결과:", isPostOwner());
       } catch (error) {
           console.error("Error fetching post details:", error);
           
           // 토큰 오류 처리
           if (error.response && error.response.status === 401) {
               alert("인증 정보가 만료되었습니다. 다시 로그인해주세요.");
               // navigate("/login");
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
           const token = getAuthToken ? getAuthToken() : getLocalAuthToken();
           if (!token) {
               console.error("인증 토큰이 없습니다.");
               return;
           }
           
           // API 호출
           const response = await axios.get(`http://${config.IP_ADD}/travel/likes/${id}/isLiked`, {
               headers: { 
                   Authorization: token,
                   Accept: '*/*'
               },
               withCredentials: true
           });
           setIsLiked(response.data);
       } catch (error) {
           console.error("Error fetching like status:", error);
           
           // 401 에러 체크 (로그인 필요) - 리다이렉트 없이 에러 무시
           setIsLiked(false);
       }
   };

   // 좋아요 버튼 클릭 - 개선된 버전
   const likeButtonClick = async () => {
       // 이미 요청 중이면 무시
       if (isLikeLoading) return;
       
       try {
           setIsLikeLoading(true); // 요청 시작 표시
           
           const token = getAuthToken ? getAuthToken() : getLocalAuthToken();
           if (!token) {
               alert("인증 정보가 없습니다. 다시 로그인해주세요.");
               return;
           }
           
           const url = `http://${config.IP_ADD}/travel/likes/${id}`;
           const method = isLiked ? "delete" : "post";
           
           // API 호출 시도
           await axios({ 
               method, 
               url, 
               headers: { 
                   Authorization: token,
                   Accept: '*/*' 
               },
               withCredentials: true,
               timeout: 10000
           });
           
           // UI 상태 업데이트 - API 응답 이후에 변경
           setIsLiked(prev => !prev);
           setLikeCount(prevCount => isLiked ? prevCount - 1 : prevCount + 1);
           
       } catch (error) {
           console.error("좋아요 처리 중 오류:", error);
           
           // 네트워크 에러 확인
           if (error.code === 'ECONNABORTED') {
               alert("서버 응답 시간이 초과되었습니다. 나중에 다시 시도해주세요.");
               return;
           }
           
           // 인증 오류 처리
           if (error.response?.status === 401) {
               alert("인증 정보가 만료되었습니다. 다시 로그인해주세요.");
               return;
           }
           
           alert("좋아요 처리 중 문제가 발생했습니다.");
       } finally {
           // 요청 완료 후 타이머를 통해 상태 리셋 (중복 클릭 방지)
           setTimeout(() => {
               setIsLikeLoading(false);
           }, 500); // 500ms 딜레이
       }
   };

   // 페이지 이동 전 이전 경로를 저장
   useEffect(() => {
       setPreviousPath(location.state?.from);
   }, [location]);

   useEffect(() => {
       // id가 존재하는지 확인하고 초기 데이터 로드
       if (id && id !== 'undefined' && id !== 'null' && !isNaN(id) && user) {
           console.log("게시글 ID 확인:", id);
           getPostDetail();
           getLikeStatus();
       } else {
           // 에러 상황 세분화
           if (!id || id === 'undefined' || id === 'null' || isNaN(id)) {
               console.error("유효하지 않은 게시글 ID:", id);
               alert("게시글 정보를 찾을 수 없습니다.");
               // 게시글 목록으로 리다이렉트
               // navigate('/post', { replace: true }); 
           } else if (!user) {
               console.error("사용자 정보 없음");
               alert("사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.");
               // navigate('/login', { replace: true });
           }
       }
   }, [id, user, navigate]); // navigate도 의존성 배열에 추가

   // 게시글 소유자 확인용 디버깅 로그 추가
   useEffect(() => {
       if (post.userId) {
           console.log("게시글 소유자 확인:", isPostOwner());
       }
   }, [post.userId]);

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

   // 수정 모드 진입
   const startEditMode = () => {
       // 대신 직접 수정 페이지로 이동
       navigate(`/postedit/${id}`, { state: { from: location.pathname } });
   };

   // 수정 모드 취소
   const cancelEditMode = () => {
       if (window.confirm("수정을 취소하시겠습니까?")) {
           setIsEditMode(false);
           // 원래 데이터로 복원
           setEditedTitle(post.postTitle || "");
           setEditedContent(post.postContent || "");
           setSelectedFiles([]);
           setPreviewUrls([]);
           setExistingImageUrls(imageUrls);
       }
   };

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

   // 수정 내용 저장
   const saveEditedPost = async () => {
       if (!editedTitle || !editedContent) {
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
       
       formData.append("postTitle", editedTitle);
       formData.append("postContent", editedContent);
       formData.append("userNickName", post.userNickname || user.userNickName);
       
       // 소셜 ID와 제공자 정보 명시적 추가 (백엔드 식별용)
       if (user.authProvider) {
           formData.append("authProvider", user.authProvider);
           formData.append("socialId", user.id);
       }
       
       // copyList가 있다면 사용, 없으면 기존 placeList 사용
       const placeListToUse = copyList && copyList.length > 0 ? copyList : post.placeList;
       formData.append("placeList", placeListToUse?.join(", ") || "");
       
       formData.append("existingImageUrls", JSON.stringify(existingImageUrls));

       // 새 파일 추가
       selectedFiles.forEach((file) => formData.append("files", file));

       try {
           const token = getAuthToken ? getAuthToken() : getLocalAuthToken();
           if (!token) {
               alert("인증 정보가 없습니다. 다시 로그인해주세요.");
               return;
           }

           const response = await axios.put(`http://${config.IP_ADD}/travel/posts/postEdit/${id}`, formData, {
               headers: { 
                   "Content-Type": "multipart/form-data",
                   'Authorization': token,
                   'Accept': '*/*'
               },
               withCredentials: true
           });

           alert("글이 수정되었습니다!");
           setIsEditMode(false);
           
           // 수정된 내용으로 상태 업데이트
           getPostDetail(); // 데이터 다시 불러오기
           
       } catch (error) {
           console.error("Error updating post:", error.response?.data || error.message);
           
           // 오류 메시지 자세히 표시
           let errorMessage = "서버와의 통신에 실패했습니다.";
           
           if (error.response?.data?.message) {
               errorMessage = error.response.data.message;
           } else if (error.message) {
               errorMessage = error.message;
           }
           
           // 중복 결과 오류 특별 처리
           if (error.message && error.message.includes("Query did not return a unique result")) {
               errorMessage = "사용자 정보가 중복되어 있습니다. 관리자에게 문의하세요.";
           }
           
           alert(`수정 중 오류가 발생했습니다: ${errorMessage}`);
       }
   };

   // 삭제 버튼 클릭
   const handleDelete = async () => {
       if (window.confirm("게시글을 삭제하시겠습니까?")) {
           try {
               const token = getAuthToken ? getAuthToken() : getLocalAuthToken();
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
   
   // 인증된 이미지 컴포넌트
   const AuthenticatedImage = ({ imageUrl, customStyle = {} }) => {
        const [imageSrc, setImageSrc] = useState("");
        const [isLoading, setIsLoading] = useState(true);
        const [error, setError] = useState(false);
        
        useEffect(() => {
            const loadImage = async () => {
                try {
                    // 직접 URL을 사용하여 이미지를 로드
                    setImageSrc(`http://${config.IP_ADD}${imageUrl}`);
                    setIsLoading(false);
                } catch (error) {
                    console.error("이미지 로드 실패:", error);
                    setError(true);
                    setIsLoading(false);
                }
            };
            
            loadImage();
        }, [imageUrl]);
        
        if (isLoading) {
            return <div style={{
                height: customStyle.height || "20vh", 
                width: customStyle.width || "20vw", 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center",
                backgroundColor: "#f5f5f5",
                ...customStyle
            }}>로딩 중...</div>;
        }
        
        if (error || !imageSrc) {
            return <div style={{
                height: customStyle.height || "20vh", 
                width: customStyle.width || "20vw", 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center",
                backgroundColor: "#f8d7da",
                ...customStyle
            }}>이미지를 불러올 수 없습니다</div>;
        }
        
        return (
            <img
                src={imageSrc}
                alt="이미지"
                onError={() => setError(true)}
                style={{
                    height: customStyle.height || "20vh",
                    width: customStyle.width || "20vw",
                    padding: 0,
                    margin: 0,
                    objectFit: customStyle.objectFit || "cover",
                    ...customStyle
                }}
            />
        );
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
                   {/* 수정 모드가 아닐 때 (기존 보기 모드) */}
                   {!isEditMode ? (
                       <>
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
                                       <AuthenticatedImage imageUrl={image} />
                                   </div>
                               ))}
                           </div>
                       </>
                   ) : (
                       /* 수정 모드일 때 */
                       <>
                           {/* 제목 입력 */}
                           <TextField
                               style={{ marginBottom: "20px" }}
                               fullWidth
                               variant="outlined"
                               label="제목"
                               value={editedTitle}
                               onChange={(e) => setEditedTitle(e.target.value)}
                               placeholder="제목을 입력하세요."
                           />
                           {/* 작성자 표시 (읽기 전용) */}
                           <TextField
                               style={{ marginBottom: "20px" }}
                               InputProps={{ readOnly: true }}
                               label="작성자"
                               fullWidth
                               variant="outlined"
                               value={post.userNickname || "알 수 없는 사용자"}
                           />
                           {/* 여행지 표시 (읽기 전용) */}
                           <TextField
                               style={{ marginBottom: "20px" }}
                               inputProps={{ readOnly: true }}
                               fullWidth
                               variant="outlined"
                               label="여행지"
                               value={copyList?.join(" -> ") || post.placeList?.join(" -> ") || "등록된 여행지가 없습니다."}
                               multiline
                               rows={2}
                           />
                           {/* 내용 입력 */}
                           <TextField
                               style={{ marginBottom: "20px" }}
                               fullWidth
                               variant="outlined"
                               label="내용"
                               value={editedContent}
                               onChange={(e) => setEditedContent(e.target.value)}
                               placeholder="내용을 입력하세요."
                               multiline
                               rows={7}
                           />
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
                                <div className="image-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
                                    {/* 기존 이미지 */}
                                    {existingImageUrls.map((url, index) => (
                                        <div key={`existing-${index}`} style={{ position: "relative" }}>
                                            <AuthenticatedImage 
                                                imageUrl={url} 
                                                customStyle={{ 
                                                    width: "100%", 
                                                    height: "200px", 
                                                    objectFit: "cover" 
                                                }} 
                                            />
                                            <Delete 
                                                onClick={() => handleDeleteImage(index, true)} 
                                                style={{ 
                                                    position: "absolute", 
                                                    top: "5px", 
                                                    right: "5px", 
                                                    background: "rgba(255,255,255,0.7)",
                                                    borderRadius: "50%",
                                                    cursor: "pointer"
                                                }}
                                            />
                                        </div>
                                    ))}
                                    {/* 새로 추가된 이미지 */}
                                    {previewUrls.map((url, index) => (
                                        <div key={`preview-${index}`} style={{ position: "relative" }}>
                                            <img 
                                                src={url} 
                                                alt={`preview-${index}`}
                                                style={{ width: "100%", height: "200px", objectFit: "cover" }}
                                            />
                                            <Delete 
                                                onClick={() => handleDeleteImage(index, false)} 
                                                style={{ 
                                                    position: "absolute", 
                                                    top: "5px", 
                                                    right: "5px", 
                                                    background: "rgba(255,255,255,0.7)",
                                                    borderRadius: "50%",
                                                    cursor: "pointer"
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                    
                </div>
                {/* 좋아요 버튼 */}
                {!isEditMode && (
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
                )}

                {/* 버튼 영역 */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
                    {!isEditMode ? (
                        // 보기 모드 버튼들
                        <>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={listButtonClick}
                                style={{ marginRight: "10px", width: "10%", backgroundColor: "#45a347", fontFamily: "'GowunDodum-Regular', sans-serif" }}
                            >
                                목록
                            </Button>
                            {isPostOwner() && (
                                <div>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        onClick={startEditMode}
                                        style={{ marginRight: "10px", fontFamily: "'GowunDodum-Regular', sans-serif" }}
                                    >
                                        수정
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        onClick={handleDelete}
                                        style={{ fontFamily: "'GowunDodum-Regular', sans-serif" }}
                                    >
                                        삭제
                                    </Button>
                                </div>
                            )}
                        </>
                    ) : (
                        // 수정 모드 버튼들
                        <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={saveEditedPost}
                                style={{ marginRight: "10px", fontFamily: "'GowunDodum-Regular', sans-serif" }}
                            >
                                저장
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={cancelEditMode}
                                style={{ fontFamily: "'GowunDodum-Regular', sans-serif" }}
                            >
                                취소
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostDetail;