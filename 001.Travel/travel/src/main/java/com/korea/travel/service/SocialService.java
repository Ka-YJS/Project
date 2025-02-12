package com.korea.travel.service;

import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;

import com.korea.travel.dto.SocialDTO;
import com.korea.travel.dto.UserDTO;
import com.korea.travel.mapper.UserMapper;
import com.korea.travel.model.SocialEntity;
import com.korea.travel.model.UserEntity;
import com.korea.travel.persistence.SocialRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class SocialService {
    private final SocialRepository socialRepository;
    
    @Autowired
    private UserMapper userMapper; // UserMapper 주입
    
    // OAuth2User -> UserDTO 변환 및 처리 -> UserDTO 변환 메서드
    public UserDTO getUserDTO(UserEntity userEntity) {
        return userMapper.toUserDTO(userEntity);
    }
    
    // OAuth 로그인 처리 -> OAuth 관련 메서드 추가
    @Transactional
    public void handleOAuthLogin(OAuth2User oauth2User, String provider) {
        SocialEntity socialEntity = userMapper.toSocialEntity(oauth2User, provider);
        saveOrUpdate(SocialDTO.dto.of(
            provider,
            "sub",
            oauth2User.getAttributes()
        ));
    }
    
    // saveOrUpdate : 소셜 사용자 정보 저장/업데이트
    @Transactional
    public SocialEntity saveOrUpdate(SocialDTO.dto socialDTO) {
        SocialEntity user = socialRepository.findBySocialId(socialDTO.getSocialId())
                .map(entity -> entity.update(
                    socialDTO.getName(), 
                    socialDTO.getEmail(), 
                    socialDTO.getPicture()
                ))
                .orElse(socialDTO.toEntity());
        return socialRepository.save(user);
    }
    
    // findBySocialId : 소셜ID로 사용자 찾기
    @Transactional(readOnly = true)
    public SocialEntity findBySocialId(String socialId) {
        return socialRepository.findBySocialId(socialId)
                .orElseThrow(() -> new RuntimeException("User not found with socialId: " + socialId));
    }
    
    // updateUserInfo : 사용자 정보 업데이트
    @Transactional
    public void updateUserInfo(String socialId, String name, String picture) {
        SocialEntity user = findBySocialId(socialId);
        user.updateInfo(name, picture);
    }
    
    // OAuth 사용자 정보 업데이트 -> OAuth 관련 메서드 추가
    @Transactional
    public void updateOAuthUserInfo(String socialId, OAuth2User oauth2User, String provider) {
        SocialEntity user = findBySocialId(socialId);
        userMapper.updateSocialEntity(user, oauth2User);
    }
    
    // deleteUser : 사용자 삭제
    @Transactional
    public void deleteUser(String socialId) {
        SocialEntity user = findBySocialId(socialId);
        socialRepository.delete(user);
    }
    
    // exists 메서드들 : 사용자 존재 여부 확인
    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return socialRepository.existsByEmail(email);
    }
    
    @Transactional(readOnly = true)
    public boolean existsBySocialId(String socialId) {
        return socialRepository.existsBySocialId(socialId);
    }
    
    // Social -> User 변환 -> 엔티티 변환 메서드 추가
    @Transactional
    public UserEntity convertToUserEntity(String socialId) {
        SocialEntity socialEntity = findBySocialId(socialId);
        return userMapper.socialToUserEntity(socialEntity);
    }
    
    // 세션 정보 생성 -> 엔티티 변환 메서드 추가
    public SocialDTO.Session createSession(SocialEntity entity) {
        return userMapper.toSocialSession(entity);
    }
}