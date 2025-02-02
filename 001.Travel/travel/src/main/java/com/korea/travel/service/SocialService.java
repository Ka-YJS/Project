package com.korea.travel.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.korea.travel.dto.SocialDTO;
import com.korea.travel.model.SocialEntity;
import com.korea.travel.persistence.SocialRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class SocialService {
    private final SocialRepository socialRepository;
    
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
}