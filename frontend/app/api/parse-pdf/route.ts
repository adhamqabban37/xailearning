// Next.js API route for PDF parsing (app directory structure)
import { NextRequest, NextResponse } from "next/server";

// Enable CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle preflight OPTIONS request
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// Main POST handler for PDF upload
export async function POST(request: NextRequest) {
  console.log("📄 PDF upload request received");

  try {
    // Get the uploaded file from FormData
    const formData = await request.formData();
    const file = formData.get("file") as File;

    // Validate file presence
    if (!file) {
      console.error("❌ No file uploaded");
      return NextResponse.json(
        {
          error: "No file uploaded",
          detail: "Please select a PDF file to upload",
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    const isValidPDF =
      fileName.endsWith(".pdf") || file.type === "application/pdf";

    if (!isValidPDF) {
      console.error("❌ Invalid file type:", file.type);
      return NextResponse.json(
        {
          error: "Invalid file type",
          detail: "Please upload a PDF file only",
        },
        {
          status: 415,
          headers: corsHeaders,
        }
      );
    }

    // Validate file size (20MB limit)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      console.error("❌ File too large:", file.size);
      return NextResponse.json(
        {
          error: "File too large",
          detail: "File size must be less than 20MB",
        },
        {
          status: 413,
          headers: corsHeaders,
        }
      );
    }

    console.log("✅ File validation passed:", {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type,
    });

    // Read file buffer
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Here you would integrate with your PDF parsing library
    // For this example, we'll create a mock response
    const mockParsedData = {
      ok: true,
      filename: file.name,
      data: {
        metadata: {
          title: "Sample PDF Document",
          author: "Unknown",
          page_count: 1,
        },
        pages: [
          {
            page_number: 1,
            text: "This is a mock parsed content from the PDF file. In a real implementation, you would use a PDF parsing library like pdf-parse, pdf2json, or pdfplumber to extract the actual content.",
            char_count: 150,
            tables: [],
            images_count: 0,
          },
        ],
        summary: {
          total_pages: 1,
          total_characters: 150,
          total_words: 25,
          total_tables: 0,
          total_images: 0,
          has_tables: false,
          has_images: false,
        },
      },
    };

    console.log("✅ PDF parsed successfully");

    // Return successful response
    return NextResponse.json(mockParsedData, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("❌ PDF parsing error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        detail: "Failed to process PDF file. Please try again.",
        ...(process.env.NODE_ENV === "development" && {
          debug: error instanceof Error ? error.message : "Unknown error",
        }),
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "PDF Parser API",
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: corsHeaders,
    }
  );
}
