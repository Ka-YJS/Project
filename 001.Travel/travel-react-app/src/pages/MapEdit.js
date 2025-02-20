import React, { useContext, useState, useEffect } from "react";
import { GoogleMap, Marker, InfoWindow, Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import PostEdit from "./PostEdit";
import TopIcon from "../TopIcon/TopIcon";
import config from "../Apikey";
import { ListContext } from "../context/ListContext";
import { Button } from "@mui/material";
import "../css/Map.css";
import { CopyListContext } from "../context/CopyListContext";
import { CopyPlaceListContext } from "../context/CopyPlaceListContext";
import backgroundImage from "../image/flowers.png";

// 컴포넌트 외부에서 libraries 배열을 정의
const libraries = ["places"];

const MapEdit = () => {
    const [placeList, setPlaceList] = useState([])
    const { copyList, setCopyList } = useContext(CopyListContext);
    const {copyPlaceList, setCopyPlaceList} = useContext(CopyPlaceListContext);
    const [map, setMap] = useState(null);
    const [center, setCenter] = useState({ lat: 37.5665, lng: 126.9780 });
    const [markerPosition, setMarkerPosition] = useState(null);
    const [placeDescription, setPlaceDescription] = useState("");  // 장소 설명
    const [placeName, setPlaceName] = useState("");
    const [searchBox, setSearchBox] = useState(null);
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [photoUrl, setPhotoUrl] = useState(null);
    

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.REACT_APP_REACT_APP_GOOGLE_MAPS_API_KEY,
        libraries: libraries,
        language:"ko"
    });

    const [topIconHeight, setTopIconHeight] = useState(0);

    useEffect(() => {
        const topIconElement = document.querySelector('.home-header');
        if (topIconElement) {
            setTopIconHeight(topIconElement.offsetHeight);
        }
    }, []);

    if (!isLoaded) {
        return <div>Loading...</div>;
    }

    if (loadError) {
        return <div>Google Maps API 로드 중 오류가 발생했습니다.</div>;
    }

    const handleMapClick = async (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        setMarkerPosition({ lat, lng });
        setPlaceName("선택된 위치");
        setPhotoUrl(null);
        setSelectedMarker({ position: { lat, lng } });
    };

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

    const handleSearchBoxLoad = (autocomplete) => {
        setSearchBox(autocomplete);
    };

    const handlePlaceChanged = async () => {
        if (searchBox !== null) {
            const place = searchBox.getPlace();
            if (place.geometry) {
                const { location } = place.geometry;
                setCenter({ lat: location.lat(), lng: location.lng() });
                setMarkerPosition({ lat: location.lat(), lng: location.lng() });
                setPlaceName(place.name || "알 수 없는 장소");
                
                setPlaceDescription(place.formatted_address || "주소 정보 없음");  // 주소 설정

                setSelectedMarker({ position: { lat: location.lat(), lng: location.lng() } });
            }
        }
    };

    

    const getPhotoUrl = (photoReference) => {
        return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${process.env.REACT_APP_REACT_APP_GOOGLE_MAPS_API_KEY}`;
    };

    const handleAddToPlaceList = () => {
        if (placeName) {
            setCopyPlaceList((prevList) => [...prevList, placeName]);
            setPlaceName("");
        }
    };

    const handleDeleteFromTodoList = (index) => {
        setCopyPlaceList((prevList) => prevList.filter((_, i) => i !== index));
        setCopyList((prevList) => prevList.filter((_, i) => i !== index));
    };

    return (
        <div style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }} >
        <div style={{zIndex:"2000"}}>
        <TopIcon text="수정하기"/>
    </div>
        <div className="map-container">
            <div className="map-sidebar">
                <div className="map-search-container">
                    <Autocomplete onLoad={handleSearchBoxLoad} onPlaceChanged={handlePlaceChanged}>
                        <input
                            type="text"
                            placeholder="장소 또는 주소 검색 후 엔터"
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
                                추가
                            </button>
                        </div>
                    )}
                </div>

                {/* GoogleMap을 map-search-container 아래에 배치 */}
                <div className="google-map-container">
                    <GoogleMap
                        mapContainerStyle={{
                            width: "100%",
                            height: "100%", // 원하는 높이로 설정 (450px)
                        }}
                        center={center}
                        zoom={14}
                        // onClick={handleMapClick}
                        onLoad={(map) => setMap(map)}
                    >
                        {markerPosition && (
                            <Marker
                                position={markerPosition}
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
                                setCopyList(copyPlaceList);
                                console.log("list: " + copyList, "placeList: " + copyPlaceList);
                            }}
                        >
                            추가하기
                        </Button>
                    </h3>
                    <ul>
                        {copyPlaceList.map((item, index) => (
                            <li className="map-list-item" key={index}>
                                {item}
                                <button
                                    onClick={() => handleDeleteFromTodoList(index)}
                                    className="map-list-item-button"
                                >
                                    삭제
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="map-content">
                <PostEdit />
            </div>
        </div>
    </div>
    );
};

export default MapEdit;
