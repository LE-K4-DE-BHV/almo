package de.almo.backend.order;

import java.io.ByteArrayOutputStream;
import org.openpdf.text.Document;
import org.openpdf.text.Element;
import org.openpdf.text.Font;
import org.openpdf.text.FontFactory;
import org.openpdf.text.Paragraph;
import org.openpdf.text.pdf.PdfPCell;
import org.openpdf.text.pdf.PdfPTable;
import org.openpdf.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

/**
 * Renders straight from the Order entity, not from any stored file - see Sprint 4 decision in
 * docs/backlog.md: regenerated on every download, so there's nothing to keep in sync if an order is
 * re-downloaded later.
 */
@Service
public class OrderPdfService {

  private static final Font TITLE_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
  private static final Font HEADING_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
  private static final Font BODY_FONT = FontFactory.getFont(FontFactory.HELVETICA, 10);
  private static final Font MUTED_FONT = FontFactory.getFont(FontFactory.HELVETICA, 9, Font.ITALIC);

  private final ShopContactProperties contactProperties;

  public OrderPdfService(ShopContactProperties contactProperties) {
    this.contactProperties = contactProperties;
  }

  public byte[] render(Order order) {
    Document document = new Document();
    ByteArrayOutputStream out = new ByteArrayOutputStream();
    try {
      PdfWriter.getInstance(document, out);
      document.open();

      document.add(new Paragraph("Almo Schmuck", TITLE_FONT));
      document.add(new Paragraph("Bestellbestaetigung " + order.orderNumber(), HEADING_FONT));
      document.add(new Paragraph(" "));

      document.add(new Paragraph(order.getShippingName(), BODY_FONT));
      document.add(new Paragraph(order.getShippingAddress(), BODY_FONT));
      document.add(new Paragraph(order.getShippingCity(), BODY_FONT));
      document.add(new Paragraph(" "));

      document.add(itemsTable(order));
      document.add(new Paragraph(" "));

      document.add(
          new Paragraph(
              "Kontaktwunsch: "
                  + (order.getContactPreference() == ContactPreference.WHATSAPP
                      ? "WhatsApp"
                      : "E-Mail"),
              BODY_FONT));
      document.add(new Paragraph(" "));

      document.add(
          new Paragraph(
              "Der Admin meldet sich zeitnah bei dir. Falls nicht, meld dich gern selbst:",
              MUTED_FONT));
      document.add(
          new Paragraph("WhatsApp: " + contactProperties.getContactWhatsapp(), MUTED_FONT));
      document.add(new Paragraph("E-Mail: " + contactProperties.getContactEmail(), MUTED_FONT));

      document.close();
      return out.toByteArray();
    } catch (Exception e) {
      throw new IllegalStateException("Failed to render order PDF for " + order.orderNumber(), e);
    }
  }

  private PdfPTable itemsTable(Order order) {
    PdfPTable table = new PdfPTable(4);
    table.setWidthPercentage(100);
    try {
      table.setWidths(new float[] {4, 1, 1.5f, 1.5f});
    } catch (org.openpdf.text.DocumentException e) {
      throw new IllegalStateException(e);
    }

    addHeaderCell(table, "Produkt");
    addHeaderCell(table, "Menge");
    addHeaderCell(table, "Einzelpreis");
    addHeaderCell(table, "Summe");

    for (OrderItem item : order.getItems()) {
      table.addCell(cell(item.getProductName()));
      table.addCell(cell(String.valueOf(item.getQuantity())));
      table.addCell(cell(formatPrice(item.getPriceAtOrder())));
      table.addCell(
          cell(
              formatPrice(
                  item.getPriceAtOrder()
                      .multiply(java.math.BigDecimal.valueOf(item.getQuantity())))));
    }

    table.addCell(totalLabelCell("Versand"));
    table.addCell(totalValueCell(formatPrice(order.getShippingCost())));
    table.addCell(totalLabelCell("Gesamt"));
    table.addCell(totalValueCell(formatPrice(order.total())));

    return table;
  }

  private void addHeaderCell(PdfPTable table, String text) {
    PdfPCell cell = new PdfPCell(new Paragraph(text, HEADING_FONT));
    cell.setBackgroundColor(new java.awt.Color(0xE8, 0xE3, 0xDA));
    cell.setPadding(6);
    table.addCell(cell);
  }

  private PdfPCell cell(String text) {
    PdfPCell cell = new PdfPCell(new Paragraph(text, BODY_FONT));
    cell.setPadding(6);
    return cell;
  }

  private PdfPCell totalLabelCell(String text) {
    PdfPCell cell = new PdfPCell(new Paragraph(text, HEADING_FONT));
    cell.setColspan(2);
    cell.setPadding(6);
    cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
    return cell;
  }

  private PdfPCell totalValueCell(String text) {
    PdfPCell cell = new PdfPCell(new Paragraph(text, HEADING_FONT));
    cell.setColspan(2);
    cell.setPadding(6);
    return cell;
  }

  private String formatPrice(java.math.BigDecimal value) {
    return "%.2f EUR".formatted(value);
  }
}
