package com.korea.travel.config;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.io.File;

@Configuration
public class WebConfig implements WebMvcConfigurer {
   /*
   @Override
   public void addCorsMappings(CorsRegistry registry) {
   	registry.addMapping("/**")	//모든 경로에 대해 CORS 설정
   			.allowedOrigins("http://todo-test-dev.store","https://todo-test-dev.store","http://localhost:3000")	//허용할 출처
   			.allowedMethods("GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS")	//허용할 HTTP 메서드
   			.allowedHeaders("*")		//모든 헤더 허용
   			.allowCredentials(true)	//쿠키나 인증 정보를 포함한 요청 허용
   	        .exposedHeaders("Authorization");// OAuth2 리디렉션을 위한 설정 추가
   }*/
   
   //업로드된 파일을 제공할 수 있도록 설정
   @Override
   public void addResourceHandlers(ResourceHandlerRegistry registry) {
       String uploadPath = System.getProperty("user.dir") + "/uploads/";
       
       // 디버깅 정보 출력
       System.out.println("==== 리소스 경로 정보 ====");
       System.out.println("업로드 경로: " + uploadPath);
       
       // 디렉토리 존재 여부 확인
       File uploadDir = new File(uploadPath);
       System.out.println("디렉토리 존재: " + uploadDir.exists());
       System.out.println("디렉토리 접근 가능: " + uploadDir.canRead());
       
       if (!uploadDir.exists()) {
           System.out.println("경고: 업로드 디렉토리가 존재하지 않습니다. 생성을 시도합니다.");
           boolean created = uploadDir.mkdirs();
           System.out.println("디렉토리 생성 성공: " + created);
       } else {
           System.out.println("업로드 디렉토리 확인됨: " + uploadDir.getAbsolutePath());
           
           // 파일 목록 확인
           File[] files = uploadDir.listFiles();
           if (files != null && files.length > 0) {
               System.out.println("디렉토리 내 파일 목록:");
               for (File file : files) {
                   System.out.println(" - " + file.getName());
               }
           } else {
               System.out.println("디렉토리가 비어있거나 파일을 나열할 수 없습니다.");
           }
       }
       
       // 리소스 핸들러 설정 - 통합된 설정
       registry.addResourceHandler("/uploads/**")
              .addResourceLocations("file:" + uploadPath)
              .setCachePeriod(3600)
              .resourceChain(true);
   }
}