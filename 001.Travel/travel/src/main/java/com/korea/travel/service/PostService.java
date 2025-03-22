package com.korea.travel.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
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
        try {
            UserEntity user = findUserByStringId(userId);
            
            List<PostEntity> posts = postRepository.findByUserEntity(user);
            return posts.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("게시글 조회 중 오류: {}", e.getMessage());
            throw new RuntimeException("게시글 조회 중 오류: " + e.getMessage());
        }
    }
    
    // 게시글 한 건 조회
    @Transactional(readOnly = true)// 데이터 읽기 전용 트랜잭션
    public PostDTO getPostById(Long id) {
    	logger.info("게시글 조회 서비스 호출: ID={}", id);
    	
        Optional<PostEntity> board = postRepository.findById(id);
        if(board.isPresent()) {
        	return board.map(this::convertToDTO)
                    .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        }else {
        	throw new RuntimeException("게시글을 찾을 수 없습니다.");
		}
    }
    
    // 게시글 생성
    public PostDTO createPost(PostDTO postDTO) {
        PostEntity savedEntity = postRepository.save(convertToEntity(postDTO));
        return convertToDTO(savedEntity);
    }
    
    // 게시글 생성 - String ID 지원
    public PostDTO createPostWithStringUserId(String userId, PostDTO postDTO) {
        try {
            // 통합 사용자 조회 서비스 사용
            UserEntity user = findUserByStringId(userId);
            postDTO.setUserEntity(user);
            
            // 기존 기능 호출
            return createPost(postDTO);
        } catch (Exception e) {
            logger.error("게시글 생성 중 오류: {}", e.getMessage());
            throw new RuntimeException("게시글 생성 중 오류: " + e.getMessage());
        }
    }

    public List<String> saveFiles(List<MultipartFile> files) {
        List<String> fileUrls = new ArrayList<>();
        for (MultipartFile file : files) {
            try {
                String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename().replaceAll("[^a-zA-Z0-9._-]", "_");
                Path filePath = Paths.get("/home/ubuntu/app/uploads/" + fileName);
                Files.write(filePath, file.getBytes());
                fileUrls.add("/uploads/" + fileName); // 파일 접근 URL
            } catch (IOException e) {
                throw new RuntimeException("파일 저장 중 오류 발생", e);
            }
        }
        return fileUrls;
    }
    
    //게시글 수정
    public PostDTO updatePost(Long id, String postTitle, String postContent, List<String> placeListParsed, 
    		String userNickName,List<MultipartFile> files, List<String> existingImageUrls) {
		
    	PostEntity postEntity = postRepository.findById(id)
		.orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
		
		postEntity.setPostTitle(postTitle);
		postEntity.setPostContent(postContent);
		postEntity.setUserNickname(userNickName);
		
		if(placeListParsed != null && !placeListParsed.isEmpty()) {
			postEntity.setPlaceList(new ArrayList<>(placeListParsed));
        }else {
        	postEntity.setPlaceList(null);
        }
		
		List<String> allImageUrls = new ArrayList<>(existingImageUrls);
		
		if (files != null && !files.isEmpty()) {
			List<String> newImageUrls = saveFiles(files);
			allImageUrls.addAll(newImageUrls);
		}
		
		postEntity.setImageUrls(allImageUrls);
		
		PostEntity updatedEntity = postRepository.save(postEntity);
		return convertToDTO(updatedEntity);
	}    
    
    // 게시글 삭제
    public boolean deletePost(Long id) {
        if (postRepository.existsById(id)) {
            postRepository.deleteById(id);
            return true;
        }
        return false;
    }
    
    // ID 문자열을 기반으로 사용자(일반 또는 소셜) 조회
    public UserEntity findUserByStringId(String userId) {
        logger.info("문자열 ID로 사용자 조회: {}", userId);
        
        // 소셜 ID 형식인지 확인 (숫자 형식이 아니거나 매우 긴 숫자)
        if (userId.length() > 10 || !userId.matches("\\d+")) {
            // socialId로 소셜 사용자 조회
            String socialId = userId;
            // google_ 또는 kakao_ 접두사가 있으면 제거
            if (userId.startsWith("google_")) {
                socialId = userId.substring("google_".length());
            } else if (userId.startsWith("kakao_")) {
                socialId = userId.substring("kakao_".length());
            }
            
            logger.info("소셜 ID로 사용자 조회: {}", socialId);
            
            // 소셜 사용자 조회
            Optional<SocialEntity> socialUser = socialRepository.findBySocialId(socialId);
            if (socialUser.isPresent()) {
                // SocialEntity를 UserEntity로 변환 또는 임시 UserEntity 생성
                UserEntity tempUser = new UserEntity();
                tempUser.setId(1L); // 임시 ID (실제 환경에서는 더 나은 방법 필요)
                tempUser.setUserNickName(socialUser.get().getName());
                logger.info("소셜 사용자 찾음: {}", socialUser.get().getName());
                return tempUser;
            }
        } else {
            try {
                // 일반 사용자 ID로 조회
                Long userIdLong = Long.parseLong(userId);
                Optional<UserEntity> regularUser = userRepository.findById(userIdLong);
                if (regularUser.isPresent()) {
                    logger.info("일반 사용자 찾음: {}", regularUser.get().getUserNickName());
                    return regularUser.get();
                }
            } catch (NumberFormatException e) {
                // 숫자 변환 실패 시 예외 처리
                logger.error("사용자 ID 숫자 변환 실패: {}", userId);
                throw new IllegalArgumentException("유효하지 않은 사용자 ID 형식");
            }
        }
        
        logger.warn("사용자를 찾을 수 없음: {}", userId);
        throw new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userId);
    }

    private PostDTO convertToDTO(PostEntity entity) {
        return PostDTO.builder()
                .postId(entity.getPostId())
                .userId(entity.getUserEntity().getId())
                .postTitle(entity.getPostTitle())
                .postContent(entity.getPostContent())
                .userNickname(entity.getUserNickname())
                .placeList(entity.getPlaceList())
                .imageUrls(entity.getImageUrls())
                .likes(likeRepository.countByPostEntity(entity))
                .postCreatedAt(entity.getPostCreatedAt())
                .build();
    }

    private PostEntity convertToEntity(PostDTO dto) {
        return PostEntity.builder()
                .postTitle(dto.getPostTitle())
                .postContent(dto.getPostContent())
                .userNickname(dto.getUserNickname())
                .placeList(dto.getPlaceList())
                .imageUrls(dto.getImageUrls())
                .postCreatedAt(dto.getPostCreatedAt())
                .userEntity(dto.getUserEntity())
                .build();
    }
}