document.getElementById('mergeBtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;

    if (files.length < 2) {
      alert('Selecione pelo menos 2 arquivos PDF para mesclar.');
      return;
    }

    const pdfDoc = await PDFLib.PDFDocument.create();
    const promises = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      promises.push(
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async function(event) {
            const existingPdfBytes = new Uint8Array(event.target.result);
            const existingPdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
            const copiedPages = await pdfDoc.copyPages(existingPdfDoc, existingPdfDoc.getPageIndices());
            copiedPages.forEach((page) => pdfDoc.addPage(page));
            resolve();
          };
          reader.readAsArrayBuffer(file);
        })
      );
    }

    Promise.all(promises).then(async () => {
      const mergedPdfBytes = await pdfDoc.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const output = document.getElementById('output');
      const link = document.createElement('a');
      link.href = url;
      link.textContent = 'Download PDF Mesclado';
      link.setAttribute('download', 'merged.pdf');
      link.addEventListener('click', () => {
        // Limpar a seleção de arquivos
        fileInput.value = '';
      });
      output.appendChild(link);
    });
  });