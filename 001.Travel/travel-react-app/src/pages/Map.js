import React, { useContext, useState, useEffect } from "react";
import { GoogleMap, Marker, InfoWindow, Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import Write from "./Write";  // 작성 컴포넌트
import TopIcon from "../TopIcon/TopIcon";  // 상단 아이콘
import { PlaceContext } from "../context/PlaceContext";  // 장소 목록을 관리하는 컨텍스트
import { ListContext } from "../context/ListContext";  // 리스트 관리 컨텍스트
import { Button } from "@mui/material";  // 버튼 컴포넌트
import { CopyListContext } from "../context/CopyListContext";  // 복사 리스트 관리 (사용되지 않는 듯)
import "../css/Map.css";  // 스타일 파일
import backgroundImage from "../image/flowers.png";


// 컴포넌트 외부에서 libraries 배열을 정의 (Google Maps의 places 라이브러리 사용)
const libraries = ["places"];

const Map = () => {
    // Context로부터 장소 목록과 리스트 상태를 가져옴
    const { placeList, setPlaceList } = useContext(PlaceContext);
    const { list, setList } = useContext(ListContext);

    // 상태 변수 정의
    const [map, setMap] = useState(null);  // 지도 객체
    const [center, setCenter] = useState({ lat: 37.5665, lng: 126.9780 });  // 지도 중심 좌표 (서울)
    const [markerPosition, setMarkerPosition] = useState(null);  // 마커의 위치
    const [placeName, setPlaceName] = useState("");  // 검색된 장소 이름
    const [placeDescription, setPlaceDescription] = useState("");  // 장소 설명
    const [searchBox, setSearchBox] = useState(null);  // Autocomplete 검색 박스
    const [selectedMarker, setSelectedMarker] = useState({ position: { lat: 37.5665, lng: 126.9780 } });  // 선택된 마커

    // Google Maps API 로드 상태
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,  // Google API 키
        libraries: libraries,  // 사용할 라이브러리
        language:"ko",  // 언어 설정 (한국어)
    });
    
    // 화면 로딩 중 TopIcon의 높이를 계산하여 상단에 여백을 두기 위한 상태 변수
    const [topIconHeight, setTopIconHeight] = useState(0);

    useEffect(() => {
        const topIconElement = document.querySelector('.home-header');
        if (topIconElement) {
            setTopIconHeight(topIconElement.offsetHeight);  // 상단 아이콘의 높이를 가져와 상태에 설정
        }
    }, []);  // 컴포넌트가 처음 렌더링될 때 한 번 실행

    // 지도와 관련된 Google Maps API가 로드되지 않으면 '로딩 중' 메시지 출력
    if (!isLoaded) {
        return <div>Loading...</div>;
    }

    // Google Maps API 로드 중 오류가 발생한 경우 오류 메시지 출력
    if (loadError) {
        return <div>Google Maps API 로드 중 오류가 발생했습니다.</div>;
    }

    
    // // 지도를 클릭했을 때 마커 위치와 관련 정보를 설정
    // const handleMapClick = async (event) => {
    //     const lat = event.latLng.lat();  // 클릭된 위치의 위도
    //     const lng = event.latLng.lng();  // 클릭된 위치의 경도
    //     setMarkerPosition({ lat, lng });  // 마커의 위치 업데이트
    //     setPlaceName("선택된 위치");  // 기본 장소 이름
    //     setPlaceDescription("");  // 설명 초기화
    //     setSelectedMarker({ position: { lat, lng } });  // 선택된 마커 설정
    // };

    // 지도에서 마커를 클릭했을 때 InfoWindow를 다시 표시할 수 있도록 설정
    const handleMarkerClick = (position) => {
        setSelectedMarker({
            position,  // 클릭한 마커 위치
        });
    };

     // InfoWindow를 닫을 때 selectedMarker를 null로 설정
     const handleInfoWindowClose = () => {
        setSelectedMarker(null);  // InfoWindow 닫을 때 selectedMarker를 null로 설정
    };


    // Autocomplete 검색 박스를 로드했을 때의 콜백
    const handleSearchBoxLoad = (autocomplete) => {
        setSearchBox(autocomplete);  // Autocomplete 객체를 상태에 저장
    };

    // 검색한 장소가 변경되었을 때 호출되는 함수
    const handlePlaceChanged = async () => {
        if (searchBox !== null) {
            const place = searchBox.getPlace();  // 검색된 장소 정보 가져오기
            console.log("place : "+ place);
            // console.log(JSON.stringify(place, null, 2));

            if (place.geometry) {
                const { location } = place.geometry;
                setCenter({ lat: location.lat(), lng: location.lng() });  // 지도 중심 위치 업데이트
                setMarkerPosition({ lat: location.lat(), lng: location.lng() });  // 마커 위치 업데이트
                setPlaceName(place.name || "알 수 없는 장소");  // 장소 이름 설정

                // 장소에 대한 설명을 가져옴 (예: 주소, 운영 시간 등)
                setPlaceDescription(place.formatted_address || "주소 정보 없음");  // 주소 설정
                // 필요한 경우 여기에 추가적인 장소 정보를 설정할 수 있음
                // 예: setPlaceDescription(place.opening_hours, place.website 등)

                setSelectedMarker({ position: { lat: location.lat(), lng: location.lng() } });  // 마커 업데이트
            }
        }
    };

    // 장소 목록에 선택된 장소를 추가하는 함수
    const handleAddToPlaceList = () => {
        if (placeName) {
            // 장소 목록과 list 상태 모두 업데이트
            const newPlace = placeName;
            
            // placeList에 추가
            setPlaceList(prevList => [...prevList, newPlace]);
            
            // list에도 직접 추가 (이 부분이 중요!)
            setList(prevList => [...prevList, newPlace]);
            
        }
    };
    
    // 장소 목록에서 특정 장소를 삭제하는 함수
    const handleDeleteFromTodoList = (index) => {
        setPlaceList((prevList) => prevList.filter((_, i) => i !== index));  // 장소 목록에서 삭제
        setList((prevList) => prevList.filter((_, i) => i !== index));  // 리스트에서 삭제
    };

    return (
    <div style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }} >
        <div style={{zIndex:"2000"}}>
               <TopIcon text="기록하기" />  {/* 상단 아이콘 표시 */}
            </div>
        <div className="map-container">
            <div className="map-sidebar">
                <div className="map-search-container">
                    <Autocomplete onLoad={handleSearchBoxLoad} onPlaceChanged={handlePlaceChanged}>
                        <input
                            type="text"
                            placeholder="장소 또는 주소 검색 후 클릭"
                            className="map-search-input"
                        />
                    </Autocomplete>
                    {placeName && (
                        <div className="place-info-container">
                            <strong>장소 이름:</strong> {placeName}
                            <button
                                onClick={handleAddToPlaceList}
                                className="place-info-button"
                            >
                                추가  {/* 장소 추가 버튼 */}
                            </button>
                        </div>
                    )}
                </div>

                {/* GoogleMap을 map-search-container 아래에 배치 */}
                <div className="google-map-container">
                    <GoogleMap
                        mapContainerStyle={{
                            width: "100%",
                            height: "100%",  // 지도 높이 설정
                        }}
                        center={center}  // 지도 중심 좌표
                        zoom={14}  // 기본 줌 레벨
                        // onClick={handleMapClick}  // 지도 클릭 시 콜백
                        onLoad={(map) => setMap(map)}  // 지도 로드 시 콜백
                    >
                        {markerPosition && (
                            <Marker
                                position={markerPosition}  // 마커 위치 설정
                                onClick={() => handleMarkerClick(markerPosition)}
                            />
                        )}

                        {selectedMarker && placeName && (
                            <InfoWindow
                                position={{
                                    lat: selectedMarker.position.lat + 0.0027,
                                    lng: selectedMarker.position.lng,
                                }}
                                onCloseClick={handleInfoWindowClose}
                            >
                                <div style={{ position: 'relative', fontSize: "12px", lineHeight: "1.5", textAlign: "center", padding: "5px" }}>
                                    <h3 style={{ fontSize: "14px", margin: "5px 0", color: "#333" }}>{placeName}</h3>
                                    <p style={{ fontSize: "12px", margin: "5px 0", color: "#666" }}>{placeDescription}</p>
                                </div>
                            </InfoWindow>
                        )}
                    </GoogleMap>
                </div>

                <div className="map-list-container">
                    <h3 className="map-list-title">
                        여행지 List
                        <Button
                            onClick={() => {
                                // placeList에 항목이 있는지 확인
                                if (placeList.length === 0) {
                                    alert("추가할 여행지가 없습니다. 먼저 장소를 검색하고 추가해주세요.");
                                    return;
                                }
                                
                                // placeList의 모든 항목을 list에 복사 (중복 없이)
                                setList(prevList => {
                                    // 중복 항목을 제거한 새 배열 생성
                                    const uniqueItems = [...new Set([...prevList, ...placeList])];
                                    console.log("추가 후 list:", uniqueItems);
                                    return uniqueItems;
                                });
                                
                                // 추가 후 placeList 초기화
                                setPlaceList([]);
                            }}
                        >
                            추가하기
                        </Button>
                    </h3>
                    <ul>
                        {placeList.map((item, index) => (
                            <li className="map-list-item" key={index}>
                                {item}  {/* 리스트의 각 여행지 */}
                                <button
                                    onClick={() => handleDeleteFromTodoList(index)}  // 삭제 버튼 클릭 시
                                    className="map-list-item-button"
                                >
                                    삭제  {/* 삭제 버튼 */}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="map-content">
                <Write />  {/* 작성 컴포넌트 */}
            </div>
        </div>
        </div>
    );
};

export default Map;