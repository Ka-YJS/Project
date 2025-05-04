import React, { useState, useEffect, useContext } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import Write from './Write';
import { ListContext } from '../context/ListContext';


let map;
let service;
let infowindow;

function initMap() {
  const sydney = new google.maps.LatLng(-33.867, 151.195);

  infowindow = new google.maps.InfoWindow();
  map = new google.maps.Map(document.getElementById("map"), {
    center: sydney,
    zoom: 15,
  });

  const request = {
    query: "Museum of Contemporary Art Australia",
    fields: ["name", "geometry"],
  };

  service = new google.maps.places.PlacesService(map);
  service.findPlaceFromQuery(request, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
      for (let i = 0; i < results.length; i++) {
        createMarker(results[i]);
      }

      map.setCenter(results[0].geometry.location);
    }
  });
}

function createMarker(place) {
  if (!place.geometry || !place.geometry.location) return;

  const marker = new google.maps.Marker({
    map,
    position: place.geometry.location,
  });

  google.maps.event.addListener(marker, "click", () => {
    infowindow.setContent(place.name || "");
    infowindow.open(map);
  });
}

window.initMap = initMap;

function MapWrite() {
  const [searchKeyword, setSearchKeyword] = useState(""); // 주소 검색어 상태
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  
  // ListContext에서 list와 setList를 가져옴
  const { list, setList } = useContext(ListContext);
  
  const containerStyle = {
    width: '700px',
    height: '400px'
  };

  const center = {
    lat: 37.5665,
    lng: 126.9780
  };

  // 맵 로드 완료 시 호출되는 콜백
  const onMapLoad = (mapInstance) => {
    setMap(mapInstance);
  };

  // 장소 검색 함수
  const searchPlaces = () => {
    if (!map || !searchKeyword) return;

    const service = new window.google.maps.places.PlacesService(map);
    const request = {
      query: searchKeyword,
      fields: ['name', 'geometry', 'formatted_address']
    };

    service.findPlaceFromQuery(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        // 검색 결과로 지도 중심 이동
        map.setCenter(results[0].geometry.location);
        
        // 마커 생성
        const newMarkers = results.map(place => ({
          position: place.geometry.location,
          name: place.name,
          address: place.formatted_address || ""
        }));
        
        setMarkers(newMarkers);
      } else {
        alert("검색 결과가 없습니다.");
      }
    });
  };

  // 마커 클릭 핸들러
const handleMarkerClick = (marker) => {
  
  // marker가 null이거나 undefined인 경우 체크
  if (!marker) {
    console.error("marker 객체가 null 또는 undefined입니다");
    return;
  }
  
  // name 속성이 있는지 확인
  if (marker.name === undefined) {
    console.error("marker 객체에 name 속성이 없습니다:", marker);
    // 대체 방법으로 다른 속성 사용 시도
    const placeName = marker.title || marker.id || 
                     (marker.place && marker.place.name) || 
                     "이름 없는 장소";
  } else {
    const placeName = marker.name;
    
    // 이미 추가된 장소인지 확인
    if (!list.includes(placeName)) {
      // list를 새로운 배열로 만들어 복사 후 추가 (불변성 유지)
      const updatedPlaces = [...list, placeName];
      
      // ListContext의 list 업데이트
      setList(updatedPlaces);
      
    } else {
      alert("이미 추가된 여행지입니다.");
    }
  }
};

  // Enter 키로 검색 가능하게 하기
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchPlaces();
    }
  };

  // 테스트용 강제 추가 버튼
  const addTestPlace = () => {
    const testPlace = "테스트 여행지 " + (list.length + 1);
    const updatedList = [...list, testPlace];
    
    setList(updatedList);
  };

  return (
    <div style={{
      flex: 1,
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      width: "100vw",
      minHeight: "100vh",
    }}>

      <div style={{ display: 'flex', width: '100%' }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "20px",
          width: "50%"
        }}>
          <div style={{
            marginBottom: "20px",
            width: "100%",
            display: "flex",
          }}>
            <input
              type="text"
              placeholder="주소를 입력하세요"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{ flex: 1, padding: "8px", marginRight: "5px" }}
            />
            <button 
              onClick={searchPlaces}
              style={{ padding: "8px 15px", cursor: "pointer" }}
            >
              검색
            </button>
          </div>

          <LoadScript
            googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
          >
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={center}
              zoom={14}
              onLoad={onMapLoad}
            >
              {markers.map((marker, index) => (
                <Marker
                  key={index}
                  position={marker.position}
                  onClick={() => handleMarkerClick(marker)}
                />
              ))}
            </GoogleMap>
          </LoadScript>

          <div style={{ marginTop: "20px", width: "100%" }}>
            <h3>선택한 여행지 목록:</h3>
            {list.length > 0 ? (
              <ul style={{ textAlign: "left" }}>
                {list.map((place, index) => (
                  <li key={index}>{place}</li>
                ))}
              </ul>
            ) : (
              <p>여행지를 선택해 주세요.</p>
            )}
          </div>
        </div>

        <div style={{
          display: "flex",
          flex: 1,
          padding: "20px",
          width: "50%"
        }}>
          <Write />
        </div>
      </div>
    </div>
  );
}

export default React.memo(MapWrite);