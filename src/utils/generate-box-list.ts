// src/utils/generate-box-list.ts
import type { BoxList } from "@/types/box-list.type"
import type { OtherPayment } from "@/types/other-payment.type"
import type { ReceiptPayment } from "@/types/receipt.type"
import type { TicketRegistrationForDay } from "@/types/ticket-registration-for-day.type"
import type { TicketRegistration } from "@/types/ticket-registration.type"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import { toast } from "sonner"

type SubtotalSummaryItem = {
  key: string
  label: string
  entradas: number
  salidas: number
  neto: number
}

// ✅ Orden alfabético por apellido (y nombre) en español, ignorando mayúsculas/acentos
const collator = new Intl.Collator("es", { sensitivity: "base" })
const norm = (v?: string | null) => (v ?? "").toString().trim()

const sortByLastName = <T>(
  arr: T[],
  getName: (item: T) => { lastName?: string | null; firstName?: string | null } | null | undefined,
) => {
  return [...arr].sort((a, b) => {
    const an = getName(a)
    const bn = getName(b)

    const aLast = norm(an?.lastName)
    const bLast = norm(bn?.lastName)
    const lastCmp = collator.compare(aLast, bLast)
    if (lastCmp !== 0) return lastCmp

    const aFirst = norm(an?.firstName)
    const bFirst = norm(bn?.firstName)
    return collator.compare(aFirst, bFirst)
  })
}

