package com.korea.travel.persistence;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.korea.travel.model.PostEntity;
import com.korea.travel.model.UserEntity;

@Repository
public interface PostRepository extends JpaRepository<PostEntity, Long> {
	
	List<PostEntity> findByUserEntity(UserEntity userEntity);
	
}
