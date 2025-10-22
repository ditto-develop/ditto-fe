export const downloadImage = (capturedImage: string) => { //이미지 다운로드 함수
    if (!capturedImage) return;
  
    const link = document.createElement("a");
    link.href = capturedImage;
    link.download = "ditto_result.png";
    link.click();
};