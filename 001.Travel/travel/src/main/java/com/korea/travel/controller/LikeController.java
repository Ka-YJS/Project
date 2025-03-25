package com.korea.travel.controller;

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
    private final SocialRepository socialRepository; // 소셜 유저 처리를 위해 추가

    // 좋아요 추가
    @PostMapping("/likes/{postId}")
    public ResponseEntity<LikeDTO> addLike(@PathVariable("postId") Long postId) {
        Long userId = getCurrentUserId();  // 현재 사용자 ID를 추출
        LikeDTO likeDTO = likeService.addLike(userId, postId);
        return ResponseEntity.ok(likeDTO);
    }

    // 좋아요 삭제
    @DeleteMapping("/likes/{postId}")
    public ResponseEntity<LikeDTO> removeLike(@PathVariable("postId") Long postId) {
        Long userId = getCurrentUserId();  // 현재 사용자 ID를 추출
        LikeDTO likeDTO = likeService.removeLike(userId, postId);
        return ResponseEntity.ok(likeDTO);
    }

    // 사용자가 해당 게시물에 좋아요를 눌렀는지 확인
    @GetMapping("/likes/{postId}/isLiked")
    public ResponseEntity<Boolean> isLiked(@PathVariable Long postId) {
        System.out.println("postId:" + postId);
        Long userId = getCurrentUserId();
        boolean liked = likeService.isLiked(userId, postId);
        return ResponseEntity.ok(liked);
    }

    // 현재 로그인된 사용자의 ID를 가져오는 메소드
    private Long getCurrentUserId() {
        // SecurityContext에서 Authentication 객체 가져오기
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null) {
            Object principal = authentication.getPrincipal();
            
            // Principal이 어떤 타입인지 확인하여 처리
            if (principal instanceof UserEntity) {
                // UserEntity 타입인 경우 (일반 로그인)
                return ((UserEntity) principal).getId();
            } else if (principal instanceof SocialEntity) {
                // SocialEntity 타입인 경우 (소셜 로그인)
                return ((SocialEntity) principal).getId();
            } else if (principal instanceof String) {
                String userIdRaw = (String) principal;
                
                // 소셜 로그인 ID 형식 확인 (예: google_123456789)
                if (userIdRaw.contains("_")) {
                    try {
                        String[] parts = userIdRaw.split("_", 2);
                        String provider = parts[0].toUpperCase(); // 소문자 -> 대문자 변환
                        String socialId = parts[1];
                        
                        // 소셜 사용자 찾기
                        SocialEntity socialUser = socialRepository.findBySocialIdAndAuthProvider(
                            socialId, 
                            SocialEntity.AuthProvider.valueOf(provider)
                        );
                        
                        if (socialUser != null) {
                            return socialUser.getId();
                        } else {
                            System.out.println("소셜 사용자를 찾을 수 없음: " + userIdRaw);
                        }
                    } catch (Exception e) {
                        System.out.println("소셜 ID 처리 중 오류: " + e.getMessage());
                    }
                }
                
                // 일반 로그인 사용자 처리
                UserEntity user = userRepository.findByUserId(userIdRaw);
                if (user != null) {
                    return user.getId();
                } else {
                    System.out.println("일반 사용자를 찾을 수 없음: " + userIdRaw);
                }
            }
        }
        
        throw new RuntimeException("Authentication failed: User not found");
    }
}