import React,{useState} from 'react'
import {GoogleMap, LoadScript } from '@react-google-maps/api';
import Write from './Write';


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

const containerStyle = {
  width: '700px',
  height: '400px'
};

const center = {
  lat: 14.018000,
  lng: 120.835941
};

  return (
    <div style={{
      flex:1,
      textAlign: "center",
      display: "flex",
      width: "100vw",
      minHeight: "100vh", // 화면의 높이에 맞게 최소 높이를 설정
  }}>
    {/* 주소검색 입력폼 및 검색버튼 */}
    <div style={{
      
    }}>
     
    <div>
    <input
          type="text"
          placeholder="주소를 입력하세요"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          style={{ flex:1}}
      />
        <button onClick={() => {}}>검색</button>
   </div>
      <LoadScript
        googleMapsApiKey="AIzaSyDdfuKZuF0IpsUtjlx_Syh-gmJhCE70t-8"
      >
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={14}
        >
          <></>
        </GoogleMap>
      </LoadScript>
    </div>
      <div style={{
        display:"flex",
        
      }}>
        <Write/>
      </div>
    </div>
  )
}

export default React.memo(MapWrite)
