export interface LineItem {
  rowNumber: number;
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  price: number;
  amount: number;
  expense: number;
}

export interface Invoice {
  docId: string;
  voucherNumber: string;
  date: string; 
  vendorId: string;
  vendorName: string;
  reference: string;
  reference2: string;
  buyer: string;
  shippingMethod: string;
  paymentTerm: string;
  taxGroup: string;
  currency: string;
  exchangeRate: number;
  dueDate: string; 
  vendorRef: string;
  note: string;
  lineItems: LineItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  tax: number;
  totalExpense: number;
  total: number;
  status: string;
}

export interface Vendor {
  id: string;
  code: string;
  name: string;
  address?: string;
  contactInfo?: string;
}

export interface Item {
  code: string;
  description: string;
  unit: string;
  defaultPrice: number;
}

export interface TaxGroup {
  code: string;
  name: string;
  rate: number;
}

export interface Currency {
  code: string;
  name: string;
  exchangeRate: number;
}