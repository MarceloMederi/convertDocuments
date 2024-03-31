document.getElementById('mergeBtn').addEventListener('click', async function () {
    try {
        var fileInput = document.getElementById('fileInput');
        var files = Array.from(fileInput.files);

        if (files.length < 2) {
            alert('Selecione pelo menos 2 arquivos para mesclar.');
            return;
        }

        var pdfDoc = await PDFLib.PDFDocument.create();

        var progress = 0;
        var progressBar = document.getElementById('progressBar');
        var progressBarContainer = document.getElementById('progressBarContainer');

        const PAGE_WIDTH = 1200;
        const PAGE_HEIGHT = 1200;

        for (var i = 0; i < files.length; i++) {
            var file = files[i];

            var reader = new FileReader();
            var dataUrl = await new Promise(function (resolve) {
                reader.onload = function (event) {
                    return resolve(event.target.result);
                };
                reader.readAsDataURL(file);
            });

            if (file.type === 'application/pdf') {
                var existingPdfBytes = await fetch(dataUrl).then(function (response) {
                    return response.arrayBuffer();
                });
                var existingPdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
                var pages = await pdfDoc.copyPages(existingPdfDoc, existingPdfDoc.getPageIndices());
                pages.forEach(function (page) {
                    pdfDoc.addPage(page);
                });
            } else if (file.type === 'image/jpeg' || file.type === 'image/png') {
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
                alert('Formato de arquivo não suportado: ' + file.type);
            }

            progress = ((i + 1) / files.length) * 100;
            progressBar.style.width = progress + '%';
        }

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

        link.addEventListener('click', function () {
            output.removeChild(link);
        });

        setTimeout(function () {
            fileInput.value = null;
        }, 100);

        progressBarContainer.style.display = 'none';
    } catch (error) {
        console.error('Erro ao mesclar arquivos:', error);
        alert('Ocorreu um erro ao mesclar os arquivos. Por favor, tente novamente.');
    }
});
