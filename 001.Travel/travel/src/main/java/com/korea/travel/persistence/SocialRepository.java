package com.korea.travel.persistence;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.korea.travel.model.SocialEntity;
import com.korea.travel.model.SocialEntity.AuthProvider;

@Repository
public interface SocialRepository extends JpaRepository<SocialEntity, Long> {
    Optional<SocialEntity> findBySocialId(String socialId); // socialId로 사용자 찾기
    Optional<SocialEntity> findByEmailAndAuthProvider(String email, AuthProvider authProvider);
    // 이메일과 인증 제공자로 사용자 찾기
    
    // 소셜 ID와 제공자로 사용자 찾기 메서드 추가
    SocialEntity findBySocialIdAndAuthProvider(String socialId, AuthProvider authProvider);
    
    boolean existsByEmail(String email); // 이메일 존재 여부 확인 메서드
    boolean existsBySocialId(String socialId); // 소셜ID 존재 여부 확인 메서드
}