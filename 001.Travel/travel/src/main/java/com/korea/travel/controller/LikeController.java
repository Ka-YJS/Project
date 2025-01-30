package com.korea.travel.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.korea.travel.dto.LikeDTO;
import com.korea.travel.model.UserEntity;
import com.korea.travel.persistence.UserRepository;
import com.korea.travel.service.LikeService;

import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/travel")
@RequiredArgsConstructor
public class LikeController {

    private final LikeService likeService;
    private final UserRepository  userRepository;

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
        // SecurityContextHolder에서 userId를 추출
        UsernamePasswordAuthenticationToken authentication = 
            (UsernamePasswordAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
     // Authentication 객체에서 사용자 이름을 가져옴
        String username = (String) authentication.getPrincipal();
        
        UserEntity user = userRepository.findByUserId(username);
        // 사용자 이름을 Long 타입으로 변환하여 반환
        return user.getId();
    }
}