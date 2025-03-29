package com.korea.travel.persistence;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.korea.travel.model.LikeEntity;
import com.korea.travel.model.LikeEntity.UserType;
import com.korea.travel.model.PostEntity;

public interface LikeRepository extends JpaRepository<LikeEntity, Long> {
   // 사용자 ID, 타입 및 게시글로 좋아요 조회
   Optional<LikeEntity> findByUserIdAndUserTypeAndPostEntity(Long userId, UserType userType, PostEntity postEntity);
   
   int countByPostEntity(PostEntity postEntity);
}