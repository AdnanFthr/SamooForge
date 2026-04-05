const PdfService = {
    baseUrl: '/services/request-service/pdf-service/public',
    
    async generatePdf(requestNo) {
        try {
            const response = await fetch(`${this.baseUrl}/generate.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ request_no: requestNo })
            });
            
            const result = await response.json();
            
            if (result.success) {
                return result.data;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('PDF Generation Error:', error);
            throw error;
        }
    },
    
    streamPdf(requestNo) {
        window.open(`${this.baseUrl}/stream.php?request_no=${encodeURIComponent(requestNo)}`, '_blank');
    },
    
    downloadPdf(filename) {
        window.location.href = `${this.baseUrl}/download.php?file=${encodeURIComponent(filename)}`;
    }
};