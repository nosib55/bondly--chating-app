/**
 * Convert a File to a base64 string (without the data:... prefix).
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the "data:image/...;base64," prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload an image file to ImgBB using base64 encoding.
 * @param file - The File object selected by the user
 * @returns The permanent HTTPS URL of the uploaded image
 */
export async function uploadToImgBB(file: File): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

  if (!apiKey) {
    throw new Error(
      "NEXT_PUBLIC_IMGBB_API_KEY is not set in your environment variables."
    );
  }

  // ImgBB is more reliable with base64 than raw binary FormData
  const base64 = await fileToBase64(file);

  const formData = new FormData();
  formData.append("image", base64);

  const response = await fetch(
    `https://api.imgbb.com/1/upload?key=${apiKey}`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    // Log the body so we can see the exact ImgBB error message
    const errorBody = await response.text().catch(() => "");
    console.error("ImgBB error response:", errorBody);
    throw new Error(`ImgBB upload failed (${response.status}): ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success) {
    console.error("ImgBB rejection:", data);
    throw new Error(data?.error?.message || "ImgBB upload was not successful.");
  }

  // data.data.url        → direct image link
  // data.data.display_url → display-optimized link (same in most cases)
  return data.data.url as string;
}
