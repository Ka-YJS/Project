package com.korea.travel.controller;

import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.korea.travel.dto.LikeDTO;
import com.korea.travel.model.SocialEntity;
import com.korea.travel.model.UserEntity;
import com.korea.travel.persistence.SocialRepository;
import com.korea.travel.persistence.UserRepository;
import com.korea.travel.service.LikeService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/travel")
@RequiredArgsConstructor
public class LikeController {
    private final LikeService likeService;
    private final UserRepository userRepository;
    private final SocialRepository socialRepository;
    
    // 좋아요 추가
    @PostMapping("/likes/{postId}")
    public ResponseEntity<LikeDTO> addLike(@PathVariable("postId") Long postId) {
        UserIdInfo userInfo = getCurrentUserInfo();
        LikeDTO likeDTO = likeService.addLike(userInfo.userId, userInfo.userType, postId);
        return ResponseEntity.ok(likeDTO);
    }

    // 좋아요 삭제
    @DeleteMapping("/likes/{postId}")
    public ResponseEntity<LikeDTO> removeLike(@PathVariable("postId") Long postId) {
        UserIdInfo userInfo = getCurrentUserInfo();
        LikeDTO likeDTO = likeService.removeLike(userInfo.userId, userInfo.userType, postId);
        return ResponseEntity.ok(likeDTO);
    }

    // 사용자가 해당 게시물에 좋아요를 눌렀는지 확인
    @GetMapping("/likes/{postId}/isLiked")
    public ResponseEntity<Boolean> isLiked(@PathVariable Long postId) {
        System.out.println("postId:" + postId);
        UserIdInfo userInfo = getCurrentUserInfo();
        boolean liked = likeService.isLiked(userInfo.userId, userInfo.userType, postId);
        return ResponseEntity.ok(liked);
    }
    
    // 사용자 ID와 타입을 포함하는 내부 클래스
    private static class UserIdInfo {
        Long userId;
        String userType;
        
        UserIdInfo(Long userId, String userType) {
            this.userId = userId;
            this.userType = userType;
        }
    }
    
    // 현재 로그인된 사용자의 ID와 타입을 가져오는 메소드
    private UserIdInfo getCurrentUserInfo() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null) {
            Object principal = authentication.getPrincipal();
            
            if (principal instanceof UserEntity) {
                return new UserIdInfo(((UserEntity) principal).getId(), "REGULAR");
            } else if (principal instanceof SocialEntity) {
                return new UserIdInfo(((SocialEntity) principal).getId(), "SOCIAL");
            } else if (principal instanceof String) {
                String userIdRaw = (String) principal;
                
                if (userIdRaw.contains("_")) {
                    // 소셜 로그인 (google_123456789)
                    try {
                        String[] parts = userIdRaw.split("_", 2);
                        String provider = parts[0].toUpperCase();
                        String socialId = parts[1];
                        
                        // 소셜 ID로 사용자 찾기
                        SocialEntity socialUser = socialRepository.findBySocialIdAndAuthProvider(
                            socialId, 
                            SocialEntity.AuthProvider.valueOf(provider)
                        );
                        
                        if (socialUser != null) {
                            return new UserIdInfo(socialUser.getId(), "SOCIAL");
                        }
                        
                        // 소셜 사용자를 찾을 수 없는 경우 임시 ID 1L 반환
                        return new UserIdInfo(1L, "SOCIAL");
                    } catch (Exception e) {
                        System.out.println("소셜 ID 처리 오류: " + e.getMessage());
                    }
                }
                
                // 일반 사용자 처리
                Optional<UserEntity> userOptional = userRepository.findByUserId(userIdRaw);
                if (userOptional.isPresent()) {
                    UserEntity user = userOptional.get();
                    return new UserIdInfo(user.getId(), "REGULAR");
                }
            }
        }
        
        throw new RuntimeException("Authentication failed: User not found");
    }
}