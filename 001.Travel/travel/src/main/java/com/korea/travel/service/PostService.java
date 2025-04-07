package com.korea.travel.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.korea.travel.dto.PostDTO;
import com.korea.travel.model.PostEntity;
import com.korea.travel.model.SocialEntity;
import com.korea.travel.model.UserEntity;
import com.korea.travel.persistence.LikeRepository;
import com.korea.travel.persistence.PostRepository;
import com.korea.travel.persistence.SocialRepository;
import com.korea.travel.persistence.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;	
	
    private final UserRepository userRepository;
    
    private final LikeRepository likeRepository;
    
    private final SocialRepository socialRepository;
    
    private final Logger logger = LoggerFactory.getLogger(PostService.class);
	
    @Value("${file.upload-dir}") // 파일 저장 경로 설정
    private String uploadDir;

    // 게시판 전체 조회
    public List<PostDTO> getAllPosts() {
        return postRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    // 마이 게시판 조회
    public List<PostDTO> getMyPosts(Long userId) {
       Optional<UserEntity> user = userRepository.findById(userId);
       
       if(user.isPresent()) {
    	   List<PostEntity> posts = postRepository.findByUserEntity(user.get());
       
	       return posts.stream()
	             .map(this::convertToDTO)
	             .collect(Collectors.toList());
       }
       else {
          throw new IllegalArgumentException("User not found");
       }
    }
    
    // 마이 게시판 조회 - String ID 지원
    public List<PostDTO> getMyPostsByStringId(String userId) {
        logger.info("마이 게시판 조회 시작 - 사용자 ID: {}, 타입: {}", userId, userId.getClass().getName());
        try {
            UserEntity user = findUserByStringId(userId);
            logger.info("사용자 조회 성공: ID={}, 닉네임={}", user.getId(), user.getUserNickName());
            
            List<PostEntity> posts = postRepository.findByUserEntity(user);
            logger.info("게시글 조회 결과: {}개 게시글 발견", posts.size());
            return posts.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("게시글 조회 중 오류: {}", e.getMessage(), e);
            throw new RuntimeException("게시글 조회 중 오류: " + e.getMessage());
        }
    }
    
    // 게시글 한 건 조회
    @Transactional(readOnly = true)// 데이터 읽기 전용 트랜잭션
    public PostDTO getPostById(Long id) {
    	logger.info("게시글 조회 서비스 호출: ID={}", id);
    	
        Optional<PostEntity> board = postRepository.findById(id);
        if(board.isPresent()) {
            logger.info("게시글 찾음: ID={}, 제목={}", id, board.get().getPostTitle());
        	return board.map(this::convertToDTO)
                    .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        }else {
            logger.warn("게시글을 찾을 수 없음: ID={}", id);
        	throw new RuntimeException("게시글을 찾을 수 없습니다.");
		}
    }
    
    // 게시글 생성
    public PostDTO createPost(PostDTO postDTO) {
        logger.info("게시글 생성 시작: 제목={}, 작성자={}", postDTO.getPostTitle(), postDTO.getUserNickname());
        PostEntity savedEntity = postRepository.save(convertToEntity(postDTO));
        logger.info("게시글 생성 완료: ID={}", savedEntity.getPostId());
        return convertToDTO(savedEntity);
    }
    
    // 게시글 생성 - String ID 지원
    public PostDTO createPostWithStringUserId(String userId, PostDTO postDTO) {
        logger.info("문자열 ID로 게시글 생성 시작: userId={}, 타입={}", userId, userId.getClass().getName());
        try {
            // 통합 사용자 조회 서비스 사용
            logger.info("사용자 조회 시도: ID={}", userId);
            UserEntity user = findUserByStringId(userId);
            logger.info("사용자 조회 결과: ID={}, 닉네임={}", user.getId(), user.getUserNickName());
            
            postDTO.setUserEntity(user);
            logger.info("게시글 DTO에 사용자 엔티티 설정 완료");
            
            // 소셜 로그인 정보 추가
            String authProvider = null;
            String socialId = null;
            
            if (userId.startsWith("google_")) {
                authProvider = "GOOGLE";
                socialId = userId.substring("google_".length());
            } else if (userId.startsWith("kakao_")) {
                authProvider = "KAKAO";
                socialId = userId.substring("kakao_".length());
            }
            
            postDTO.setAuthProvider(authProvider);
            postDTO.setSocialId(socialId);
            logger.info("소셜 로그인 정보 설정: provider={}, socialId={}", authProvider, socialId);
            
            // 기존 기능 호출
            return createPost(postDTO);
        } catch (Exception e) {
            logger.error("게시글 생성 중 오류: {}", e.getMessage(), e);
            throw new RuntimeException("게시글 생성 중 오류: " + e.getMessage());
        }
    }

    public List<String> saveFiles(List<MultipartFile> files) {
        logger.info("파일 저장 시작: {}개 파일", files != null ? files.size() : 0);
        List<String> fileUrls = new ArrayList<>();
        
        if (files == null || files.isEmpty()) {
            logger.info("저장할 파일이 없습니다");
            return fileUrls;
        }
        
        for (MultipartFile file : files) {
            try {
                String originalFilename = file.getOriginalFilename();
                logger.info("파일 저장 중: 원본 파일명={}, 크기={}bytes", originalFilename, file.getSize());
                
                String fileName = UUID.randomUUID() + "_" + originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
                Path uploadPath = Paths.get("/home/ubuntu/app/uploads/");
                Path filePath = uploadPath.resolve(fileName);
                
                // 디렉토리 존재 확인 및 생성
                if (!Files.exists(uploadPath)) {
                    logger.info("업로드 디렉토리가 존재하지 않아 생성합니다: {}", uploadPath);
                    Files.createDirectories(uploadPath);
                }
                
                Files.write(filePath, file.getBytes());
                String fileUrl = "/uploads/" + fileName;
                fileUrls.add(fileUrl);
                logger.info("파일 저장 완료: URL={}", fileUrl);
            } catch (IOException e) {
                logger.error("파일 저장 중 오류 발생: {}", e.getMessage(), e);
                throw new RuntimeException("파일 저장 중 오류 발생", e);
            }
        }
        logger.info("총 {}개 파일 저장 완료", fileUrls.size());
        return fileUrls;
    }
    
  //게시글 수정
    public PostDTO updatePost(Long id, String postTitle, String postContent, List<String> placeListParsed, 
            String userNickName, List<MultipartFile> files, List<String> existingImageUrls) {
        logger.info("게시글 수정 시작: ID={}, 제목={}", id, postTitle);
        
        PostEntity postEntity = postRepository.findById(id)
        .orElseThrow(() -> {
            logger.warn("수정할 게시글을 찾을 수 없음: ID={}", id);
            return new RuntimeException("게시글을 찾을 수 없습니다.");
            
        });
        
        // 추가: 현재 저장된 닉네임 값 로깅
        logger.info("기존 저장된 userNickname 값: '{}'", postEntity.getUserNickname());
        
        // 기존 소셜 로그인 정보 저장
        String originalAuthProvider = postEntity.getAuthProvider();
        String originalSocialId = postEntity.getSocialId();
        
        postEntity.setPostTitle(postTitle);
        postEntity.setPostContent(postContent);
        postEntity.setUserNickname(userNickName);
        
        // 소셜 로그인 정보 유지
        postEntity.setAuthProvider(originalAuthProvider);
        postEntity.setSocialId(originalSocialId);
        
        if(placeListParsed != null && !placeListParsed.isEmpty()) {
            logger.info("장소 목록 업데이트: {}", placeListParsed);
            postEntity.setPlaceList(new ArrayList<>(placeListParsed));
        } else {
            logger.info("장소 목록 null로 설정");
            postEntity.setPlaceList(null);
        }
        
        // 파일 처리 및 이미지 URL 업데이트
        List<String> updatedImageUrls = new ArrayList<>();
        
        // 기존 이미지 URL 유지 (만약 있다면)
        if (existingImageUrls != null && !existingImageUrls.isEmpty()) {
            logger.info("기존 이미지 URL 유지: {}", existingImageUrls);
            updatedImageUrls.addAll(existingImageUrls);
        }
        
        // 새 파일 업로드 및 URL 추가
        if (files != null && !files.isEmpty()) {
            logger.info("새 파일 업로드 처리: {}개 파일", files.size());
            List<String> newFileUrls = saveFiles(files);
            updatedImageUrls.addAll(newFileUrls);
        }
        
        // 게시글에 업데이트된 이미지 URL 설정
        postEntity.setImageUrls(updatedImageUrls);
        logger.info("게시글 이미지 URL 업데이트 완료: {}개 이미지", updatedImageUrls.size());
        
        // 변경사항 저장
        PostEntity updatedEntity = postRepository.save(postEntity);
        logger.info("게시글 업데이트 완료: ID={}", updatedEntity.getPostId());
        
        // DTO로 변환하여 반환
        return convertToDTO(updatedEntity);
    }
    
    // 게시글 삭제
    public boolean deletePost(Long id) {
        logger.info("게시글 삭제 시도: ID={}", id);
        if (postRepository.existsById(id)) {
            postRepository.deleteById(id);
            logger.info("게시글 삭제 완료: ID={}", id);
            return true;
        }
        logger.warn("삭제할 게시글을 찾을 수 없음: ID={}", id);
        return false;
    }
    
    // ID 문자열을 기반으로 사용자(일반 또는 소셜) 조회
    public UserEntity findUserByStringId(String userId) {
        logger.info("문자열 ID로 사용자 조회: {}", userId);
        
        // 소셜 ID 형식인지 확인 (숫자 형식이 아니거나 매우 긴 숫자)
        if (userId.length() > 10 || !userId.matches("\\d+")) {
            // socialId로 소셜 사용자 조회
            String socialId = userId;
            String provider = "unknown";
            
            // google_ 또는 kakao_ 접두사가 있으면 제거
            if (userId.startsWith("google_")) {
                socialId = userId.substring("google_".length());
                provider = "google";
            } else if (userId.startsWith("kakao_")) {
                socialId = userId.substring("kakao_".length());
                provider = "kakao";
            }
            
            logger.info("소셜 ID로 사용자 조회: socialId={}, provider={}", socialId, provider);
            
            // 소셜 사용자 조회
            Optional<SocialEntity> socialUser = socialRepository.findBySocialId(socialId);
            if (socialUser.isPresent()) {
                SocialEntity socialEntity = socialUser.get();
                
                // 해당 소셜 ID를 가진 기존 UserEntity가 있는지 찾기
                // 예: social_[provider]_[socialId] 형식의 userId로 조회
                String socialUserId = "social_" + provider + "_" + socialId;
                Optional<UserEntity> existingUser = userRepository.findByUserId(socialUserId);
                
                if (existingUser.isPresent()) {
                    logger.info("기존 UserEntity 찾음: ID={}, 닉네임={}", 
                                existingUser.get().getId(), existingUser.get().getUserNickName());
                    return existingUser.get();
                } else {
                    // 새 UserEntity 생성 및 저장
                    UserEntity newUser = new UserEntity();
                    newUser.setUserId(socialUserId);
                    newUser.setUserName(socialEntity.getName());
                    newUser.setUserNickName(socialEntity.getName());
                    newUser.setUserCreatedAt(LocalDateTime.now().toString());
                    
                    // 비밀번호 필드가 필수라면 임의의 안전한 값 설정
                    newUser.setUserPassword(UUID.randomUUID().toString());
                    
                    UserEntity savedUser = userRepository.save(newUser);
                    logger.info("새 UserEntity 생성 및 저장: ID={}, 닉네임={}", 
                                savedUser.getId(), savedUser.getUserNickName());
                    return savedUser;
                }
            } else {
                logger.warn("소셜 ID로 사용자를 찾을 수 없음: {}", socialId);
            }
        } else {
            try {
                // 일반 사용자 ID로 조회 (기존 코드와 동일)
                Long userIdLong = Long.parseLong(userId);
                logger.info("일반 사용자 ID로 조회: {}", userIdLong);
                
                Optional<UserEntity> regularUser = userRepository.findById(userIdLong);
                if (regularUser.isPresent()) {
                    logger.info("일반 사용자 찾음: ID={}, 닉네임={}", regularUser.get().getId(), regularUser.get().getUserNickName());
                    return regularUser.get();
                } else {
                    logger.warn("ID={}인 일반 사용자를 찾을 수 없음", userIdLong);
                }
            } catch (NumberFormatException e) {
                // 숫자 변환 실패 시 예외 처리
                logger.error("사용자 ID 숫자 변환 실패: {}", userId, e);
                throw new IllegalArgumentException("유효하지 않은 사용자 ID 형식: " + e.getMessage());
            }
        }
        
        logger.error("사용자를 찾을 수 없음: ID={}", userId);
        throw new IllegalArgumentException("User with ID " + userId + " not found");
    }

    private PostDTO convertToDTO(PostEntity entity) {
        // UserEntity에서 정보 추출
        UserEntity user = entity.getUserEntity();
        
        // 소셜 로그인 정보 추출
        String authProvider = entity.getAuthProvider();
        String socialId = entity.getSocialId();
        
        // authProvider와 socialId가 없는 경우, userId에서 추출 시도
        if ((authProvider == null || socialId == null) && user != null && user.getUserId() != null) {
            String userId = user.getUserId();
            if (userId.startsWith("social_google_")) {
                authProvider = "GOOGLE";
                socialId = userId.substring("social_google_".length());
            } else if (userId.startsWith("social_kakao_")) {
                authProvider = "KAKAO";
                socialId = userId.substring("social_kakao_".length());
            }
            
            logger.debug("UserEntity에서 소셜 정보 추출: provider={}, socialId={}", authProvider, socialId);
        }
        
        PostDTO dto = PostDTO.builder()
                .postId(entity.getPostId())
                .userId(entity.getUserEntity().getId())
                .postTitle(entity.getPostTitle())
                .postContent(entity.getPostContent())
                .userNickname(entity.getUserNickname())
                .placeList(entity.getPlaceList())
                .imageUrls(entity.getImageUrls())
                .likes(likeRepository.countByPostEntity(entity))
                .postCreatedAt(entity.getPostCreatedAt())
                .authProvider(authProvider)  // 소셜 로그인 제공자
                .socialId(socialId)          // 소셜 ID
                .build();
        
        logger.debug("엔티티->DTO 변환: ID={}, 제목={}, provider={}, socialId={}", 
                    dto.getPostId(), dto.getPostTitle(), dto.getAuthProvider(), dto.getSocialId());
        return dto;
    }

    private PostEntity convertToEntity(PostDTO dto) {
        PostEntity entity = PostEntity.builder()
                .postTitle(dto.getPostTitle())
                .postContent(dto.getPostContent())
                .userNickname(dto.getUserNickname())
                .placeList(dto.getPlaceList())
                .imageUrls(dto.getImageUrls())
                .postCreatedAt(dto.getPostCreatedAt())
                .userEntity(dto.getUserEntity())
                .authProvider(dto.getAuthProvider())  // 소셜 로그인 제공자
                .socialId(dto.getSocialId())          // 소셜 ID
                .build();
        
        logger.debug("DTO->엔티티 변환: 제목={}, 작성자={}, provider={}, socialId={}", 
                    entity.getPostTitle(), entity.getUserNickname(), entity.getAuthProvider(), entity.getSocialId());
        return entity;
    }
}