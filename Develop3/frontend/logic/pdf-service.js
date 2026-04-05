/**
 * PDF Service Client
 * Handle PDF generation dan preview untuk Request MR/FR
 */

const PDF_SERVICE_URL = 'http://localhost/sas-orderapps/Develop3/services/request-service/pdf-service/public';

const PdfService = {
    /**
     * Generate PDF dan simpan ke server
     */
    async generate(requestNo) {
        try {
            const response = await fetch(`${PDF_SERVICE_URL}/generate.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ request_no: requestNo })
            });

            const text = await response.text();
            
            // Cek apakah response adalah JSON
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                // Bukan JSON, kemungkinan error PHP
                console.error('Server returned non-JSON:', text.substring(0, 500));
                throw new Error('Server error. Check console for details.');
            }
            
            if (result.success) {
                return result.data;
            } else {
                throw new Error(result.error || 'Gagal generate PDF');
            }
        } catch (error) {
            console.error('PDF Generation Error:', error);
            throw error;
        }
    },

    /**
     * Stream PDF langsung ke browser (preview)
     */
    stream(requestNo) {
        window.open(`${PDF_SERVICE_URL}/stream.php?request_no=${encodeURIComponent(requestNo)}`, '_blank');
    },

    /**
     * Download PDF file
     */
    download(filename) {
        window.location.href = `${PDF_SERVICE_URL}/download.php?file=${encodeURIComponent(filename)}`;
    },

    /**
     * Generate dan auto-download
     */
    async generateAndDownload(requestNo) {
        const data = await this.generate(requestNo);
        this.download(data.filename);
        return data;
    }
};