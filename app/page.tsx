"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { DollarSign, TrendingDown, TrendingUp, Users, Plus, Search, Download, Eye } from "lucide-react"
import { format } from "date-fns"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// Types
interface Customer {
  id: number
  name: string
  mobile: string
  totalCredit: number
  totalDebit: number
  balance: number
}

interface Transaction {
  id: number
  customerId: number
  customerName: string
  customerMobile: string
  type: "CREDIT" | "DEBIT"
  amount: number
  description: string
  transactionDate: string
  createdAt: string
}

// API Base URL
const API_BASE_URL = "http://localhost:8080/api"

export default function StoreManagement() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false)
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [isCustomerDetailsOpen, setIsCustomerDetailsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"ALL" | "CREDIT" | "DEBIT">("ALL")
  const [loading, setLoading] = useState(true)

  // Fetch customers from backend
  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers`)
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      } else {
        console.error('Failed to fetch customers:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  // Fetch transactions from backend
  const fetchTransactions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions`)
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      } else {
        console.error('Failed to fetch transactions:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchCustomers(), fetchTransactions()])
      setLoading(false)
    }
    loadData()
  }, [])

  // Calculate totals
  const totalCredit = customers.reduce((sum, customer) => sum + customer.totalCredit, 0)
  const totalDebit = customers.reduce((sum, customer) => sum + customer.totalDebit, 0)
  const netBalance = totalCredit - totalDebit
  const customersWithBalance = customers.filter((c) => c.balance > 0).length
  const customersInDebt = customers.filter((c) => c.balance < 0).length

  // Filter functions
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || customer.mobile.includes(searchTerm),
  )

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.customerMobile.includes(searchTerm)
    const matchesFilter = filterType === "ALL" || transaction.type === filterType
    return matchesSearch && matchesFilter
  })

  // Get customer-specific transactions
  const getCustomerTransactions = (customerId: number) => {
    return transactions
      .filter(t => t.customerId === customerId)
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
  }

  // Generate PDF for customer
  const generateCustomerPDF = async (customer: Customer) => {
    const customerTransactions = getCustomerTransactions(customer.id)
    
    // Create a temporary div for PDF generation
    const pdfDiv = document.createElement('div')
    pdfDiv.style.position = 'absolute'
    pdfDiv.style.left = '-9999px'
    pdfDiv.style.width = '800px'
    pdfDiv.style.padding = '20px'
    pdfDiv.style.fontFamily = 'Arial, sans-serif'
    pdfDiv.style.backgroundColor = 'white'
    pdfDiv.style.color = 'black'
    
    pdfDiv.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
        <h1 style="margin: 0; color: #333; font-size: 24px;">Customer Transaction Report</h1>
        <h2 style="margin: 10px 0 0 0; color: #666; font-size: 20px;">${customer.name}</h2>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Customer Information</h3>
        <p style="margin: 5px 0;"><strong>Customer ID:</strong> ${customer.id}</p>
        <p style="margin: 5px 0;"><strong>Mobile:</strong> ${customer.mobile}</p>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Account Summary</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 15px;">
          <div style="text-align: center; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #666;">Total Credit</p>
            <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #28a745;">₹{customer.totalCredit.toLocaleString()}</p>
          </div>
          <div style="text-align: center; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #666;">Total Debit</p>
            <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #007bff;">₹{customer.totalDebit.toLocaleString()}</p>
          </div>
          <div style="text-align: center; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #666;">Current Balance</p>
            <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: ${customer.balance >= 0 ? '#28a745' : '#dc3545'};">₹{Math.abs(customer.balance).toLocaleString()}</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">${customer.balance >= 0 ? 'Owes You' : 'You Owe'}</p>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Transaction History</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Date</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Type</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Amount</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Description</th>
            </tr>
          </thead>
          <tbody>
            ${customerTransactions.map(t => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 12px;">${format(new Date(t.transactionDate), 'MMM dd, yyyy')}</td>
                <td style="border: 1px solid #ddd; padding: 12px; color: ${t.type === 'CREDIT' ? '#28a745' : '#007bff'}; font-weight: bold;">${t.type}</td>
                <td style="border: 1px solid #ddd; padding: 12px; color: ${t.type === 'CREDIT' ? '#28a745' : '#007bff'}; font-weight: bold;">₹{t.amount.toLocaleString()}</td>
                <td style="border: 1px solid #ddd; padding: 12px;">${t.description || 'No description'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        ${customerTransactions.length === 0 ? `
          <div style="text-align: center; padding: 40px; color: #666; font-style: italic;">
            No transactions found for this customer.
          </div>
        ` : ''}
      </div>
      
      <div style="margin-top: 30px; text-align: center; color: #666; border-top: 1px solid #ddd; padding-top: 20px;">
        <p style="margin: 0; font-size: 12px;">Generated on ${format(new Date(), 'MMM dd, yyyy HH:mm')}</p>
      </div>
    `
    
    document.body.appendChild(pdfDiv)
    
    try {
      const canvas = await html2canvas(pdfDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      
      let position = 0
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      
      pdf.save(`${customer.name.replace(/\s+/g, '_')}_transactions_${format(new Date(), 'yyyy-MM-dd')}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF. Please try again.')
    } finally {
      document.body.removeChild(pdfDiv)
    }
  }

  // Add customer form
  const [newCustomer, setNewCustomer] = useState({ name: "", mobile: "" })

  const handleAddCustomer = async () => {
    if (newCustomer.name && newCustomer.mobile) {
      try {
        const response = await fetch(`${API_BASE_URL}/customers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newCustomer.name,
            mobile: newCustomer.mobile,
            totalCredit: 0,
            totalDebit: 0,
            balance: 0,
          }),
        })

        if (response.ok) {
          const createdCustomer = await response.json()
          setCustomers([...customers, createdCustomer])
          setNewCustomer({ name: "", mobile: "" })
          setIsAddCustomerOpen(false)
        } else {
          console.error('Failed to create customer:', response.statusText)
        }
      } catch (error) {
        console.error('Error creating customer:', error)
      }
    }
  }

  // Add transaction form
  const [newTransaction, setNewTransaction] = useState({
    customerId: "",
    type: "CREDIT" as "CREDIT" | "DEBIT",
    amount: "",
    description: "",
  })

  const handleAddTransaction = async () => {
    if (newTransaction.customerId && newTransaction.amount) {
      try {
        const response = await fetch(`${API_BASE_URL}/transactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerId: parseInt(newTransaction.customerId),
            type: newTransaction.type,
            amount: parseFloat(newTransaction.amount),
            description: newTransaction.description,
            transactionDate: new Date().toISOString().split('T')[0],
          }),
        })

        if (response.ok) {
          const createdTransaction = await response.json()
          setTransactions([...transactions, createdTransaction])
          
          // Refresh customers to get updated balances
          await fetchCustomers()
          
          setNewTransaction({ customerId: "", type: "CREDIT", amount: "", description: "" })
          setIsAddTransactionOpen(false)
        } else {
          console.error('Failed to create transaction:', response.statusText)
        }
      } catch (error) {
        console.error('Error creating transaction:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Store Management</h1>
            <p className="text-gray-600">Track your store credits, debits, and customer balances</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Customer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Customer</DialogTitle>
                  <DialogDescription>Add a new customer to your store management system.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Customer Name</Label>
                    <Input
                      id="name"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="mobile">Mobile Number</Label>
                    <Input
                      id="mobile"
                      value={newCustomer.mobile}
                      onChange={(e) => setNewCustomer({ ...newCustomer, mobile: e.target.value })}
                      placeholder="Enter mobile number"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddCustomer}>Add Customer</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Transaction</DialogTitle>
                  <DialogDescription>Record a new credit or debit transaction.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="customer">Customer</Label>
                    <Select
                      value={newTransaction.customerId}
                      onValueChange={(value) => setNewTransaction({ ...newTransaction, customerId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name} - {customer.mobile}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="type">Transaction Type</Label>
                    <Select
                      value={newTransaction.type}
                      onValueChange={(value: "CREDIT" | "DEBIT") =>
                        setNewTransaction({ ...newTransaction, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CREDIT">Credit (Money Owed to You)</SelectItem>
                        <SelectItem value="DEBIT">Debit (Payment Received)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                      placeholder="Enter amount"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                      placeholder="Enter transaction description (optional)"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddTransaction}>Add Transaction</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Credit</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{totalCredit.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Money owed to you</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Debit</CardTitle>
              <TrendingDown className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">₹{totalDebit.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Payments received</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                ₹{Math.abs(netBalance).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {netBalance >= 0 ? "Outstanding amount" : "Excess payments"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{customers.length}</div>
              <p className="text-xs text-muted-foreground">
                {customersWithBalance} with balance, {customersInDebt} in debt
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="customers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="outstanding">Outstanding</TabsTrigger>
          </TabsList>

          <TabsContent value="customers" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Customer Management</CardTitle>
                    <CardDescription>Manage your customers and their balances</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search customers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-64"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Total Credit</TableHead>
                      <TableHead>Total Debit</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.mobile}</TableCell>
                        <TableCell className="text-green-600">₹{customer.totalCredit.toLocaleString()}</TableCell>
                        <TableCell className="text-blue-600">₹{customer.totalDebit.toLocaleString()}</TableCell>
                        <TableCell className={customer.balance >= 0 ? "text-green-600" : "text-red-600"}>
                          ₹{Math.abs(customer.balance).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Badge
                              variant={
                                customer.balance > 0 ? "default" : customer.balance < 0 ? "destructive" : "secondary"
                              }
                            >
                              {customer.balance > 0 ? "Owes Money" : customer.balance < 0 ? "In Credit" : "Settled"}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedCustomer(customer)
                                setIsCustomerDetailsOpen(true)
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>View all credit and debit transactions</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={filterType}
                      onValueChange={(value: "ALL" | "CREDIT" | "DEBIT") => setFilterType(value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Types</SelectItem>
                        <SelectItem value="CREDIT">Credit Only</SelectItem>
                        <SelectItem value="DEBIT">Debit Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-64"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{format(new Date(transaction.transactionDate), "MMM dd, yyyy")}</TableCell>
                        <TableCell className="font-medium">{transaction.customerName}</TableCell>
                        <TableCell>{transaction.customerMobile}</TableCell>
                        <TableCell>
                          <Badge variant={transaction.type === "CREDIT" ? "default" : "secondary"}>
                            {transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell className={transaction.type === "CREDIT" ? "text-green-600" : "text-blue-600"}>
                          ₹{transaction.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="outstanding" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Outstanding Balances</CardTitle>
                <CardDescription>Customers who owe money or have credit balances</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Outstanding Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Transaction</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers
                      .filter((customer) => customer.balance !== 0)
                      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
                      .map((customer) => {
                        const lastTransaction = transactions
                          .filter((t) => t.customerId === customer.id)
                          .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())[0]

                        return (
                          <TableRow key={customer.id}>
                            <TableCell className="font-medium">{customer.name}</TableCell>
                            <TableCell>{customer.mobile}</TableCell>
                            <TableCell className={customer.balance >= 0 ? "text-green-600" : "text-red-600"}>
                              ₹{Math.abs(customer.balance).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant={customer.balance > 0 ? "default" : "destructive"}>
                                {customer.balance > 0 ? "Owes You" : "You Owe"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {lastTransaction
                                ? format(new Date(lastTransaction.transactionDate), "MMM dd, yyyy")
                                : "No transactions"}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Customer Details Dialog */}
        <Dialog open={isCustomerDetailsOpen} onOpenChange={setIsCustomerDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Customer Details - {selectedCustomer?.name}</DialogTitle>
              <DialogDescription>
                View detailed transaction history and account summary for {selectedCustomer?.name}
              </DialogDescription>
            </DialogHeader>
            
            {selectedCustomer && (
              <div className="space-y-6">
                {/* Customer Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Account Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Total Credit</p>
                        <p className="text-2xl font-bold text-green-600">₹{selectedCustomer.totalCredit.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Total Debit</p>
                        <p className="text-2xl font-bold text-blue-600">₹{selectedCustomer.totalDebit.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Current Balance</p>
                        <p className={`text-2xl font-bold ${selectedCustomer.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{Math.abs(selectedCustomer.balance).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          {selectedCustomer.balance >= 0 ? 'Owes You' : 'You Owe'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Customer ID</p>
                        <p className="font-medium">{selectedCustomer.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Mobile</p>
                        <p className="font-medium">{selectedCustomer.mobile}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Transaction History */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Transaction History</CardTitle>
                      <Button
                        onClick={() => generateCustomerPDF(selectedCustomer)}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Report
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getCustomerTransactions(selectedCustomer.id).map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{format(new Date(transaction.transactionDate), "MMM dd, yyyy")}</TableCell>
                            <TableCell>
                              <Badge variant={transaction.type === "CREDIT" ? "default" : "secondary"}>
                                {transaction.type}
                              </Badge>
                            </TableCell>
                            <TableCell className={transaction.type === "CREDIT" ? "text-green-600" : "text-blue-600"}>
                              ₹{transaction.amount.toLocaleString()}
                            </TableCell>
                            <TableCell>{transaction.description || "No description"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {getCustomerTransactions(selectedCustomer.id).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No transactions found for this customer.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
