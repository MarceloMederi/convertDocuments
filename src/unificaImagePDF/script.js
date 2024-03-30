document.getElementById('mergeBtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('fileInput');
    const files = Array.from(fileInput.files); // Transforma FileList em um array

    if (files.length < 2) {
        alert('Selecione pelo menos 2 arquivos para mesclar.');
        return;
    }

    const pdfDoc = await PDFLib.PDFDocument.create();

    try {
        for (let i = 0; i < files.length; i++) { // Percorre os arquivos na ordem original
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

                const page = pdfDoc.addPage([img.width, img.height]);
                let embedImage;
                if (file.type === 'image/jpeg') {
                    embedImage = await pdfDoc.embedJpg(dataUrl);
                } else if (file.type === 'image/png') {
                    embedImage = await pdfDoc.embedPng(dataUrl);
                }
                page.drawImage(embedImage, {
                    x: 0,
                    y: 0,
                    width: img.width,
                    height: img.height,
                });
            } else {
                alert('Formato de arquivo não suportado: ' + file.type);
            }
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

        // Limpar a lista de seleção de arquivos
        fileInput.value = null;
    } catch (error) {
        console.error('Erro ao mesclar arquivos:', error);
        alert('Ocorreu um erro ao mesclar os arquivos. Por favor, tente novamente.');
    }
});
