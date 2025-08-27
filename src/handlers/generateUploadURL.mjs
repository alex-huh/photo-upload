import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const client = new S3Client({});
const bucket = process.env.BUCKET_NAME;

export async function lambdaHandler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "http://localhost:5173",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST,PUT"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: JSON.stringify({message: "CORS preflight success"}) };
  }

  try {
    const { filename, contentType, folder} = JSON.parse(event.body);
    const key = folder ? `${folder}/${filename}` : filename;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadURL = await getSignedUrl(client, command, { expiresIn: 60 });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ uploadURL })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
}
