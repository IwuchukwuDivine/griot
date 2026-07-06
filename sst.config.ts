/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "griot",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: { region: "eu-west-2" },
      },
    };
  },
  async run() {
    const signingSecret = new sst.Secret("SlackSigningSecret");
    const botToken = new sst.Secret("SlackBotToken");
    const databaseUrl = new sst.Secret("DatabaseUrl");
    const geminiApiKey = new sst.Secret("GeminiApiKey");

    const api = new sst.aws.ApiGatewayV2("Api");

    api.route("POST /slack/events", {
      handler: "packages/slack/src/lambda.handler",
      runtime: "nodejs20.x",
      architecture: "arm64",
      environment: {
        SLACK_SIGNING_SECRET: signingSecret.value,
        SLACK_BOT_TOKEN: botToken.value,
        DATABASE_URL: databaseUrl.value,
        GEMINI_API_KEY: geminiApiKey.value,
      },
    });

    api.route("GET /health", {
      handler: "packages/slack/src/health.handler",
      runtime: "nodejs20.x",
      architecture: "arm64",
      environment: {
        DATABASE_URL: databaseUrl.value,
      },
    });

    // Scheduled rhythms — EventBridge cron expressions are UTC;
    // Africa/Lagos is UTC+1 year-round (no DST).
    const cronFunction = {
      handler: "packages/slack/src/cron.handler",
      runtime: "nodejs20.x" as const,
      architecture: "arm64" as const,
      timeout: "120 seconds" as const,
      environment: {
        SLACK_BOT_TOKEN: botToken.value,
        DATABASE_URL: databaseUrl.value,
        GEMINI_API_KEY: geminiApiKey.value,
      },
    };

    // 18:00 Africa/Lagos, end of the workday
    new sst.aws.Cron("DailySummary", {
      schedule: "cron(0 17 * * ? *)",
      function: cronFunction,
      event: { job: "daily_summary" },
    });

    // 08:30 Africa/Lagos, morning deadline check
    new sst.aws.Cron("DeadlineCheck", {
      schedule: "cron(30 7 * * ? *)",
      function: cronFunction,
      event: { job: "deadline_check" },
    });

    return {
      // Paste this into Slack → Event Subscriptions → Request URL
      slackEventsUrl: $interpolate`${api.url}/slack/events`,
      healthUrl: $interpolate`${api.url}/health`,
    };
  },
});
