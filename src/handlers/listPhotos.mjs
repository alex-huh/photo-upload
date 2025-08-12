import {S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';

const client = new S3Client({});
const bucket = process.env.BUCKET_NAME;

export async function lambdaHandler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "http://localhost:5173",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  try {
    const prefix = event.queryStringParameters?.prefix || ""; // e.g., "gold-dot/"
    
    const listCommand = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
    });

    const response = await client.send(listCommand);

    const files = await Promise.all(
      (response.Contents || []).map(async (item) => {
        const url = await getSignedUrl(
          client,
          new GetObjectCommand({ Bucket: bucket, Key: item.Key }),
          { expiresIn: 3600 }
        );

        return {
          key: item.Key,
          url,
          lastModified: item.LastModified,
          size: item.Size,
        };
      })
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ files }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
}