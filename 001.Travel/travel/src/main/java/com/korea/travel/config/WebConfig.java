package com.korea.travel.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
	
	@Override
	public void addCorsMappings(CorsRegistry registry) {
		registry.addMapping("/**")	//모든 경로에 대해 CORS 설정
				.allowedOrigins("http://todo-test-dev.store","https://todo-test-dev.store")	//허용할 출처
				.allowedMethods("GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS")	//허용할 HTTP 메서드
				.allowedHeaders("*")		//모든 헤더 허용
				.allowCredentials(true)	//쿠키나 인증 정보를 포함한 요청 허용
		        .exposedHeaders("Authorization");// OAuth2 리디렉션을 위한 설정 추가
	}
	
	//업로드된 파일을 제공할 수 있도록 설정
	@Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        		// /uploads/** 경로에 대한 요청 처리
        registry.addResourceHandler("/uploads/**")
        		//실제 파일 위치 설정
        .addResourceLocations("file:" + System.getProperty("user.dir") + "/uploads/");
        
        // 프로필 사진 경로
        registry.addResourceHandler("/uploads/profilePictures/**")
        .addResourceLocations("file:" + System.getProperty("user.dir") + "/uploads/profilePictures/");
    }
}