export default () => ({
  aws: {
    accessKeyEnabled: process.env.AWS_ACCESS_KEY_ENABLED !== 'false',
    sqs: {
      accessKey: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION ?? 'us-east-1',
    },
    s3: {
      accessKey: process.env.AWS_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
      region: process.env.AWS_S3_REGION ?? 'us-east-1',
      bucket: process.env.AWS_S3_BUCKET ?? 'template-dev',
    },
  },
  logs: {
    logstashUrl: process.env.LOGSTASH_URL ?? '172.24.0.13',
    logstashPort: process.env.LOGSTASH_PORT ?? 5044,
  },
});
