package com.korea.travel.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.korea.travel.dto.SocialDTO;
import com.korea.travel.model.SocialEntity;
import com.korea.travel.security.TokenProvider;
import com.korea.travel.service.SocialService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/social")
public class SocialController {
    private final SocialService socialService;
    private final TokenProvider tokenProvider;
    
    // 소셜 사용자 정보 저장/업데이트
    @PostMapping("/user")
    public ResponseEntity<?> saveOrUpdateUser(@RequestBody SocialDTO.dto socialDTO) {
    	
        
     // 필수 필드 검증 추가
        if (socialDTO.getName() == null || socialDTO.getSocialId() == null) {
            throw new IllegalArgumentException("Name and socialId are required fields");
        }
        
        try {
            // 사용자 저장/업데이트
            SocialEntity entity = socialService.saveOrUpdate(socialDTO);
            log.info("Successfully saved/updated user: {}", entity);
            
            // 토큰 생성
            String token = tokenProvider.createToken(
                entity.getSocialId(), 
                entity.getEmail(), 
                entity.getRole().name()
            );
            
            // 응답 데이터 구성
            Map<String, Object> response = new HashMap<>();
            response.put("accessToken", token);
            response.put("socialId", entity.getSocialId());
            response.put("name", entity.getName());
            response.put("email", entity.getEmail());
            response.put("picture", entity.getPicture());
            
            // 생성된 토큰 로깅 (디버깅용)
            log.info("Generated token for user {}: {}", entity.getSocialId(), token);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error in saveOrUpdateUser: ", e);
            throw e;
        }
    }
    
    // 소셜 ID로 사용자 조회
    @GetMapping("/user/{socialId}")
    public ResponseEntity<SocialEntity> getUser(@PathVariable String socialId) {
        log.info("Fetching user with socialId: {}", socialId);
        return ResponseEntity.ok(socialService.findBySocialId(socialId));
    }
    
    // 사용자 정보 업데이트
    @PutMapping("/user/{socialId}")
    public ResponseEntity<?> updateUser(
            @PathVariable String socialId,
            @RequestParam String name,
            @RequestParam String picture) {
        log.info("Updating user info for socialId: {}", socialId);
        socialService.updateUserInfo(socialId, name, picture);
        return ResponseEntity.ok().build();
    }
    
    // 사용자 삭제
    @DeleteMapping("/user/{socialId}")
    public ResponseEntity<?> deleteUser(@PathVariable String socialId) {
        log.info("Deleting user with socialId: {}", socialId);
        socialService.deleteUser(socialId);
        return ResponseEntity.ok().build();
    }
    
    // 이메일 존재 여부 확인
    @GetMapping("/check/email")
    public ResponseEntity<Boolean> checkEmail(@RequestParam String email) {
        log.info("Checking email existence: {}", email);
        return ResponseEntity.ok(socialService.existsByEmail(email));
    }
    
    // 소셜 ID 존재 여부 확인
    @GetMapping("/check/socialId")
    public ResponseEntity<Boolean> checkSocialId(@RequestParam String socialId) {
        log.info("Checking socialId existence: {}", socialId);
        return ResponseEntity.ok(socialService.existsBySocialId(socialId));
    }
    
    // 예외 처리
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleRuntimeException(RuntimeException e) {
        log.error("Error occurred: ", e);
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}