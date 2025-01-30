package com.korea.travel.model;

import org.apache.catalina.User;

import jakarta.persistence.Entity;
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
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id") // user_id 외래키
    private UserEntity userEntity; // 좋아요를 누른 유저

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id") // post_id 외래키
    private PostEntity postEntity; // 좋아요가 눌린 게시글

    // 추가적인 메서드들이 필요하면 여기에 추가 가능
}