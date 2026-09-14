import { readCertificate } from "@/lib/server/store";

/**
 * Serves a lot's uploaded certificate PDF. Certificates are public by
 * design — anyone holding a vial should be able to read its record — so this
 * only checks that the lot has one, and locks the response to a PDF.
 */
export async function GET(_: Request, { params }: { params: Promise<{ lot: string }> }) {
  const { lot } = await params;
  if (!/^[A-Z0-9][A-Z0-9-]{2,23}$/.test(lot)) return new Response(null, { status: 404 });

  const bytes = await readCertificate(lot);
  if (!bytes) return new Response("No certificate has been uploaded for that lot.", { status: 404 });

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Red-Sky-certificate-${lot}.pdf"`,
      "Cache-Control": "public, max-age=300",
      "Content-Security-Policy": "default-src 'none'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
