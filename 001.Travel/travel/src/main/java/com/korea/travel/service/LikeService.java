package com.korea.travel.service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import com.korea.travel.dto.LikeDTO;
import com.korea.travel.model.LikeEntity;
import com.korea.travel.model.PostEntity;
import com.korea.travel.model.SocialEntity;
import com.korea.travel.model.UserEntity;
import com.korea.travel.persistence.LikeRepository;
import com.korea.travel.persistence.PostRepository;
import com.korea.travel.persistence.SocialRepository;
import com.korea.travel.persistence.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LikeService {
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final SocialRepository socialRepository;
    private final LikeRepository likeRepository;
    
    private final Logger logger = LoggerFactory.getLogger(LikeService.class);
    
    // 좋아요 추가
    @Transactional
    public LikeDTO addLike(Long userId, Long postId) {
        logger.info("좋아요 추가 시도: userId={}, postId={}", userId, postId);
        
        UserEntity user = findUserById(userId);
        PostEntity post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post with ID " + postId + " not found"));
        
        // 이미 좋아요를 눌렀는지 확인
        if (likeRepository.findByUserEntityAndPostEntity(user, post).isEmpty()) {
            LikeEntity like = new LikeEntity();
            like.setUserEntity(user);  // 유저 설정
            like.setPostEntity(post);  // 게시글 설정
            likeRepository.save(like);  // 좋아요 저장
            logger.info("좋아요 추가 성공: userId={}, postId={}", userId, postId);
        } else {
            logger.info("이미 좋아요가 존재함: userId={}, postId={}", userId, postId);
        }
        
        // 좋아요 추가 후 DTO 반환
        return new LikeDTO(null, userId, postId);
    }
    
    // 좋아요 삭제
    @Transactional
    public LikeDTO removeLike(Long userId, Long postId) {
        logger.info("좋아요 삭제 시도: userId={}, postId={}", userId, postId);
        
        UserEntity user = findUserById(userId);
        PostEntity post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post with ID " + postId + " not found"));
        
        LikeEntity like = likeRepository.findByUserEntityAndPostEntity(user, post)
                .orElseThrow(() -> new IllegalArgumentException("Like not found for user " + userId + " and post " + postId));
        
        likeRepository.delete(like);  // 좋아요 삭제
        logger.info("좋아요 삭제 성공: userId={}, postId={}", userId, postId);
        
        // 삭제 후 DTO 반환
        return new LikeDTO(null, userId, postId);
    }
    
    // 특정 게시물에 대한 좋아요 수
    public int getLikeCount(Long postId) {
        PostEntity post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post with ID " + postId + " not found"));
        return post.getLikeCount();
    }
    
    // 특정 게시물에 대해 사용자가 좋아요를 눌렀는지 확인
    public boolean isLiked(Long userId, Long postId) {
        logger.info("좋아요 상태 확인: userId={}, postId={}", userId, postId);
        
        UserEntity user = findUserById(userId);
        PostEntity post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post with ID " + postId + " not found"));
        
        // 사용자와 게시물에 해당하는 좋아요가 존재하는지 확인
        boolean liked = likeRepository.findByUserEntityAndPostEntity(user, post).isPresent();
        logger.info("좋아요 상태: userId={}, postId={}, liked={}", userId, postId, liked);
        return liked;
    }
    
    // 사용자 ID로 UserEntity 찾기 (소셜 로그인 처리 포함)
    private UserEntity findUserById(Long userId) {
        logger.info("사용자 조회 시도: ID={}", userId);
        
        // 일반 사용자 조회 시도
        Optional<UserEntity> regularUser = userRepository.findById(userId);
        if (regularUser.isPresent()) {
            logger.info("일반 사용자 찾음: ID={}", userId);
            return regularUser.get();
        }
        
        // 소셜 사용자인 경우 처리
        // 이미 userId가 1L로 설정된 경우 (PostService에서 처리된 경우)
        if (userId == 1L) {
            logger.info("소셜 사용자를 위한 임시 사용자 사용: ID={}", userId);
            
            // 임시 사용자 찾기 (ID가 1인 사용자가 있는지 확인)
            Optional<UserEntity> tempUser = userRepository.findById(1L);
            if (tempUser.isPresent()) {
                return tempUser.get();
            }
            
            // 임시 사용자 생성 (DB에 없는 경우)
            UserEntity newTempUser = new UserEntity();
            newTempUser.setId(1L);
            newTempUser.setUserNickName("소셜 사용자");
            // 필요한 경우 더 많은 필드 설정
            return newTempUser;
        }
        
        // 사용자를 찾을 수 없는 경우
        logger.warn("사용자를 찾을 수 없음: ID={}", userId);
        throw new IllegalArgumentException("User with ID " + userId + " not found");
    }
}