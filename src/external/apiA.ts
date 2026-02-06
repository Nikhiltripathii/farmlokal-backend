import axios from "axios";

const API_URL = "https://jsonplaceholder.typicode.com/posts";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchExternalData(
  retries = 3,
  backoffMs = 300
): Promise<any> {
  try {
    const response = await axios.get(API_URL, {
      timeout: 2000, // timeout handling
    });

    return response.data;
  } catch (error) {
    if (retries <= 0) {
      throw new Error("External API failed after retries");
    }

    // exponential backoff
    await sleep(backoffMs);

    return fetchExternalData(retries - 1, backoffMs * 2);
  }
}
