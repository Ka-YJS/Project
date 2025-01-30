package com.korea.travel.persistence;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.korea.travel.model.LikeEntity;
import com.korea.travel.model.PostEntity;
import com.korea.travel.model.UserEntity;

public interface LikeRepository extends JpaRepository<LikeEntity, Long> {

    // 특정 유저와 특정 게시물에 대한 좋아요 조회
    Optional<LikeEntity> findByUserEntityAndPostEntity(UserEntity userEntity, PostEntity postEntity);
    
    int countByPostEntity(PostEntity postEntity);
    // 특정 게시물에 대한 모든 좋아요 조회
//    List<LikeEntity> findByPostEntity(PostEntity postEntity);
}
