import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export const generateSlipGajiPDF = (slipData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // -- CONFIDENTIAL MARK --
    doc.setTextColor(200);
    doc.setFontSize(40);
    doc.text('CONFIDENTIAL', pageWidth / 2, doc.internal.pageSize.height / 2, {
        align: 'center',
        angle: 45
    });

    // -- HEADER --
    doc.setTextColor(0);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('SLIP GAJI KARYAWAN', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('PT. EMPLOYEE SYSTEM INDONESIA', pageWidth / 2, 27, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Jl. Jendral Sudirman No. 1, Jakarta Pusat', pageWidth / 2, 32, { align: 'center' });

    doc.setLineWidth(0.5);
    doc.line(15, 36, pageWidth - 15, 36);

    // -- EMPLOYEE INFO --
    const startY = 45;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DATA KARYAWAN', 15, startY);

    doc.setFont('helvetica', 'normal');
    const col1 = 15;
    const col2 = 60;
    const col3 = 100;
    const col4 = 140;

    doc.text('Nama Karyawan', col1, startY + 8);
    doc.text(`: ${slipData.user.nama_lengkap}`, col1 + 30, startY + 8);

    doc.text('NIK', col1, startY + 14);
    doc.text(`: ${slipData.user.nik}`, col1 + 30, startY + 14);

    doc.text('Jabatan', col3, startY + 8);
    doc.text(`: ${slipData.user.role}`, col4, startY + 8); // Should use jabatan field if available

    doc.text('Departemen', col3, startY + 14);
    doc.text(`: ${slipData.user.departemen?.nama_departemen || '-'}`, col4, startY + 14);

    doc.text('Periode Gaji', col3, startY + 20);
    doc.text(`: ${format(new Date(slipData.periode_mulai), 'dd MMM')} - ${format(new Date(slipData.periode_selesai), 'dd MMM yyyy')}`, col4, startY + 20);

    // -- EARNINGS TABLE --
    const formatCurrency = (val) => `Rp ${parseInt(val).toLocaleString('id-ID')}`;

    const earnings = [
        ['Gaji Pokok', formatCurrency(slipData.gaji_pokok)],
        ['Tunjangan Jabatan', formatCurrency(slipData.tunjangan_jabatan || 0)],
        ['Tunjangan Makan', formatCurrency(slipData.tunjangan_makan || 0)],
        ['Tunjangan Transport', formatCurrency(slipData.tunjangan_transport || 0)],
        ['Lembur', formatCurrency(slipData.uang_lembur || 0)],
        ['Bonus / THR', formatCurrency(slipData.bonus || 0)],
    ];

    autoTable(doc, {
        startY: startY + 30,
        head: [['PENERIMAAN', 'JUMLAH']],
        body: earnings,
        theme: 'grid',
        headStyles: { fillColor: [22, 163, 74], halign: 'center' }, // Green header
        columnStyles: {
            0: { cellWidth: 110 },
            1: { cellWidth: 70, halign: 'right' }
        },
        margin: { left: 15 }
    });

    const earningsFinalY = doc.lastAutoTable?.finalY || (startY + 100);

    // -- DEDUCTIONS TABLE --
    const deductions = [
        ['Potongan BPJS', formatCurrency(slipData.potongan_bpjs || 0)],
        ['Potongan PPh 21', formatCurrency(slipData.potongan_pph21 || 0)],
        ['Potongan Kehadiran', formatCurrency(slipData.potongan_kehadiran || 0)],
        ['Potongan Lain-lain', formatCurrency(slipData.potongan_lain || 0)],
    ];

    autoTable(doc, {
        startY: earningsFinalY + 10,
        head: [['POTONGAN', 'JUMLAH']],
        body: deductions,
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38], halign: 'center' }, // Red header
        columnStyles: {
            0: { cellWidth: 110 },
            1: { cellWidth: 70, halign: 'right' }
        },
        margin: { left: 15 }
    });

    // -- SUMMARY --
    const finalY = (doc.lastAutoTable?.finalY || earningsFinalY + 50) + 15;

    doc.setFillColor(240, 248, 255);
    doc.rect(15, finalY - 5, pageWidth - 30, 20, 'F');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL GAJI BERSIH (TAKE HOME PAY)', 20, finalY + 8);

    doc.setFontSize(14);
    doc.setTextColor(22, 163, 74); // Green text
    doc.text(formatCurrency(slipData.total_gaji_bersih), pageWidth - 20, finalY + 8, { align: 'right' });

    // -- FOOTER / SIGNATURE --
    const sigY = finalY + 40;
    const dateStr = format(new Date(), 'dd MMMM yyyy', { locale: id });

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');

    // Left: Receiver
    doc.text(`Jakarta, ${dateStr}`, 15, sigY);
    doc.text('Penerima,', 15, sigY + 6);
    doc.line(15, sigY + 30, 60, sigY + 30);
    doc.text(`( ${slipData.user.nama_lengkap} )`, 15, sigY + 35);

    // Right: Company
    doc.text('HR Manager,', pageWidth - 60, sigY + 6);
    doc.line(pageWidth - 60, sigY + 30, pageWidth - 15, sigY + 30);
    doc.text('( ________________ )', pageWidth - 60, sigY + 35);

    // Save/Download
    const year = slipData.periode_tahun || new Date().getFullYear();
    const month = String(slipData.periode_bulan || (new Date().getMonth() + 1)).padStart(2, '0');
    const filename = `SlipGaji_${slipData.user.nik}_${year}${month}.pdf`;
    doc.save(filename);
};