export default async function generateBoxList(boxList: BoxList, userName: string): Promise<Uint8Array> {
  try {
    if (!boxList) {
      throw new Error("No se recibieron datos válidos para generar el PDF.")
    }

    // ==============================
    //  Datos base (NO se tocan)
    // ==============================
    const {
      ticketRegistrations,
      receipts,
      otherPayments,
      ticketRegistrationForDays,
      totalPrice,
      date,
      boxNumber,
      receiptPayments,
      paymentHistoryOnAccount,
    } = boxList

    const tickets = Array.isArray(ticketRegistrations) ? ticketRegistrations : []
    const ticketDays = Array.isArray(ticketRegistrationForDays) ? ticketRegistrationForDays : []
    const validReceipts = Array.isArray(receipts) ? receipts : []
    const otherPaymentsRegistration = Array.isArray(otherPayments) ? otherPayments : []

    // ✅ Filtramos nulos al inicio para evitar errores en todo el flujo
    const safeReceiptPayments = Array.isArray(receiptPayments)
      ? receiptPayments.filter((rp) => rp && rp.receipt && rp.receipt.customer)
      : []

    const safePaymentHistory = Array.isArray(paymentHistoryOnAccount)
      ? paymentHistoryOnAccount.filter((p) => p && p.receipt && p.receipt.customer)
      : []

    console.log(
      "TP detectados",
      safeReceiptPayments.filter(
        (rp) =>
          rp.paymentType === "TP" ||
          rp.receipt?.paymentType === "TP" ||
          rp.receipt?.receiptTypeKey === "TP",
      ),
    )

    // 🏠 Propietarios (owners)
    const owners = safeReceiptPayments.filter(
      (receiptPayment) =>
        receiptPayment.receipt?.customer?.customerType === "OWNER" ||
        receiptPayment.paymentType === "TP" ||
        receiptPayment.receipt?.paymentType === "TP" ||
        receiptPayment.receipt?.receiptTypeKey === "TP",
    )

    // 🧾 Tipos de recibo asociados a inquilinos
    const renterReceiptTypes = [
      "JOSE_RICARDO_AZNAR",
      "CARLOS_ALBERTO_AZNAR",
      "NIDIA_ROSA_MARIA_FONTELA",
      "ALDO_RAUL_FONTELA",
    ]

    // 👥 Inquilinos (renters)
    const renters = safeReceiptPayments.filter((receiptPayment) =>
      renterReceiptTypes.includes(receiptPayment.receipt?.receiptTypeKey ?? ""),
    )

    // 🧍 Privados (privates)
    const privates = safeReceiptPayments.filter(
      (receiptPayment) =>
        receiptPayment.receipt?.customer?.customerType === "PRIVATE" &&
        receiptPayment.paymentType !== "TP" &&
        receiptPayment.receipt?.paymentType !== "TP" &&
        receiptPayment.receipt?.receiptTypeKey !== "TP",
    )

    // 💳 Pagos en cuenta (paymentHistory)
    const paymentHistoryOwners = safePaymentHistory.filter((p) => p.receipt?.customer?.customerType === "OWNER")

    const paymentHistoryRenters = safePaymentHistory.filter((p) =>
      renterReceiptTypes.includes(p.receipt?.receiptTypeKey ?? ""),
    )

    const paymentHistoryPrivates = safePaymentHistory.filter((p) => p.receipt?.customer?.customerType === "PRIVATE")

    // 🧩 Combinaciones finales
    const combinedOwners = [...owners, ...paymentHistoryOwners]
    const combinedRenters = [...renters, ...paymentHistoryRenters]
    const combinedPrivates = [...privates, ...paymentHistoryPrivates]

    // ✅ Ordenados alfabéticamente por apellido (y nombre)
    const combinedRentersSorted = sortByLastName(combinedRenters, (rp: any) => rp?.receipt?.customer)
    const combinedPrivatesSorted = sortByLastName(combinedPrivates, (rp: any) => rp?.receipt?.customer)

    const combinedOwnersSorted = sortByLastName(combinedOwners, (rp: any) => {
      const receipt = rp?.receipt
      const vehicleCustomer = receipt?.customer?.vehicleRenters?.[0]?.vehicle?.customer
      return vehicleCustomer ?? receipt?.customer
    })

    // 🧮 Totales globales
    let totalEfectivo = 0
    let totalTransferencias = 0

    // ==============================
    //  Configuración PDF
    // ==============================
    const pdfDoc = await PDFDocument.create()
    let page = pdfDoc.addPage([595.28, 841.89])
    const { height } = page.getSize()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const fontSize = 10

    let yPosition = height - 50

    // Ajuste de márgenes y columnas
    const tableLeft = 60
    const tableRight = 550

    // ==============================
    // ✅ COLUMNAS (igual espacio en las últimas 4)
    // ==============================
    const colFechaX = 30

    // Separadores de columnas principales
    const lineAfterDateX = 85

    // ✅ más ancha la descripción
    const lineAfterDescX = 330

    // ✅ GRID: 4 columnas iguales desde lineAfterDescX hasta un borde derecho con margen
    const gridRightEdge = 585 // ✅ deja margen para que "Totales" no se corte
    const gridLeftEdge = lineAfterDescX
    const gridWidth = gridRightEdge - gridLeftEdge
    const colW = gridWidth / 4

    // Líneas verticales entre las 4 columnas
    const lineAfterEntradasX = gridLeftEdge + colW * 1
    const lineAfterSalidasX = gridLeftEdge + colW * 2
    const lineAfterSubtotalesX = gridLeftEdge + colW * 3

    // Texto descripción (alineado con header)
    const colDescTextX = lineAfterDateX + 10

    // Padding interno para números a la derecha
    const padR = 8

    // Right edge por columna (para alinear derecha)
    const entradasRightX = lineAfterEntradasX - padR
    const salidasRightX = lineAfterSalidasX - padR
    const subtotalesRightX = lineAfterSubtotalesX - padR
    const totalesRightX = gridRightEdge - padR

    // Headers centrados en cada columna (se ven parejos)
    const headerCenterX = (left: number, right: number) => left + (right - left) / 2
    const entradasHeaderCenter = headerCenterX(gridLeftEdge, lineAfterEntradasX)
    const salidasHeaderCenter = headerCenterX(lineAfterEntradasX, lineAfterSalidasX)
    const subtotalesHeaderCenter = headerCenterX(lineAfterSalidasX, lineAfterSubtotalesX)
    const totalesHeaderCenter = headerCenterX(lineAfterSubtotalesX, gridRightEdge)

    const drawCenteredHeader = (text: string, centerX: number, y: number) => {
      const w = fontBold.widthOfTextAtSize(text, fontSize)
      page.drawText(text, { x: centerX - w / 2, y, size: fontSize, font: fontBold })
    }

    const numberFmt = new Intl.NumberFormat("es-AR", {
      useGrouping: true,
      maximumFractionDigits: 0,
    })

    const formatNumber = (num: number): string => {
      const n = Math.round(Number(num) || 0)
      if (n === 0) return "0"
      const s = String(Math.abs(n))
      const withDots = s.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
      return n < 0 ? `-${withDots}` : withDots
    }



    const formatDate = (fecha: Date) => {
      const day = String(fecha.getDate()).padStart(2, "0")
      const month = String(fecha.getMonth() + 1).padStart(2, "0")
      const year = fecha.getFullYear()
      return `${day}/${month}/${year}`
    }

    const formatDateA = (d: string | Date) => {
      if (typeof d === "string") {
        const [year, month, day] = d.split("-")
        return `${day}/${month}/${year}`
      }
      const day = String(d.getDate()).padStart(2, "0")
      const month = String(d.getMonth() + 1).padStart(2, "0")
      const year = d.getFullYear()
      return `${day}/${month}/${year}`
    }

    // ✅ draw text right-aligned
    const drawRightText = (text: string, rightX: number, y: number, f = font, size = fontSize) => {
      const w = f.widthOfTextAtSize(text, size)
      page.drawText(text, { x: rightX - w, y, size, font: f })
    }

    const today = formatDate(new Date())
    let isFirstPage = true

    // ==============================
    // ✅ Acumulador de subtotales
    // ==============================
    const subtotals: SubtotalSummaryItem[] = []
    const upsertSubtotal = (key: string, label: string, entradas: number, salidas: number) => {
      const neto = entradas - salidas
      const existing = subtotals.find((s) => s.key === key)
      if (existing) {
        existing.entradas += entradas
        existing.salidas += salidas
        existing.neto = existing.entradas - existing.salidas
      } else {
        subtotals.push({ key, label, entradas, salidas, neto })
      }
    }

    const ensureSpace = (neededHeight = 70) => {
      if (yPosition < neededHeight) {
        page = pdfDoc.addPage([595.28, 841.89])
        const { height: newHeight } = page.getSize()
        yPosition = newHeight - 80

        isFirstPage = false

        page.drawText("Garage Mitre", {
          x: 50,
          y: yPosition + 40,
          size: fontSize + 2,
          font: fontBold,
        })

        page.drawText("Planilla de Caja (continuación)", {
          x: 250,
          y: yPosition + 40,
          size: fontSize + 2,
          font: fontBold,
        })

        const currentPage = pdfDoc.getPageCount()
        page.drawText(`Página ${currentPage}`, {
          x: 500,
          y: yPosition + 40,
          size: fontSize - 1,
          font,
        })

        yPosition -= 20

        page.drawRectangle({
          x: 0,
          y: yPosition - 28,
          width: 595.28,
          height: 26,
          color: rgb(0.80, 0.80, 0.80),
        })

        const headerY = yPosition - 19
        page.drawText("Fecha", { x: colFechaX, y: headerY, size: fontSize, font: fontBold })
        page.drawText("Descripción", { x: colDescTextX, y: headerY, size: fontSize, font: fontBold })

        drawCenteredHeader("Entradas", entradasHeaderCenter, headerY)
        drawCenteredHeader("Salidas", salidasHeaderCenter, headerY)
        drawCenteredHeader("Subtotales", subtotalesHeaderCenter, headerY)
        drawCenteredHeader("Totales", totalesHeaderCenter, headerY)

        yPosition -= 40
      }
    }

    const drawVerticalLines = (y: number) => {
      const columnPositions = [
        lineAfterDateX,
        lineAfterDescX,
        lineAfterEntradasX,
        lineAfterSalidasX,
        lineAfterSubtotalesX,
      ]
      columnPositions.forEach((x) => {
        page.drawLine({
          start: { x, y: y + 22 },
          end: { x, y: y - 22 },
          thickness: 0.5,
          color: rgb(0.80, 0.80, 0.80),
        })
      })
    }

    // ==============================
    //  Encabezado superior
    // ==============================
    page.drawText("Garage Mitre", {
      x: 50,
      y: yPosition - 5,
      size: fontSize + 2,
      font: fontBold,
    })
    page.drawText("Planilla de Caja", {
      x: 250,
      y: yPosition - 5,
      size: fontSize + 4,
      font: fontBold,
    })
    page.drawText(`N° ${boxNumber}`, {
      x: 410,
      y: yPosition - 5,
      size: fontSize + 4,
      font: fontBold,
    })

    yPosition -= 28

    page.drawText(`Usuario: ${userName}`, {
      x: 50,
      y: yPosition - 5,
      size: fontSize,
      font,
    })

    page.drawText(`Impresión: ${today}`, {
      x: 400,
      y: yPosition - 5,
      size: fontSize,
      font,
    })
    yPosition -= 28

    page.drawText(`Apertura: ${formatDateA(date)}`, {
      x: 400,
      y: yPosition - 5,
      size: fontSize,
      font,
    })

    yPosition -= 35

    // ==============================
    //  Encabezado de tabla
    // ==============================
    const drawTableHeader = () => {
      page.drawRectangle({
        x: 0,
        y: yPosition - 28,
        width: 595.28,
        height: 26,
        color: rgb(0.80, 0.80, 0.80),
      })

      const headerY = yPosition - 19
      page.drawText("Fecha", { x: colFechaX, y: headerY, size: fontSize, font: fontBold })
      page.drawText("Descripción", { x: colDescTextX, y: headerY, size: fontSize, font: fontBold })

      drawCenteredHeader("Entradas", entradasHeaderCenter, headerY)
      drawCenteredHeader("Salidas", salidasHeaderCenter, headerY)
      drawCenteredHeader("Subtotales", subtotalesHeaderCenter, headerY)
      drawCenteredHeader("Totales", totalesHeaderCenter, headerY)

      yPosition -= 40
    }

    drawTableHeader()

    // ==============================
    //  Helpers de diseño de secciones
    // ==============================
    const drawSectionHeaderRow = (title: string) => {
      ensureSpace(80)
      page.drawRectangle({
        x: 0,
        y: yPosition - 16,
        width: 595.28,
        height: 18,
        color: rgb(0.80, 0.80, 0.80),
      })

      const upperTitle = title.toUpperCase()
      const textWidth = fontBold.widthOfTextAtSize(upperTitle, fontSize)
      const rectWidth = tableRight - tableLeft + 40
      const rectCenter = tableLeft + rectWidth / 2
      const textX = rectCenter - textWidth / 2

      page.drawText(upperTitle, {
        x: textX,
        y: yPosition - 8,
        size: fontSize,
        font: fontBold,
      })
      yPosition -= 22
    }

    const drawRowSeparator = () => {
      page.drawLine({
        start: { x: tableLeft, y: yPosition + 6 },
        end: { x: tableRight + 40, y: yPosition + 6 },
        thickness: 0.3,
        color: rgb(0.8, 0.8, 0.8),
      })
      yPosition -= 3
    }

    const drawSubtotalRow = (sectionKey: string, sectionLabel: string, totalEntrada: number, totalSalida: number) => {
      ensureSpace(50)
      const neto = totalEntrada - totalSalida

      upsertSubtotal(sectionKey, sectionLabel, totalEntrada, totalSalida)

      page.drawRectangle({
        x: 0,
        y: yPosition - 28,
        width: 595.28,
        height: 26,
        color: rgb(0.80, 0.80, 0.80),
      })

      const textY = yPosition - 18
      page.drawText("Subtotal", { x: colFechaX, y: textY, size: fontSize, font: fontBold })

      drawRightText(formatNumber(totalEntrada), entradasRightX, textY, fontBold, fontSize)
      drawRightText(totalSalida ? `- ${formatNumber(totalSalida)}` : "0", salidasRightX, textY, fontBold, fontSize)
      drawRightText(formatNumber(neto), subtotalesRightX, textY, fontBold, fontSize)

      yPosition -= 28
    }

    const drawTotalsESNRow = (entradas: number, salidas: number, neto: number) => {
      ensureSpace(110)

      page.drawRectangle({
        x: 0,
        y: yPosition - 58,
        width: 595.28,
        height: 50,
        color: rgb(0.80, 0.80, 0.80),
      })

      const y1 = yPosition - 20
      const y2 = yPosition - 34
      const y3 = yPosition - 48

      page.drawText("Total Entradas", { x: 40, y: y1, size: fontSize + 0.5, font: fontBold })
      drawRightText(formatNumber(entradas), totalesRightX, y1, fontBold, fontSize + 0.5)

      page.drawText("Total Salidas", { x: 40, y: y2, size: fontSize + 0.5, font: fontBold })
      drawRightText(salidas ? `- ${formatNumber(salidas)}` : "0", totalesRightX, y2, fontBold, fontSize + 0.5)

      page.drawText("Neto", { x: 40, y: y3, size: fontSize + 0.7, font: fontBold })
      drawRightText(formatNumber(neto), totalesRightX, y3, fontBold, fontSize + 0.7)

      yPosition -= 64
    }

    const drawSubtotalsSummary = () => {
      ensureSpace(220)

      page.drawRectangle({
        x: 0,
        y: yPosition - 20,
        width: 595.28,
        height: 18,
        color: rgb(0.80, 0.80, 0.80),
      })

      page.drawText("RESUMEN", {
        x: 40,
        y: yPosition - 14,
        size: fontSize,
        font: fontBold,
      })

      yPosition -= 30

      page.drawText("Sección", { x: 40, y: yPosition, size: fontSize - 0.5, font: fontBold })
      page.drawText("Entradas", { x: gridLeftEdge + 5, y: yPosition, size: fontSize - 0.5, font: fontBold })
      page.drawText("Salidas", { x: lineAfterEntradasX + 5, y: yPosition, size: fontSize - 0.5, font: fontBold })
      page.drawText("Neto", { x: lineAfterSalidasX + 5, y: yPosition, size: fontSize - 0.5, font: fontBold })

      yPosition -= 14

      subtotals.forEach((s) => {
        ensureSpace(40)

        page.drawText(s.label, { x: 40, y: yPosition, size: fontSize - 0.5, font })

        drawRightText(formatNumber(s.entradas), entradasRightX, yPosition, font, fontSize - 0.5)
        drawRightText(s.salidas ? `- ${formatNumber(s.salidas)}` : "0", salidasRightX, yPosition, font, fontSize - 0.5)
        drawRightText(formatNumber(s.neto), subtotalesRightX, yPosition, font, fontSize - 0.5)

        yPosition -= 16
      })

      page.drawLine({
        start: { x: 40, y: yPosition + 6 },
        end: { x: 555, y: yPosition + 6 },
        thickness: 0.6,
        color: rgb(0.65, 0.65, 0.65),
      })

      yPosition -= 12
    }

    // ==============================
    //  Secciones de datos
    // ==============================

    const addDataSection = (sectionKey: string, title: string, items: any[], dataExtractor: (item: any) => string[]) => {
      yPosition -= 6
      drawSectionHeaderRow(title)
      const filteredItems = items.filter((i: any) => i.paid === undefined || i.paid)
      const total = filteredItems.reduce((sum, i: any) => sum + i.price, 0)

      if (items.length > 0) {
        items.forEach((item: any) => {
          ensureSpace(45)
          const [desc, priceStr, dateNow] = dataExtractor(item)
          const price = Number(priceStr)

          const maxDescWidth = lineAfterDescX - colDescTextX - 10
          const truncatedDesc = truncateText(desc, maxDescWidth, font, fontSize)

          page.drawText(dateNow, { x: colFechaX, y: yPosition - 6, size: fontSize, font })
          page.drawText(truncatedDesc, { x: colDescTextX, y: yPosition - 6, size: fontSize, font })

          drawRightText(formatNumber(price), entradasRightX, yPosition - 6, font, fontSize)

          yPosition -= 24
          drawRowSeparator()
        })
        drawVerticalLines(yPosition)
      } else {
        page.drawText("No se registraron datos", {
          x: colDescTextX,
          y: yPosition - 6,
          size: fontSize,
          font,
        })
        yPosition -= 28
        drawRowSeparator()
      }

      drawSubtotalRow(sectionKey, title, total, 0)
    }

    const addDataSectionReceipt = (
      sectionKey: string,
      title: string,
      items: ReceiptPayment[],
      // 7 valores:
      // 1 desc
      // 2 price (lo que va en Entradas)
      // 3 fecha
      // 4 paymentType
      // 5 vehicleOwner?
      // 6 numberInBox? (opcional, si querés mostrarlo/usar)
      // 7 totalPriceSalida? (para la regla TERCEROS+TR)
      dataExtractor: (item: any) => [string, number, string, string, string?, number?, number?],
    ) => {
      yPosition -= 5
      drawSectionHeaderRow(title)

      let totalEntradas = 0
      let totalSalidas = 0

      if (items.length > 0) {
        items.forEach((item) => {
          ensureSpace(40)

          // ✅ desestructurar los 7
          const [
            desc,
            priceStr,
            dateNow,
            paymentType,
            vehicleOwner,
            numberInBox,
            totalPriceSalida,
          ] = dataExtractor(item)

          const price = Number(priceStr ?? 0)

          page.drawText(dateNow, {
            x: colFechaX,
            y: yPosition - 5,
            size: fontSize,
            font,
          })

          const displayType = paymentType === "MIX" ? "AT" : paymentType

          let descText = desc
          if (displayType) descText += ` (${displayType})`
          if (vehicleOwner) descText += ` (${vehicleOwner})`

          const maxDescWidth = lineAfterDescX - colDescTextX - 10
          const truncatedDesc = truncateText(descText, maxDescWidth, font, fontSize)

          page.drawText(truncatedDesc, {
            x: colDescTextX,
            y: yPosition - 5,
            size: fontSize,
            font,
          })

          const isExpensa = title.toLowerCase() === "expensas"
          const isTercero = title.toLowerCase() === "terceros"

          const treatAsCash =
            paymentType === "EF" ||
            paymentType === "CH" ||
            paymentType === "MIX" ||
            (isExpensa && paymentType === "AT")

          // ✅ Caja: entradas
          if (treatAsCash) {
            totalEntradas += price
            drawRightText(formatNumber(price), entradasRightX, yPosition - 5, font, fontSize)

            drawVerticalLines(yPosition)
            yPosition -= 22
            drawRowSeparator()
            return
          }

          // ✅ Entrada normal (siempre)
          totalEntradas += price
          drawRightText(formatNumber(price), entradasRightX, yPosition - 5, font, fontSize)

          // ======================================================
          // 🔥 REGLA: TERCEROS + TR => salida = totalPriceSalida (7mo valor)
          // ======================================================
          if (isTercero && paymentType === "TR") {
            const salida = Number(totalPriceSalida ?? 0)
            totalSalidas += salida
            drawRightText(`- ${formatNumber(salida)}`, salidasRightX, yPosition - 5, font, fontSize)
          }
          // ✅ Si TERCEROS y NO es TR, dejo tu regla (salida = price)
          else if (isTercero) {
            totalSalidas += price
            drawRightText(`- ${formatNumber(price)}`, salidasRightX, yPosition - 5, font, fontSize)
          }
          // ✅ resto secciones
          else if (paymentType === "TR") {
            totalSalidas += price
            drawRightText(`- ${formatNumber(price)}`, salidasRightX, yPosition - 5, font, fontSize)
          } else {
            totalSalidas += price
            drawRightText(`- ${formatNumber(price)}`, salidasRightX, yPosition - 5, font, fontSize)
          }

          drawVerticalLines(yPosition)
          yPosition -= 22
          drawRowSeparator()
        })
      } else {
        page.drawText("No se registraron datos", {
          x: colDescTextX,
          y: yPosition - 5,
          size: fontSize,
          font,
        })
        yPosition -= 24
        drawRowSeparator()
      }

      drawSubtotalRow(sectionKey, title, totalEntradas, totalSalidas)
    }


    const addDataSectionExpense = (
      sectionKey: string,
      title: string,
      items: OtherPayment[],
      dataExtractor: (item: any) => string[],
    ) => {
      yPosition -= 6
      drawSectionHeaderRow(title)

      let entradas = 0
      let salidas = 0

      if (items.length > 0) {
        items.forEach((item) => {
          ensureSpace(40)

          const [desc, priceStr, dateNow, type] = dataExtractor(item)
          const price = Number(priceStr)

          page.drawText(dateNow, {
            x: colFechaX,
            y: yPosition - 5,
            size: fontSize,
            font,
          })

          const maxDescWidth = lineAfterDescX - colDescTextX - 10
          const truncatedDesc = truncateText(desc, maxDescWidth, font, fontSize)

          page.drawText(truncatedDesc, { x: colDescTextX, y: yPosition, size: fontSize, font })

          if (type === "EGRESOS") {
            drawRightText(`- ${formatNumber(price)}`, salidasRightX, yPosition - 5, font, fontSize)
            salidas += price
          } else {
            drawRightText(formatNumber(price), entradasRightX, yPosition - 5, font, fontSize)
            entradas += price
          }

          drawVerticalLines(yPosition)
          yPosition -= 22
          drawRowSeparator()
        })
      } else {
        page.drawText("No se registraron datos", {
          x: colDescTextX,
          y: yPosition - 5,
          size: fontSize,
          font,
        })
        yPosition -= 24
        drawRowSeparator()
      }

      drawSubtotalRow(sectionKey, title, entradas, salidas)
    }

    // ==============================
    //  Nombres friendly para recibos
    // ==============================
    const receiptTypeNames: Record<string, string> = {
      JOSE_RICARDO_AZNAR: "Ricardo Aznar",
      CARLOS_ALBERTO_AZNAR: "Carlos Aznar",
      NIDIA_ROSA_MARIA_FONTELA: "Nidia Fontela",
      ALDO_RAUL_FONTELA: "Aldo Fontela",
    }

    // ==============================
    //  Secciones según tu lógica
    // ==============================

    addDataSection("tickets_hora", "ticket x hora", tickets, (ticket: TicketRegistration) => [
      `${ticket.description} (${ticket.codeBarTicket || "—"})`,
      ticket.price.toString(),
      ticket.dateNow ? formatDateA(ticket.dateNow) : "—",
      "",
    ])

    addDataSection("tickets_dia", "Ticket x día/semana", ticketDays, (ticket: TicketRegistrationForDay) => [
      ticket.description,
      ticket.price.toString(),
      ticket.dateNow ? formatDateA(ticket.dateNow) : "—",
      "",
    ])

    addDataSectionReceipt("alquiler", "alquiler", combinedRentersSorted, (receiptPayment) => {
      const receipt = receiptPayment.receipt
      const total = receiptPayment.price
      const owner = receiptTypeNames[receipt.receiptTypeKey] || receipt.receiptTypeKey

      const paymentType =
        receiptPayment.paymentType === "TRANSFER"
          ? "TR"
          : receiptPayment.paymentType === "CASH"
            ? "EF"
            : receiptPayment.paymentType === "CHECK"
              ? "CH"
              : receiptPayment.paymentType === "CREDIT"
                ? "CR"
                : receiptPayment.paymentType === "TP"
                  ? "AT"
                  : "Desconocido"

      return [
        `${receipt.customer.lastName} ${receipt.customer.firstName}`,
        total,
        formatDateA(receipt.dateNow),
        paymentType,
        owner,
      ]
    })

    addDataSectionReceipt("expensas", "expensas", combinedOwnersSorted, (receiptPayment) => {
      const receipt = receiptPayment.receipt
      const total = receiptPayment.numberInBox

      const vehicleCustomer = receipt.customer?.vehicleRenters?.[0]?.vehicle?.customer
      const ownerName = vehicleCustomer
        ? `${vehicleCustomer.lastName} ${vehicleCustomer.firstName}`
        : `${receipt.customer.lastName} ${receipt.customer.firstName}`

      const paymentType =
        receiptPayment.paymentType === "TRANSFER"
          ? "TR"
          : receiptPayment.paymentType === "CASH"
            ? "EF"
            : receiptPayment.paymentType === "CHECK"
              ? "CH"
              : receiptPayment.paymentType === "CREDIT"
                ? "CR"
                : receiptPayment.paymentType === "TP"
                  ? "AT"
                  : receiptPayment.paymentType === "MIX"
                    ? "MIX"
                    : "Desconocido"

      return [ownerName, total, formatDateA(receipt.dateNow), paymentType]
    })

    addDataSectionReceipt("terceros", "terceros", combinedPrivatesSorted, (receiptPayment) => {
      const receipt = receiptPayment.receipt

      const totalInBox = Number(receiptPayment.numberInBox ?? 0)       // lo que mostrás en caja
      const totalPriceSalida = Number(receiptPayment.price ?? 0)       // salida real si TR

      const vehicleCustomer = receipt.customer.vehicleRenters?.[0]?.vehicle?.customer
      const vehicleOwner = vehicleCustomer ? `${vehicleCustomer.lastName}` : ""

      const paymentType =
        receiptPayment.paymentType === "TRANSFER"
          ? "TR"
          : receiptPayment.paymentType === "CASH"
            ? "EF"
            : receiptPayment.paymentType === "CHECK"
              ? "CH"
              : receiptPayment.paymentType === "CREDIT"
                ? "CR"
                : receiptPayment.paymentType === "TP"
                  ? "AT"
                  : receiptPayment.paymentType === "MIX"
                    ? "MIX"
                    : "Desconocido"

      return [
        `${receipt.customer.lastName} ${receipt.customer.firstName}`, // 1 desc
        totalInBox,                                                   // 2 entradas
        formatDateA(receipt.dateNow),                                 // 3 fecha
        paymentType,                                                  // 4 tipo
        vehicleOwner,                                                 // 5 owner?
        totalInBox,                                                   // 6 numberInBox (extra)
        totalPriceSalida,                                             // 7 salida para TR
      ]
    })


    // ==============================
    //  Totales globales (NO toco la lógica)
    // ==============================
    const totalReceipts = [...combinedRenters, ...combinedOwners, ...combinedPrivates].reduce((sum, rp) => {
      if (rp.paymentType === "TRANSFER" || rp.paymentType === "CREDIT" || rp.paymentType === "TP") {
        totalTransferencias += rp.price
        return sum
      } else if (rp.paymentType === "CASH" || rp.paymentType === "CHECK") {
        totalEfectivo += rp.price
        return sum + rp.price
      } else {
        return sum
      }
    }, 0)

    const totalTickets = [...tickets, ...ticketDays]
      .filter((t: any) => t.paid === undefined || t.paid === true)
      .reduce((sum, t: any) => sum + t.price, 0)

    const totalTicketsAndReceipts = totalTickets + totalReceipts
    const subtotalSinGastos = totalTicketsAndReceipts

    let totalEgresos = 0
    let totalIngresosVarios = 0

    otherPaymentsRegistration.forEach((op) => {
      if (op.type === "EGRESOS") {
        totalEgresos += op.price
      } else {
        totalIngresosVarios += op.price
      }
    })

    const totalEntradas = totalTickets + totalEfectivo + totalTransferencias
    const totalSalidas = totalEgresos
    const total = totalEntradas - totalSalidas

    addDataSectionExpense("varios", "varios", otherPaymentsRegistration, (payment) => [
      payment.description,
      payment.price.toString(),
      formatDateA(payment.dateNow),
      payment.type,
    ])

    // ==============================
    // ✅ RESUMEN + TOTAL GENERAL CORRECTO
    // ==============================
    const totalsFromSubtotals = subtotals.reduce(
      (acc, s) => {
        acc.entradas += s.entradas
        acc.salidas += s.salidas
        return acc
      },
      { entradas: 0, salidas: 0 },
    )

    const netoFromSubtotals = totalsFromSubtotals.entradas - totalsFromSubtotals.salidas

    drawSubtotalsSummary()
    drawTotalsESNRow(totalsFromSubtotals.entradas, totalsFromSubtotals.salidas, netoFromSubtotals)

    // ==============================
    //  Guardar, abrir e imprimir
    // ==============================
    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const newWindow = window.open(url, "_blank")
    if (newWindow) {
      newWindow.onload = () => {
        newWindow.print()
      }
    }
    const a = document.createElement("a")
    a.href = url
    a.download = `Listado-Caja-${today}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    toast.success("Lista de caja generada y descargada correctamente")
    return pdfBytes
  } catch (error) {
    console.error("Error generando la lista de caja:", error)
    toast.error("Error al generar la lista de caja")
    throw error
  }
}

// Helper function to handle text wrapping (ya no trunca)
const truncateText = (text: string, maxWidth: number, font: any, fontSize: number): string => {
  return text // 🔥 devuelve siempre el texto completo
}
