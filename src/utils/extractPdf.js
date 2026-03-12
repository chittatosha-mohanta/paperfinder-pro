import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`

export async function extractTextFromPDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let fullText = ''

    const pagesToRead = Math.min(3, pdf.numPages)
    for (let i = 1; i <= pagesToRead; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const pageText = content.items.map(item => item.str).join(' ')
      fullText += pageText + ' '
    }

    return fullText.trim().slice(0, 600)
  } catch (error) {
    throw new Error('Could not read this PDF. Please try a text-based PDF.')
  }
}