import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import pdfMake from "pdfmake";
import template from "../templates/template.json";
import get from "lodash/get";

const fileName = "my-pdf.pdf";

const defaultVoucher = {
  vendor: {
    name: "default vendor name",
    street: "default vendor street",
    zip_city: "default vendor zip city",
  },
};

export function generatePDF(docDefinition: any) {
  const fontDescriptors = {
    Helvetica: {
      normal: "Helvetica",
      bold: "Helvetica-Bold",
      italics: "Helvetica-Oblique",
      bolditalics: "Helvetica-BoldOblique",
    },
  };
  const printer = new pdfMake(fontDescriptors);
  const doc = printer.createPdfKitDocument(docDefinition);

  return new Promise((resolve) => {
    const chunks = [];
    doc.end();
    doc.on("data", (chunk) => {
      chunks.push(chunk);
    });
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
  });
}

export async function oortPdf(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log(`Http function processed request for url "${request.url}"`);

  let templateStr = JSON.stringify(template);

  templateStr = templateStr.replace(
    "{vendor_name}",
    get(request.body, "name", defaultVoucher.vendor.name)
  );
  templateStr = templateStr.replace(
    "{vendor_street}",
    get(request.body, "street", defaultVoucher.vendor.street)
  );
  templateStr = templateStr.replace(
    "{vendor_zip_city}",
    get(request.body, "zip_city", defaultVoucher.vendor.zip_city)
  );

  const pdf = await generatePDF(JSON.parse(templateStr));

  console.log(pdf);

  return {
    body: pdf as any,
    headers: {
      "Content-Disposition": `attachment; filename=${fileName}`,
    },
  };
}

app.http("oort-pdf", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: oortPdf,
});
