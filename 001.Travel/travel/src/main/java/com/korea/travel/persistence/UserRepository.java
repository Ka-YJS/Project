package com.korea.travel.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.korea.travel.model.UserEntity;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {
		
		UserEntity findByUserId(String userId);
		
		UserEntity findByUserName(String userName);
		
		Boolean existsByUserId(String userId);
		
		UserEntity findByUserNameAndUserPhoneNumber(String UserName,String userPhoneNumber);
		// 아이디, 이름, 전화번호로 사용자 조회 (비밀번호 찾기)
		UserEntity findByUserIdAndUserNameAndUserPhoneNumber(
			String userId, String userName, String userPhoneNumber
		);
		
}
