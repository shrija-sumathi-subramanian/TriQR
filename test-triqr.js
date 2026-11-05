
const BASE_URL = "http://localhost:3000";

const testProfile = {
  name: "Alex",
  links: [
    {
      type: "portfolio",
      label: "My Portfolio",
      value: "https://alex.dev",
    },
    {
      type: "linkedin",
      label: "LinkedIn",
      value: "https://linkedin.com/in/alex",
    },
    {
      type: "github",
      label: "GitHub",
      value: "https://github.com/alex",
    },
    {
      type: "email",
      label: "Email",
      value: "alex@example.com",
    },
    {
      type: "website",
      label: "My Website",
      value: "https://alex.com",
    },
  ],
};

async function postData(endpoint, data) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      `${endpoint} failed: ${JSON.stringify(result)}`
    );
  }

  return result;
}

async function runTriQRTest() {
  try {
    console.log("\n================================");
    console.log("       TR IQR BACKEND TEST");
    console.log("================================");

    // STEP 1: Validate user profile
    console.log("\nSTEP 1: Validating user profile...");

    const profileResult = await postData(
      "/api/profile/validate",
      testProfile
    );

    console.log("SUCCESS:", profileResult.message);

    // STEP 2: Get AI recommendations
    console.log("\nSTEP 2: Generating AI recommendations...");

    const recommendationResult = await postData(
      "/api/ai/recommend",
      testProfile
    );

    const recommendedLinks =
      recommendationResult.recommendedLinks;

    const additionalLinks =
      recommendationResult.additionalLinks;

    console.log("\nRecommended links:");

    recommendedLinks.forEach((link, index) => {
      console.log(`${index + 1}. ${link.label} - ${link.value}`);
    });

    console.log("\nAdditional links:");

    additionalLinks.forEach((link) => {
      console.log(`- ${link.label}`);
    });

    // STEP 3: Generate AI design
    console.log("\nSTEP 3: Generating AI cube design...");

    const designResult = await postData(
      "/api/ai/design",
      {
        stylePreference: "Futuristic dark blue and violet theme",
      }
    );

    console.log("Theme:", designResult.design.themeName);
    console.log("Primary colour:", designResult.design.palette.primary);
    console.log("Secondary colour:", designResult.design.palette.secondary);
    console.log("Heading font:", designResult.design.typography.heading);

    // STEP 4: Generate QR codes
    console.log("\nSTEP 4: Generating QR codes...");

    const generatedQRs = [];

    for (const link of recommendedLinks) {
      const qrResult = await postData(
        "/api/qr/generate",
        link
      );

      const isValidImage =
        typeof qrResult.qrCode === "string" &&
        qrResult.qrCode.startsWith("data:image/png;base64,");

      if (!isValidImage) {
        throw new Error(
          `Invalid QR image returned for ${link.label}`
        );
      }

      generatedQRs.push(qrResult);

      console.log(
        `SUCCESS: ${link.label} QR generated (${qrResult.qrCode.length} characters)`
      );
    }

    // FINAL SUMMARY
    console.log("\n================================");
    console.log("       FINAL TEST SUMMARY");
    console.log("================================");

    console.log("Profile validation: SUCCESS");
    console.log("AI recommendations: SUCCESS");
    console.log("Additional links: SUCCESS");
    console.log("AI design generation: SUCCESS");
    console.log("QR code generation: SUCCESS");

    console.log("\nRecommended QR codes:", generatedQRs.length);
    console.log("Additional links:", additionalLinks.length);

    console.log("\nTRIQR BACKEND TEST COMPLETED!");

  } catch (error) {
    console.error("\nTRIQR TEST FAILED!");
    console.error(error.message);
  }
}

runTriQRTest();
