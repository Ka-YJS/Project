package com.korea.travel.security;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SocialRole {
	
    ADMIN("ROLE_ADMIN", "관리자"),
    USER("ROLE_USER", "일반사용자");
    
    private final String key;
    private final String title;
    
    // Spring Security에서 사용할 권한 키 반환
    public String getKey() {
        return this.key;
    }
    
    // 화면 표시용 타이틀 반환
    public String getTitle() {
        return this.title;
    }

}
