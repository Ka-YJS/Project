package com.korea.travel.service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import com.korea.travel.dto.LikeDTO;
import com.korea.travel.model.LikeEntity;
import com.korea.travel.model.LikeEntity.UserType;
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
    public LikeDTO addLike(Long userId, String userType, Long postId) {
        logger.info("좋아요 추가 시도: userId={}, userType={}, postId={}", userId, userType, postId);
        
        // 사용자 타입 변환
        UserType type = "SOCIAL".equalsIgnoreCase(userType) ? 
            UserType.SOCIAL : UserType.REGULAR;
        
        // 게시글 확인
        PostEntity post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post with ID " + postId + " not found"));
        
        // 이미 좋아요를 눌렀는지 확인
        if (likeRepository.findByUserIdAndUserTypeAndPostEntity(userId, type, post).isEmpty()) {
            LikeEntity like = new LikeEntity();
            like.setUserId(userId);
            like.setUserType(type);
            like.setPostEntity(post);
            likeRepository.save(like);
            logger.info("좋아요 추가 성공: userId={}, userType={}, postId={}", userId, userType, postId);
        } else {
            logger.info("이미 좋아요가 존재함: userId={}, userType={}, postId={}", userId, userType, postId);
        }
        
        return new LikeDTO(null, userId, postId);
    }
    
    // 좋아요 삭제
    @Transactional
    public LikeDTO removeLike(Long userId, String userType, Long postId) {
        logger.info("좋아요 삭제 시도: userId={}, userType={}, postId={}", userId, userType, postId);
        
        UserType type = "SOCIAL".equalsIgnoreCase(userType) ? 
            UserType.SOCIAL : UserType.REGULAR;
        
        PostEntity post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post with ID " + postId + " not found"));
        
        LikeEntity like = likeRepository.findByUserIdAndUserTypeAndPostEntity(userId, type, post)
                .orElseThrow(() -> new IllegalArgumentException("Like not found"));
        
        likeRepository.delete(like);
        logger.info("좋아요 삭제 성공: userId={}, userType={}, postId={}", userId, userType, postId);
        
        return new LikeDTO(null, userId, postId);
    }
    
    // 특정 게시물에 대한 좋아요 수
    public int getLikeCount(Long postId) {
        PostEntity post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post with ID " + postId + " not found"));
        return post.getLikeCount();
    }
    
    // 특정 게시물에 대해 사용자가 좋아요를 눌렀는지 확인
    public boolean isLiked(Long userId, String userType, Long postId) {
        logger.info("좋아요 상태 확인: userId={}, userType={}, postId={}", userId, userType, postId);
        
        UserType type = "SOCIAL".equalsIgnoreCase(userType) ? 
            UserType.SOCIAL : UserType.REGULAR;
        
        PostEntity post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post with ID " + postId + " not found"));
        
        boolean liked = likeRepository.findByUserIdAndUserTypeAndPostEntity(userId, type, post).isPresent();
        logger.info("좋아요 상태: userId={}, userType={}, postId={}, liked={}", userId, userType, postId, liked);
        return liked;
    }
    
    // 이전 findUserById 메서드는 더 이상 사용하지 않음 - 사용자 ID와 타입으로 직접 처리
}