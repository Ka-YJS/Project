package com.korea.travel.model;

import java.util.List;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@Table(name = "posts")
@Entity
@AllArgsConstructor
@NoArgsConstructor
public class PostEntity {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long postId;				//고유 id
	
	@Column(nullable = false)
    private String postTitle;
    
    @Column(columnDefinition = "TEXT")
    private String postContent;
    
    @Column(nullable = false)
    private String userNickname;
    
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "post_places", joinColumns = @JoinColumn(name = "post_id"))
    @Column(name = "place_list")
    private List<String> placeList;
    
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "post_images", joinColumns = @JoinColumn(name = "post_id"))
    @Column(name = "image_urls")
    private List<String> imageUrls;
    
    private String postCreatedAt;
    
    // UserEntity와의 연관 관계 설정 (ManyToOne)
    @ManyToOne(fetch = FetchType.EAGER)  // 다대일 관계 user가 여러 게시글을 쓸수있게해준다.
    @JoinColumn(name = "user_id")       // 외래 키 컬럼명
    private UserEntity userEntity;            // 해당 게시글을 작성한 UserEntity
    
    // 좋아요를 눌렀던 유저들과의 관계 (OneToMany)
    @OneToMany(mappedBy = "postEntity")
    private List<LikeEntity> likeEntities; // 좋아요 엔티티 리스트

    // 좋아요 수 계산
    public int getLikeCount() {
        return likeEntities.size();  // LikeEntity 리스트의 크기 반환
    }
    
}