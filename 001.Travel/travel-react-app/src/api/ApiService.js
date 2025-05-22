import axios from "axios";
import config from "../Apikey";

export async function call(api,method,request,user){

    let headers = {"Content-Type": "application/json"};

    //사용자 토큰이 있다면 Authorization 헤더에 추가
    if(user.token && user.token !== null){
        headers["Authorization"] = `Bearer ${user.token}`;
    }
    
    try {
        // 동적으로 메서드를 호출
        const response = await axios({
            method: method,
            url: `https://${config.IP_ADD}${api}`,
            data: request,
            headers: headers
        });
        
        if (response) {
            console.log("API 성공 응답:", response.data);
            return response.data;
        }
        
    } catch (error) {
        console.error('API 호출 중 오류 발생', error.response || error.message);
        // window.location.href="/";
        throw error.response ? error.response.data : error.message;
    }
    

}//call