// src/utils/generate-simple-report.ts
//
// Generador de PDF reutilizable con la misma identidad visual del "Listado de Caja"
// (generate-box-list.ts) — franja de encabezado, título grande, fila de metadatos, tabla con
// separadores finos, y tarjetas de totales al pie — pero genérico: cualquier pantalla que
// necesite exportar una tabla simple (clientes, cocheras, recibos, etc.) define sus columnas y
// filas y obtiene el mismo look, en vez de reimplementar el dibujo de cero.
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { toast } from 'sonner';

export type ReportColumn = {
  header: string;
  width: number;
  align?: 'left' | 'right';
};

export type ReportTotal = { label: string; value: string };

export type SimpleReportOptions = {
  /** Texto chico en mayúscula arriba de todo, ej. "LISTADO DE CLIENTES". */
  kicker: string;
  /** Título grande, ej. "Listado de clientes". */
  title: string;
  userName: string;
  /** Línea de metadatos libre, ej. "Septiembre 2026 · Filtro: Pagaron". */
  metaLine?: string;
  columns: ReportColumn[];
  rows: string[][];
  totals?: ReportTotal[];
  emptyMessage?: string;
  filename: string;
  /** Texto del toast de éxito — por default menciona el título. */
  successMessage?: string;
};

export default async function generateSimpleReport({
  kicker,
  title,
  userName,
  metaLine,
  columns,
  rows,
  totals,
  emptyMessage = 'No hay datos para exportar.',
  filename,
  successMessage,
}: SimpleReportOptions): Promise<Uint8Array> {
  try {
    const PAGE_WIDTH = 595.28;
    const PAGE_HEIGHT = 841.89;

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // Misma paleta que "Listado de Caja".
    const inkColor = rgb(0.129, 0.110, 0.078);
    const brownColor = rgb(0.353, 0.263, 0.149);
    const mutedColor = rgb(0.541, 0.478, 0.373);
    const mutedText2 = rgb(0.361, 0.322, 0.255);
    const borderLight = rgb(0.847, 0.816, 0.753);
    const borderLighter = rgb(0.937, 0.914, 0.875);
    const dashColor = rgb(0.659, 0.604, 0.502);
    const badgeBg = rgb(0.941, 0.933, 0.918);
    const totalsCardBg = rgb(0.957, 0.941, 0.902);

    const marginLeft = 50;
    const marginRight = 545;
    // Espacio reservado entre columnas — sin esto, una columna alineada a la derecha termina
    // justo en el límite de la siguiente, que arranca en ese mismo punto: el texto de ambas
    // queda pegado sin ningún espacio en el medio.
    const CELL_PADDING = 10;

    // Posición x de cada columna, acumulando anchos de izquierda a derecha.
    const colX: number[] = [];
    let cursor = marginLeft;
    for (const col of columns) {
      colX.push(cursor);
      cursor += col.width;
    }

    let yPosition = PAGE_HEIGHT - 50;

    const formatDateA = (d: string | Date) => {
      const date = typeof d === 'string' ? new Date(d) : d;
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const drawRightText = (
      text: string,
      rightX: number,
      y: number,
      f = font,
      size = 9.5,
      color = inkColor,
    ) => {
      const w = f.widthOfTextAtSize(text, size);
      page.drawText(text, { x: rightX - w, y, size, font: f, color });
    };

    const truncateText = (text: string, maxWidth: number, f: typeof font, size: number): string => {
      if (!text) return '';
      if (f.widthOfTextAtSize(text, size) <= maxWidth) return text;
      const ellipsis = '…';
      const budget = maxWidth - f.widthOfTextAtSize(ellipsis, size);
      if (budget <= 0) return ellipsis;
      let low = 0;
      let high = text.length;
      while (low < high) {
        const mid = Math.ceil((low + high) / 2);
        if (f.widthOfTextAtSize(text.slice(0, mid), size) <= budget) low = mid;
        else high = mid - 1;
      }
      return text.slice(0, low).trimEnd() + ellipsis;
    };

    const today = formatDateA(new Date());

    const drawFooter = (p: typeof page, pageNum: number) => {
      const footerY = 38;
      p.drawLine({
        start: { x: marginLeft, y: footerY + 14 },
        end: { x: marginRight, y: footerY + 14 },
        thickness: 0.75,
        color: borderLight,
      });
      const footerText = 'Documento generado automáticamente';
      const w = font.widthOfTextAtSize(footerText, 8);
      p.drawText(footerText, { x: (PAGE_WIDTH - w) / 2, y: footerY, size: 8, font, color: dashColor });
      const pageLabel = `Página ${pageNum}`;
      const pw = font.widthOfTextAtSize(pageLabel, 8);
      p.drawText(pageLabel, { x: marginRight - pw, y: footerY, size: 8, font, color: dashColor });
    };

    const drawTableHeader = () => {
      const headerY = yPosition;
      columns.forEach((col, i) => {
        if (col.align === 'right') {
          drawRightText(col.header.toUpperCase(), colX[i] + col.width - CELL_PADDING, headerY, fontBold, 8, mutedColor);
        } else {
          page.drawText(col.header.toUpperCase(), { x: colX[i], y: headerY, size: 8, font: fontBold, color: mutedColor });
        }
      });
      yPosition -= 6;
      page.drawLine({ start: { x: marginLeft, y: yPosition }, end: { x: marginRight, y: yPosition }, thickness: 0.75, color: borderLight });
      yPosition -= 16;
    };

    const drawContinuationHeader = () => {
      page.drawText(kicker, { x: marginLeft, y: yPosition, size: 9, font: fontBold, color: brownColor });
      drawRightText('continuación', marginRight, yPosition, fontBold, 9, mutedColor);
      yPosition -= 8;
      page.drawLine({ start: { x: marginLeft, y: yPosition }, end: { x: marginRight, y: yPosition }, thickness: 0.75, color: borderLight });
      yPosition -= 26;
      drawTableHeader();
    };

    const ensureSpace = (neededHeight = 60) => {
      if (yPosition < neededHeight) {
        drawFooter(page, pdfDoc.getPageCount());
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        yPosition = PAGE_HEIGHT - 50;
        drawContinuationHeader();
      }
    };

    // ── Encabezado ──
    page.drawText(kicker, { x: marginLeft, y: yPosition, size: 9, font: fontBold, color: brownColor });
    drawRightText(today, marginRight, yPosition, fontBold, 9, mutedColor);
    yPosition -= 8;
    page.drawLine({ start: { x: marginLeft, y: yPosition }, end: { x: marginRight, y: yPosition }, thickness: 0.75, color: borderLight });
    yPosition -= 32;

    page.drawText(title, { x: marginLeft, y: yPosition, size: 22, font: fontBold, color: inkColor });
    yPosition -= 34;

    const metaY = yPosition;
    page.drawText('Usuario:', { x: marginLeft, y: metaY, size: 9.5, font: fontBold, color: inkColor });
    page.drawText(userName, { x: marginLeft + 48, y: metaY, size: 9.5, font, color: mutedText2 });
    if (metaLine) {
      const label = 'Detalle: ';
      const labelW = fontBold.widthOfTextAtSize(label, 9.5);
      const valueW = font.widthOfTextAtSize(metaLine, 9.5);
      const startX = marginRight - labelW - valueW;
      page.drawText(label, { x: startX, y: metaY, size: 9.5, font: fontBold, color: inkColor });
      page.drawText(metaLine, { x: startX + labelW, y: metaY, size: 9.5, font, color: mutedText2 });
    }
    yPosition -= 12;
    page.drawLine({ start: { x: marginLeft, y: yPosition }, end: { x: marginRight, y: yPosition }, thickness: 1.5, color: inkColor });
    yPosition -= 26;

    // ── Tabla ──
    if (rows.length === 0) {
      const topY = yPosition;
      const bottomY = topY - 40;
      const dash = [3, 2];
      page.drawLine({ start: { x: marginLeft, y: topY }, end: { x: marginRight, y: topY }, thickness: 0.75, color: borderLight, dashArray: dash });
      page.drawLine({ start: { x: marginLeft, y: bottomY }, end: { x: marginRight, y: bottomY }, thickness: 0.75, color: borderLight, dashArray: dash });
      page.drawLine({ start: { x: marginLeft, y: topY }, end: { x: marginLeft, y: bottomY }, thickness: 0.75, color: borderLight, dashArray: dash });
      page.drawLine({ start: { x: marginRight, y: topY }, end: { x: marginRight, y: bottomY }, thickness: 0.75, color: borderLight, dashArray: dash });
      const w = fontItalic.widthOfTextAtSize(emptyMessage, 9);
      page.drawText(emptyMessage, { x: (marginLeft + marginRight) / 2 - w / 2, y: (topY + bottomY) / 2 - 3, size: 9, font: fontItalic, color: dashColor });
      yPosition = bottomY - 20;
    } else {
      drawTableHeader();
      rows.forEach((row) => {
        ensureSpace(50);
        const rowY = yPosition;
        row.forEach((cell, i) => {
          const col = columns[i];
          const maxWidth = col.width - CELL_PADDING;
          const text = truncateText(cell, maxWidth, font, 9.5);
          if (col.align === 'right') {
            drawRightText(text, colX[i] + col.width - CELL_PADDING, rowY, font, 9.5, inkColor);
          } else {
            page.drawText(text, { x: colX[i], y: rowY, size: 9.5, font, color: inkColor });
          }
        });
        yPosition -= 18;
        page.drawLine({ start: { x: marginLeft, y: yPosition + 6 }, end: { x: marginRight, y: yPosition + 6 }, thickness: 0.5, color: borderLighter });
        yPosition -= 6;
      });
    }

    // ── Totales ──
    if (totals && totals.length > 0) {
      ensureSpace(100);
      yPosition -= 14;
      const cardGap = 8;
      const cardWidth = (marginRight - marginLeft - cardGap * (totals.length - 1)) / totals.length;
      const cardHeight = 52;
      const cardTop = yPosition;
      const cardBottomY = cardTop - cardHeight;

      totals.forEach((t, i) => {
        const x = marginLeft + i * (cardWidth + cardGap);
        const isLast = i === totals.length - 1;
        page.drawRectangle({
          x,
          y: cardBottomY,
          width: cardWidth,
          height: cardHeight,
          color: isLast ? brownColor : totalsCardBg,
        });
        page.drawText(t.label.toUpperCase(), {
          x: x + 12,
          y: cardTop - 18,
          size: 7.5,
          font: fontBold,
          color: isLast ? rgb(0.886, 0.847, 0.769) : mutedColor,
        });
        page.drawText(t.value, {
          x: x + 12,
          y: cardTop - 37,
          size: 14,
          font: fontBold,
          color: isLast ? rgb(1, 1, 1) : inkColor,
        });
      });
      yPosition = cardBottomY - 10;
    }

    drawFooter(page, pdfDoc.getPageCount());

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    if (newWindow) {
      newWindow.onload = () => newWindow.print();
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast.success(successMessage ?? `${title} generado y descargado correctamente`);
    return pdfBytes;
  } catch (error) {
    console.error(`Error generando el PDF "${title}":`, error);
    toast.error('Error al generar el PDF');
    throw error;
  }
}
