// Adiciona um evento de clique ao botão de mesclagem
document.getElementById('mergeBtn').addEventListener('click', async function () {
    try {
        // Obtém o elemento de entrada de arquivo e os arquivos selecionados
        var fileInput = document.getElementById('fileInput');
        var files = Array.from(fileInput.files);

        // Verifica se pelo menos 2 arquivos foram selecionados
        if (files.length < 2) {
            alert('Selecione pelo menos 2 arquivos para mesclar.');
            return;
        }

        // Cria um novo documento PDF
        var pdfDoc = await PDFLib.PDFDocument.create();

        // Define variáveis para controle do progresso da mesclagem
        var progress = 0;
        var progressBar = document.getElementById('progressBar');
        var progressBarContainer = document.getElementById('progressBarContainer');

        // Define as dimensões padrão de uma página PDF
        const PAGE_WIDTH = 1200;
        const PAGE_HEIGHT = 1200;

        // Itera sobre os arquivos selecionados
        for (var i = 0; i < files.length; i++) {
            var file = files[i];

            // Cria um objeto FileReader para ler o conteúdo do arquivo como URL de dados
            var reader = new FileReader();
            var dataUrl = await new Promise(function (resolve) {
                reader.onload = function (event) {
                    return resolve(event.target.result);
                };
                reader.readAsDataURL(file);
            });

            // Verifica o tipo de arquivo e realiza a ação apropriada
            if (file.type === 'application/pdf') {
                // Se o arquivo for um PDF, carrega o PDF existente e copia suas páginas para o novo documento
                var existingPdfBytes = await fetch(dataUrl).then(function (response) {
                    return response.arrayBuffer();
                });
                var existingPdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
                var pages = await pdfDoc.copyPages(existingPdfDoc, existingPdfDoc.getPageIndices());
                pages.forEach(function (page) {
                    pdfDoc.addPage(page);
                });
            } else if (file.type === 'image/jpeg' || file.type === 'image/png') {
                // Se o arquivo for uma imagem, carrega a imagem e a incorpora no novo documento PDF
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

                // Calcula as dimensões da página com base na largura e altura da imagem
                var pageWidth = img.width > img.height ? PAGE_WIDTH : PAGE_HEIGHT * (img.width / img.height);
                var pageHeight = img.height > img.width ? PAGE_HEIGHT : PAGE_WIDTH * (img.height / img.width);

                // Cria uma nova página no documento PDF e desenha a imagem nela
                var page = pdfDoc.addPage([pageWidth, pageHeight]);
                var canvas = document.createElement('canvas');
                var ctx = canvas.getContext('2d');

                canvas.width = pageWidth;
                canvas.height = pageHeight;

                ctx.drawImage(img, 0, 0, pageWidth, pageHeight);

                // Converte a imagem para um URL de dados redimensionado e o incorpora no documento PDF
                var resizedDataUrl;
                if (file.type === 'image/jpeg') {
                    resizedDataUrl = canvas.toDataURL('image/jpeg');
                } else if (file.type === 'image/png') {
                    resizedDataUrl = canvas.toDataURL('image/png');
                }

                var embedImage;
                if (file.type === 'image/jpeg') {
                    embedImage = await pdfDoc.embedJpg(resizedDataUrl);
                } else if (file.type === 'image/png') {
                    embedImage = await pdfDoc.embedPng(resizedDataUrl);
                }

                page.drawImage(embedImage, {
                    x: 0,
                    y: 0,
                    width: pageWidth,
                    height: pageHeight,
                    preserveAspectRatio: true
                });
            } else {
                // Se o tipo de arquivo não for suportado, exibe um alerta
                alert('Formato de arquivo não suportado: ' + file.type);
            }

            // Atualiza o progresso da mesclagem
            progress = ((i + 1) / files.length) * 100;
            progressBar.style.width = progress + '%';
        }

        // Salva o documento PDF mesclado e cria um link para download
        var mergedPdfBytes = await pdfDoc.save();
        var blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        var url = URL.createObjectURL(blob);

        var output = document.getElementById('output');
        output.innerHTML = '';
        var link = document.createElement('a');
        link.href = url;
        link.textContent = 'Download PDF Mesclado';
        link.setAttribute('download', 'merged.pdf');
        output.appendChild(link);

        // Remove o link de download ao clicar nele
        link.addEventListener('click', function () {
            output.removeChild(link);
        });

        // Limpa o valor do elemento de entrada de arquivo após um curto período de tempo
        setTimeout(function () {
            fileInput.value = null;
        }, 100);

        // Oculta a barra de progresso
        progressBarContainer.style.display = 'none';
    } catch (error) {
        // Captura e trata erros
        console.error('Erro ao mesclar arquivos:', error);
        alert('Ocorreu um erro ao mesclar os arquivos. Por favor, tente novamente.');
    }
});
