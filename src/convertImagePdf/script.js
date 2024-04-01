document.getElementById('mergeBtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;

    if (files.length < 2) {
      alert('Selecione pelo menos 2 imagens para mesclar em PDF.');
      return;
    }

    const pdfDoc = await PDFLib.PDFDocument.create();
    const imagePromises = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();

      imagePromises.push(
        new Promise((resolve, reject) => {
          reader.onload = async function(event) {
            const img = new Image();
            img.onload = async function() {
              const page = pdfDoc.addPage([img.width, img.height]);
              let embedImage;
              if (file.type === 'image/jpeg') {
                embedImage = await pdfDoc.embedJpg(event.target.result);
              } else if (file.type === 'image/png') {
                embedImage = await pdfDoc.embedPng(event.target.result);
              } else {
                reject(new Error('Formato de imagem não suportado: ' + file.type));
                return;
              }
              page.drawImage(embedImage, {
                x: 0,
                y: 0,
                width: img.width,
                height: img.height,
              });
              resolve();
            };
            img.src = event.target.result;
          };
          reader.readAsDataURL(file);
        })
      );
    }

    Promise.all(imagePromises).then(async () => {
      const mergedPdfBytes = await pdfDoc.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const output = document.getElementById('output');
      const link = document.createElement('a');
      link.href = url;
      link.textContent = 'Download PDF Mesclado';
      link.setAttribute('download', 'merged.pdf');
      output.appendChild(link);
    });
  });