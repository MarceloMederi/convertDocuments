document.getElementById('mergeBtn').addEventListener('click', async function () {
    try {
        // Obtém o input de arquivo e os arquivos selecionados
        var fileInput = document.getElementById('fileInput');
        var files = Array.from(fileInput.files);

        // Verifica se há pelo menos 2 arquivos selecionados
        if (files.length < 2) {
            alert('Selecione pelo menos 2 arquivos para mesclar.');
            return;
        }

        // Cria um novo documento PDF
        var pdfDoc = await PDFLib.PDFDocument.create();

        // Configurações para a barra de progresso
        var progress = 0;
        var progressBar = document.getElementById('progressBar');
        var progressBarContainer = document.getElementById('progressBarContainer');

        // Constantes para as dimensões da página
        var PAGE_WIDTH = 1200;
        var PAGE_HEIGHT = 1200;

        // Loop através de todos os arquivos selecionados
        for (var i = 0; i < files.length; i++) {
            var file = files[i];

            // Leitura dos dados do arquivo como Data URL
            var reader = new FileReader();
            var dataUrl = await new Promise(function (resolve) {
                reader.onload = function (event) {
                    return resolve(event.target.result);
                };
                reader.readAsDataURL(file);
            });

            // Verifica o tipo do arquivo
            if (file.type === 'application/pdf') {
                // Carrega o PDF e adiciona suas páginas ao documento PDF mesclado
                var existingPdfBytes = await fetch(dataUrl).then(function (response) {
                    return response.arrayBuffer();
                });
                var existingPdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
                var pages = await pdfDoc.copyPages(existingPdfDoc, existingPdfDoc.getPageIndices());
                pages.forEach(function (page) {
                    pdfDoc.addPage(page);
                });
            } else if (file.type === 'image/jpeg' || file.type === 'image/png') {
                // Manipulação de imagens: redimensionamento e adição ao PDF
                var img = new Image();
                img.src = dataUrl;
                await new Promise(function (resolve, reject) {
                    img.onload = function () {
                        return resolve();
                    };
                    img.onerror = function (error) {
                        return reject(error);
                    };
                });

                var pageWidth = img.width > img.height ? PAGE_WIDTH : PAGE_HEIGHT * (img.width / img.height);
                var pageHeight = img.height > img.width ? PAGE_HEIGHT : PAGE_WIDTH * (img.height / img.width);

                var page = pdfDoc.addPage([pageWidth, pageHeight]);
                var canvas = document.createElement('canvas');
                var ctx = canvas.getContext('2d');

                canvas.width = pageWidth;
                canvas.height = pageHeight;

                ctx.drawImage(img, 0, 0, pageWidth, pageHeight);

                var resizedDataUrl = canvas.toDataURL('image/jpeg');

                var embedImage;
                if (file.type === 'image/jpeg') {
                    embedImage = await pdfDoc.embedJpg(resizedDataUrl);
                } else if (file.type === 'image/png') {
                    embedImage = await pdfDoc.embedPng(resizedDataUrl);
                }

                // Desenha a imagem no documento PDF
                page.drawImage(embedImage, {
                    x: 0,
                    y: 0,
                    width: pageWidth,
                    height: pageHeight,
                    preserveAspectRatio: true
                });
            } else {
                alert('Formato de arquivo não suportado: ' + file.type);
            }

            // Atualiza a barra de progresso
            progress = ((i + 1) / files.length) * 100;
            progressBar.style.width = progress + '%';
        }

        // Salva o documento PDF mesclado
        var mergedPdfBytes = await pdfDoc.save();
        var blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        var url = URL.createObjectURL(blob);

        // Cria um link para download do PDF mesclado
        var output = document.getElementById('output');
        output.innerHTML = ''; // Limpa qualquer conteúdo anterior
        var link = document.createElement('a');
        link.href = url;
        link.textContent = 'Download PDF Mesclado';
        link.setAttribute('download', 'merged.pdf');
        output.appendChild(link);

        // Remove o botão de download após o download
        link.addEventListener('click', function () {
            output.removeChild(link);
        });

        // Limpa a lista de seleção de arquivos de forma assíncrona
        setTimeout(function () {
            fileInput.value = null;
        }, 100);

        // Esconde a barra de progresso após o download
        progressBarContainer.style.display = 'none';
    } catch (error) {
        console.error('Erro ao mesclar arquivos:', error);
        alert('Ocorreu um erro ao mesclar os arquivos. Por favor, tente novamente.');
    }
});
