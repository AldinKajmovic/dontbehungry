import api from '../api'

export type ReportType =
  | 'orders'
  | 'restaurants'
  | 'users'
  | 'reviews'
  | 'categories'
  | 'menuItems'
  | 'places'

export interface EmailReportRequest {
  reportType: ReportType | 'combined'
  email: string
  subject?: string
  message?: string
  filters?: Record<string, string | undefined>
  sections?: ReportType[]
}

export interface EmailReportResponse {
  success: boolean
  message: string
}

class ReportsService {
  private baseUrl = '/api/admin/reports'


  private getUrlPath(reportType: ReportType | 'combined'): string {
    return reportType
  }

  async downloadReport(
    reportType: ReportType,
    filters?: Record<string, string | undefined>
  ): Promise<void> {

    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value)
        }
      })
    }

    const queryString = params.toString()
    const urlPath = this.getUrlPath(reportType)
    const url = `${this.baseUrl}/${urlPath}${queryString ? `?${queryString}` : ''}`

    const response = await api.get(url, {
      responseType: 'blob',
    })

    const blob = new Blob([response.data], { type: 'application/pdf' })
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')

    // Extract filename from Content-Disposition header if available
    const contentDisposition = response.headers['content-disposition']
    let filename = `${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="(.+)"/)
      if (match) {
        filename = match[1]
      }
    }

    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  }

  async downloadCombinedReport(sections: ReportType[]): Promise<void> {
    const response = await api.post(
      `${this.baseUrl}/combined`,
      { sections },
      { responseType: 'blob' }
    )

    const blob = new Blob([response.data], { type: 'application/pdf' })
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    const filename = `combined-report-${new Date().toISOString().split('T')[0]}.pdf`

    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  }

  async emailReport(request: EmailReportRequest): Promise<EmailReportResponse> {
    const response = await api.post<EmailReportResponse>(
      `${this.baseUrl}/email`,
      request
    )
    return response.data
  }
}

export const reportsService = new ReportsService()
