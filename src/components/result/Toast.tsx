import { Toaster } from "react-hot-toast";
import styled from "styled-components";

export const CustomToast = styled.div` 
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* ✅ 왼쪽 정렬 */
  padding: 12px 16px;
  background-color: #00000066;
  color: white;
  font-size: 16px;
  width: 327px;
  border-radius: 8px;
  backdrop-filter: blur(4px);
  text-align: left;
`;

export default function Toast(){
    return(
        <Toaster 
                position="bottom-center"
                reverseOrder={false}
        />
    )
}