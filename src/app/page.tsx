'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { Button } from "../components/ui/button"
import { Textarea } from "../components/ui/textarea"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Upload, Send, Mail, User, CheckCircle, FileSpreadsheet, UserPlus, AlertCircle } from 'lucide-react'

interface Recipient {
  name: string
  email: string
  status: string
}

export default function EmailSender() {
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [fromEmail, setFromEmail] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [singleEmail, setSingleEmail] = useState('')
  const [singleName, setSingleName] = useState('')
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [fileUploaded, setFileUploaded] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('compose')

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Recipient[]
        
        // setRecipients(jsonData.map(recipient => ({ ...recipient, status: '' })))
        setRecipients(jsonData)
        setFileUploaded(true)
        
      }
      reader.readAsArrayBuffer(file)
    }
  }

  const validateForm = (isSingleEmail: boolean) => {
    if (!fromEmail) {
      setError('From Email is required')
      return false
    }
    if (!emailSubject) {
      setError('Email Subject is required')
      return false
    }
    if (!emailBody) {
      setError('Email Body is required')
      return false
    }
    if (!isSingleEmail && !fileUploaded && recipients.length === 0) {
      setError('Please upload a file with recipients')
      return false
    }
    setError('')
    return true
  }

  const sendEmails = async () => {
    if (!validateForm(false)) return

    setIsLoading(true)
    try {
      // Step 1: Fetch the list of subscribed emails
      const emailListResponse = await fetch('/api/subcribe-emails', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!emailListResponse.ok) {
        throw new Error('Failed to fetch the subscribed emails list')
      }

      const { emails: subscribedEmails }: { emails: string[] } = await emailListResponse.json()
      // console.log(subscribedEmails)
    for (const recipient of recipients) {
      
      if (recipient.status === undefined && !subscribedEmails.includes(recipient.email)) {
        try {
          await sendEmail(recipient.email, recipient.name)
          updateRecipientStatus(recipient.email, 'sent')
        } catch (error) {
          updateRecipientStatus(recipient.email, 'failed')
          console.error(`Failed to send email to ${recipient.email}:`, error)
        }
      }
    }
    setActiveTab('recipients')
    setStatus('All emails processed')
    }
    catch (error) {
      console.error('Error in sendEmails function:', error);
      setStatus('Error processing emails');
    } finally {
      setIsLoading(false);
    } 
  }

  const sendSingleEmail = async () => {
    if (!validateForm(true)) return

    if (!singleEmail || !singleName) {
      setError('Please enter both name and email for the single recipient')
      return
    }

    setIsLoading(true)
    try {
      await sendEmail(singleEmail, singleName)
      setStatus(`Email sent to ${singleEmail}`)
    } catch (error) {
      setStatus(`Failed to send email to ${singleEmail}`)
      console.error('Error sending single email:', error)
    }
    setSingleEmail('')
    setSingleName('')
    setIsLoading(false)
  }

  const sendEmail = async (email: string, name: string) => {

    const unsubscribeLink = process.env.UNSUBSCRIBE_URL+`=${email} `;
    const subscribeLink = process.env.SUBSCRIBE_URL +`=${email} `;
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: fromEmail,
        to: email,
        subject: emailSubject,
        body: `
        <p>Hello ${name},</p>
        <p>${emailBody}</p>
        <p>If you no longer wish to receive these emails, please click the unsubscribe link:
        <a href="${unsubscribeLink}" target="_blank">Unsubscribe</a></p>
      `,
      }),
    })
    if (!response.ok) {
      throw new Error('Failed to send email')
    }
    return response.json()
  }

  const updateRecipientStatus = (email: string, newStatus: string) => {
    setRecipients(prevRecipients =>
      prevRecipients.map(recipient =>
        recipient.email === email ? { ...recipient, status: newStatus } : recipient
      )
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-indigo-800">Email Sender</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="compose">Compose</TabsTrigger>
              <TabsTrigger value="recipients">Recipients</TabsTrigger>
            </TabsList>
            <TabsContent value="compose">
              <div className="space-y-6">
                <div className="relative group">
                  <Input
                    id="file-upload"
                    type="file"
                    onChange={handleFileUpload}
                    accept=".xlsx, .xls"
                    className="hidden"
                  />
                  <Label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-indigo-300 border-dashed rounded-xl appearance-none cursor-pointer hover:border-indigo-400 focus:outline-none group"
                  >
                    {/* <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FileSpreadsheet className="w-10 h-10 text-indigo-500 group-hover:text-indigo-600 mb-3" />
          
                      <p className="mb-2 text-sm text-indigo-500 group-hover:text-indigo-600 text-center">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-indigo-500 group-hover:text-indigo-600">
                        Excel file (XLSX, XLS)
                      </p>
                    </div> */}
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 cursor-pointer">
                  <FileSpreadsheet className={`w-10 h-10 mb-3 ${ fileUploaded ? 'text-green-500' : 'text-indigo-500 group-hover:text-indigo-600'}`}/>
                <p className={`mb-2 text-sm text-center ${
          fileUploaded ? 'text-green-500' : 'text-indigo-500 group-hover:text-indigo-600'}`}>
        {fileUploaded ? (
          <span className="font-semibold">File uploaded</span>) : (
          <>
            <span className="font-semibold">Click to upload</span> or drag and drop
          </>
        )}
      </p>
      <p className={`text-xs ${fileUploaded ? 'text-green-500' : 'text-indigo-500 group-hover:text-indigo-600'}`}>
          {fileUploaded ? 'Excel file uploaded' : 'Excel file (XLSX, XLS)'}
      </p>
      </div>
      </Label>
      </div>

                <div className="space-y-2">
                  <Label htmlFor="from-email" className="text-indigo-800">From Email</Label>
                  <Input
                    id="from-email"
                    type="email"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="Enter sender's email"
                    className="w-full p-2 border border-indigo-200 rounded-md focus:ring-2 focus:ring-indigo-400 transition duration-200 ease-in-out"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-subject" className="text-indigo-800">Email Subject</Label>
                  <Input
                    id="email-subject"
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Enter email subject"
                    className="w-full p-2 border border-indigo-200 rounded-md focus:ring-2 focus:ring-indigo-400 transition duration-200 ease-in-out"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-body" className="text-indigo-800">Email Body</Label>
                  <Textarea
                    id="email-body"
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    rows={5}
                    placeholder="Enter your email body here..."
                    className="w-full p-2 border border-indigo-200 rounded-md focus:ring-2 focus:ring-indigo-400 transition duration-200 ease-in-out resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="single-email" className="text-indigo-800">Send to Single Recipient</Label>
                  <div className="flex flex-col space-y-2">
                    <Input
                      id="single-name"
                      type="text"
                      value={singleName}
                      onChange={(e) => setSingleName(e.target.value)}
                      placeholder="Enter recipient's name"
                      className="w-full border border-indigo-200 rounded-md focus:ring-2 focus:ring-indigo-400 transition duration-200 ease-in-out"
                    />
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        id="single-email"
                        type="email"
                        value={singleEmail}
                        onChange={(e) => setSingleEmail(e.target.value)}
                        placeholder="Enter email address"
                        className="w-full sm:flex-grow border border-indigo-200 rounded-md focus:ring-2 focus:ring-indigo-400 transition duration-200 ease-in-out"
                      />
                      <Button onClick={sendSingleEmail} disabled={isLoading} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Mail className="w-4 h-4 mr-2" />
                        Send
                      </Button>
                    </div>
                  </div>
                </div>

                <Button onClick={sendEmails} disabled={isLoading} className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white transition duration-300 ease-in-out transform hover:scale-105">
                  <Send className="w-4 h-4 mr-2" />
                  Send Emails to All Recipients
                </Button>

                {error && (
                  <div className="mt-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md">
                    <p className="flex items-center">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      {error}
                    </p>
                  </div>
                )}

                {status && (
                  <div className="mt-4 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded-md">
                    <p className="flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      {status}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="recipients">
              <div className="bg-white rounded-lg p-4 sm:p-6 overflow-hidden">
                <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-indigo-800">Recipients</h2>
                {recipients.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-indigo-900">
                      <thead>
                        <tr className="bg-indigo-100">
                          <th className="p-2 text-left rounded-tl-md">Name</th>
                          <th className="p-2 text-left">Email</th>
                          <th className="p-2 text-left rounded-tr-md">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recipients.map((recipient, index) => (
                          <tr key={index} className="border-b border-indigo-100 hover:bg-indigo-50 transition duration-150 ease-in-out">
                            <td className="p-2">
                              <div className="flex items-center">
                                <User className="w-4 h-4 mr-2 text-indigo-500" />
                                {recipient.name}
                              </div>
                            </td>
                            <td className="p-2 break-all">{recipient.email}</td>
                            <td className="p-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                recipient.status === 'sent' ? 'bg-green-200 text-green-800' : 
                                recipient.status === 'failed' ? 'bg-red-200 text-red-800' : 
                                'bg-yellow-200 text-yellow-800'
                              }`}>
                                {recipient.status || 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <UserPlus className="w-16 h-16 text-indigo-300 mx-auto mb-4" />
                    <p className="text-indigo-600 italic">No recipients uploaded yet. Upload an Excel file to get started!</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}