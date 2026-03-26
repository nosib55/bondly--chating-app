/**
 * Upload an image file to ImgBB.
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

  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(
    `https://api.imgbb.com/1/upload?key=${apiKey}`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`ImgBB upload failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error("ImgBB upload was not successful.");
  }

  // data.data.url        → direct image link
  // data.data.display_url → display-optimized link (same in most cases)
  return data.data.url as string;
}
