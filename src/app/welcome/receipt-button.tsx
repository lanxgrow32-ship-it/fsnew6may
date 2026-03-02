
'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Define the type for the autotable method
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export function ReceiptButton({ profile }: { profile: any }) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const generateReceipt = () => {
        setIsLoading(true);
        try {
            const doc = new jsPDF() as jsPDFWithAutoTable;
            const invoiceDate = new Date().toLocaleDateString('en-IN');
            const purchaseDate = new Date(profile.created_at).toLocaleDateString('en-IN');

            // --- Header ---
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('FundedStock India', 14, 22);

            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text('INVOICE', 196, 22, { align: 'right' });

            doc.setLineWidth(0.5);
            doc.line(14, 28, 196, 28);

            // --- Billing Info ---
            doc.setFontSize(10);
            doc.text('Bill To:', 14, 38);
            doc.setFont('helvetica', 'bold');
            doc.text(profile.full_name, 14, 43);
            doc.setFont('helvetica', 'normal');
            doc.text(profile.email, 14, 48);

            doc.text(`Invoice Date: ${invoiceDate}`, 196, 38, { align: 'right' });
            doc.text(`User ID: ${profile.id.substring(0, 12)}...`, 196, 43, { align: 'right' });
            
            // --- Proof of Purchase Body ---
            doc.setFontSize(10);
            doc.text(`This document serves as a proof of purchase for the transaction detailed below.`, 14, 60);
            doc.text(`Payment for the ${profile.plan_purchased} was completed on ${purchaseDate}.`, 14, 65);

            // --- Table ---
            const tableColumn = ["S.No.", "Product", "Quantity", "Rate", "Amount"];
            const tableRows = [[
                "1",
                profile.plan_purchased,
                "1",
                `₹${profile.plan_price?.toFixed(2) ?? '0.00'}`,
                `₹${profile.plan_price?.toFixed(2) ?? '0.00'}`
            ]];

            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 75,
                theme: 'striped',
                headStyles: { fillColor: [34, 34, 34] }
            });

            const finalY = (doc as any).lastAutoTable.finalY;

            // --- Totals Section ---
            let yPos = finalY + 10;
            const totalX = 150;
            const valueX = 196;
            
            doc.setFontSize(10);
            doc.text('Total:', totalX, yPos, { align: 'right' });
            doc.text(`₹${profile.plan_price?.toFixed(2) ?? '0.00'}`, valueX, yPos, { align: 'right' });
            yPos += 7;

            if (profile.discount_amount > 0) {
                 doc.text('Discount:', totalX, yPos, { align: 'right' });
                 doc.text(`- ₹${profile.discount_amount?.toFixed(2) ?? '0.00'}`, valueX, yPos, { align: 'right' });
                 yPos += 7;
            }
            
            doc.setLineWidth(0.2);
            doc.line(150, yPos - 3, 196, yPos - 3);

            doc.setFont('helvetica', 'bold');
            doc.text('Grand Total:', totalX, yPos, { align: 'right' });
            doc.text(`₹${profile.final_amount_paid?.toFixed(2) ?? '0.00'}`, valueX, yPos, { align: 'right' });
            yPos += 10;
            
            doc.setFont('helvetica', 'normal');
            doc.setFillColor(240, 240, 240);
            doc.rect(14, yPos, 182, 10, 'F');
            doc.setTextColor(50, 50, 50);
            doc.text(`Paid on: ${purchaseDate} via UPI Transaction ID: ${profile.transaction_id}`, 20, yPos + 6.5);


            // --- Footer ---
            const pageCount = doc.internal.getNumberOfPages();
            for(let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text('Thank you for your business!', 14, 285);
                doc.text(`Page ${i} of ${pageCount}`, 196, 285, { align: 'right' });
            }


            doc.save(`invoice-${profile.full_name.replace(/\s/g, '_')}-${purchaseDate}.pdf`);
        } catch (error) {
            console.error("Failed to generate PDF:", error);
            toast({
                title: "Error Generating Receipt",
                description: "An unexpected error occurred. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!profile.is_approved) {
        return null;
    }

    return (
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); generateReceipt(); }} disabled={isLoading}>
            {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Download className="mr-2 h-4 w-4" />
            )}
            <span>Download Receipt</span>
        </DropdownMenuItem>
    );
}
