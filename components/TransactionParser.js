import GeminiTransactionParser from '../utils/GeminiTransactionParser';
import axios from 'axios';

class TransactionParser {
    async parseReceipt(base64Image) {
      try {
        const geminiParser = new GeminiTransactionParser();
        const ocrResponse = await this.performOCR(base64Image);
        const transactionDetails = await geminiParser.parseReceipt(ocrResponse);
        return transactionDetails;
      } catch (error) {
        console.error('OCR Error:', error);
        throw error;
      }
    }
  
    async performOCR(base64Image) {
      try {
        const apiKey = '';
        const formData = new FormData();
        formData.append('apikey', apiKey);
        formData.append('base64Image', `data:image/jpeg;base64,${base64Image}`);
        formData.append('language', 'eng');
        formData.append('detectOrientation', 'true');
        formData.append('scale', 'true');
        formData.append('OCREngine', '2');
  
        const response = await axios.post(
          'https://api.ocr.space/parse/image',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'apikey': apiKey
            }
          }
        );
  
        if (response.data.IsErroredOnProcessing) {
          throw new Error(response.data.ErrorMessage || "OCR processing failed");
        }
  
        if (!response.data.ParsedResults || response.data.ParsedResults.length === 0) {
          throw new Error("No text was extracted from the image");
        }
  
        return response.data.ParsedResults[0].ParsedText;
      } catch (error) {
        console.error('OCR Error:', error);
        throw error;
      }
    }
}

export default TransactionParser;