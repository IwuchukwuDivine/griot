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
    const slackClientId = new sst.Secret("SlackClientId");
    const slackClientSecret = new sst.Secret("SlackClientSecret");

    const api = new sst.aws.ApiGatewayV2("Api");

    // One Lambda serves Slack events and the OAuth install flow — the
    // handler routes the two GET paths itself before Bolt sees anything.
    const slackFn = new sst.aws.Function("SlackHandler", {
      handler: "packages/slack/src/lambda.handler",
      runtime: "nodejs22.x",
      architecture: "arm64",
      // More memory = proportionally more CPU on Lambda → faster cold-start
      // inits, which is what pushed acks past Slack's 3s window.
      memory: "512 MB",
      environment: {
        SLACK_SIGNING_SECRET: signingSecret.value,
        SLACK_BOT_TOKEN: botToken.value,
        DATABASE_URL: databaseUrl.value,
        GEMINI_API_KEY: geminiApiKey.value,
        SLACK_CLIENT_ID: slackClientId.value,
        SLACK_CLIENT_SECRET: slackClientSecret.value,
      },
    });

    api.route("POST /slack/events", slackFn.arn);
    api.route("GET /slack/install", slackFn.arn);
    api.route("GET /slack/oauth_redirect", slackFn.arn);

    api.route("GET /health", {
      handler: "packages/slack/src/health.handler",
      runtime: "nodejs22.x",
      architecture: "arm64",
      environment: {
        DATABASE_URL: databaseUrl.value,
      },
    });

    // Scheduled rhythms — EventBridge cron expressions are UTC;
    // Africa/Lagos is UTC+1 year-round (no DST).
    const cronFunction = {
      handler: "packages/slack/src/cron.handler",
      runtime: "nodejs22.x" as const,
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
      // "Add to Slack" entrypoint; register the redirect URL in the Slack app
      installUrl: $interpolate`${api.url}/slack/install`,
      oauthRedirectUrl: $interpolate`${api.url}/slack/oauth_redirect`,
      healthUrl: $interpolate`${api.url}/health`,
    };
  },
});
