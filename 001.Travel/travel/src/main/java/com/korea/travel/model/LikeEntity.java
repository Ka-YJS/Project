package com.korea.travel.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.ForeignKey;

@Data
@Table(name = "likes")
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class LikeEntity {
   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   private Long id; // 고유 id
   
   @Column(name = "user_id")
   private Long userId; // user_id 저장
   
   @Column(name = "user_type")
   @Enumerated(EnumType.STRING)
   private UserType userType; // 사용자 타입 (REGULAR 또는 SOCIAL)
   
   @ManyToOne(fetch = FetchType.LAZY)
   @JoinColumn(name = "post_id", foreignKey = @ForeignKey(name = "FK_likes_post_id"))
   private PostEntity postEntity; // 좋아요가 눌린 게시글
   
   // 사용자 타입 열거형
   public enum UserType {
       REGULAR, SOCIAL
   }
}