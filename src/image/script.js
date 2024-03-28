let unifiedImage = null; // Variável global para armazenar a imagem unificada

function processImages() {
    const files = document.getElementById('imageInput').files;
    if (files.length === 0) {
        alert('Por favor, selecione uma ou mais imagens.');
        return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const images = [];
    let maxWidth = 0;
    let totalHeight = 0;
    
    // Carregar as imagens
    Array.from(files).forEach((file, index) => {
        const img = new Image();
        img.onload = () => {
            images.push(img);
            if (img.width > maxWidth) {
                maxWidth = img.width;
            }
            totalHeight += img.height;
            if (images.length === files.length) {
                canvas.width = maxWidth;
                canvas.height = totalHeight;
                let offsetY = 0;
                images.forEach(image => {
                    ctx.drawImage(image, 0, offsetY);
                    offsetY += image.height;
                });
                unifiedImage = canvas.toDataURL(); // Armazenar a imagem unificada
                document.getElementById('downloadButton').style.display = 'inline'; // Mostrar botão de download
            }
        };
        img.src = URL.createObjectURL(file);
    });
}

function downloadImage() {
    if (unifiedImage) {
        const downloadLink = document.createElement('a');
        downloadLink.href = unifiedImage;
        downloadLink.download = 'imagem_unificada.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    } else {
        alert('A imagem unificada ainda não está disponível. Por favor, unifique as imagens primeiro.');
    }
}
