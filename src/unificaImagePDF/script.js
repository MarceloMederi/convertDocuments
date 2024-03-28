document.getElementById('mergeBtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;
  
    if (files.length < 2) {
      alert('Selecione pelo menos 2 arquivos para mesclar.');
      return;
    }
  
    const pdfDoc = await PDFLib.PDFDocument.create();
    const imagePromises = [];
    const pdfPromises = [];
  
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
  
      if (file.type === 'application/pdf') {
        pdfPromises.push(
          new Promise((resolve, reject) => {
            reader.onload = async function(event) {
              try {
                const existingPdfBytes = event.target.result;
                const existingPdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
                const pages = await pdfDoc.copyPages(existingPdfDoc, existingPdfDoc.getPageIndices());
                pages.forEach((page) => {
                  pdfDoc.addPage(page);
                });
                resolve();
              } catch (error) {
                reject(error);
              }
            };
            reader.readAsArrayBuffer(file);
          })
        );
      } else if (file.type === 'image/jpeg' || file.type === 'image/png') {
        imagePromises.push(
          new Promise((resolve, reject) => {
            reader.onload = async function(event) {
              try {
                const img = new Image();
                img.onload = async function() {
                  const page = pdfDoc.addPage([img.width, img.height]);
                  let embedImage;
                  if (file.type === 'image/jpeg') {
                    embedImage = await pdfDoc.embedJpg(event.target.result);
                  } else if (file.type === 'image/png') {
                    embedImage = await pdfDoc.embedPng(event.target.result);
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
              } catch (error) {
                reject(error);
              }
            };
            reader.readAsDataURL(file);
          })
        );
      } else {
        alert('Formato de arquivo não suportado: ' + file.type);
        return;
      }
    }
  
    Promise.all([...imagePromises, ...pdfPromises]).then(async () => {
      const mergedPdfBytes = await pdfDoc.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const output = document.getElementById('output');
      const link = document.createElement('a');
      link.href = url;
      link.textContent = 'Download PDF Mesclado';
      link.setAttribute('download', 'merged.pdf');
      output.appendChild(link);
    }).catch(error => {
      console.error('Erro ao mesclar arquivos:', error);
      alert('Ocorreu um erro ao mesclar os arquivos. Por favor, tente novamente.');
    });
  });
  