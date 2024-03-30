document.getElementById('mergeBtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('fileInput');
    const files = Array.from(fileInput.files); // Transforma FileList em um array

    if (files.length < 2) {
        alert('Selecione pelo menos 2 arquivos para mesclar.');
        return;
    }

    const pdfDoc = await PDFLib.PDFDocument.create();

    try {
        let progress = 0;
        const progressBar = document.getElementById('progressBar');
        const progressBarContainer = document.getElementById('progressBarContainer');
        const PAGE_WIDTH = 1200; // Largura fixa da página
        const PAGE_HEIGHT = 1200; // Altura fixa da página
        const IMAGE_HEIGHT = 800; // Altura desejada para as imagens

        for (let i = 0; i < files.length; i++) { // Percorre os arquivos na ordem original de seleção
            const file = files[i];
            const reader = new FileReader();
            const dataUrl = await new Promise((resolve) => {
                reader.onload = (event) => resolve(event.target.result);
                reader.readAsDataURL(file);
            });

            if (file.type === 'application/pdf') {
                const existingPdfBytes = await fetch(dataUrl).then(response => response.arrayBuffer());
                const existingPdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
                const pages = await pdfDoc.copyPages(existingPdfDoc, existingPdfDoc.getPageIndices());
                pages.forEach((page) => {
                    pdfDoc.addPage(page);
                });
            } else if (file.type === 'image/jpeg' || file.type === 'image/png') {
                const img = new Image();
                img.src = dataUrl;
                await new Promise((resolve, reject) => {
                    img.onload = () => resolve();
                    img.onerror = (error) => reject(error);
                });

                const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]); // Cria uma página com dimensões fixas
                let embedImage;
                if (file.type === 'image/jpeg') {
                    embedImage = await pdfDoc.embedJpg(dataUrl);
                } else if (file.type === 'image/png') {
                    embedImage = await pdfDoc.embedPng(dataUrl);
                }

                const scaleFactor = Math.min(PAGE_WIDTH / img.width, PAGE_HEIGHT / img.height); // Calcula a escala para caber na página
                const scaledWidth = img.width * scaleFactor;
                const scaledHeight = img.height * scaleFactor;

                page.drawImage(embedImage, {
                    x: (PAGE_WIDTH - scaledWidth) / 2, // Centraliza a imagem na página
                    y: (PAGE_HEIGHT - scaledHeight) / 2,
                    width: scaledWidth,
                    height: scaledHeight,
                    preserveAspectRatio: true // Mantém a proporção da imagem
                });
            } else {
                alert('Formato de arquivo não suportado: ' + file.type);
            }

            // Atualiza a barra de progresso
            progress = ((i + 1) / files.length) * 100;
            progressBar.style.width = `${progress}%`;
        }

        const mergedPdfBytes = await pdfDoc.save();
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const output = document.getElementById('output');
        output.innerHTML = ''; // Limpar qualquer conteúdo anterior
        const link = document.createElement('a');
        link.href = url;
        link.textContent = 'Download PDF Mesclado';
        link.setAttribute('download', 'merged.pdf');
        output.appendChild(link);

        // Remover o botão de download após o download
        link.addEventListener('click', () => {
            output.removeChild(link);
        });

        // Limpar a lista de seleção de arquivos de forma assíncrona
        setTimeout(() => {
            fileInput.value = null;
        }, 100);
        
        // Esconde a barra de progresso após o download
        progressBarContainer.style.display = 'none';
    } catch (error) {
        console.error('Erro ao mesclar arquivos:', error);
        alert('Ocorreu um erro ao mesclar os arquivos. Por favor, tente novamente.');
    }
});
