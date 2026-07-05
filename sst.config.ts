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

    const api = new sst.aws.ApiGatewayV2("Api");

    api.route("POST /slack/events", {
      handler: "packages/slack/src/lambda.handler",
      runtime: "nodejs20.x",
      architecture: "arm64",
      environment: {
        SLACK_SIGNING_SECRET: signingSecret.value,
        SLACK_BOT_TOKEN: botToken.value,
        DATABASE_URL: databaseUrl.value,
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

    return {
      // Paste this into Slack → Event Subscriptions → Request URL
      slackEventsUrl: $interpolate`${api.url}/slack/events`,
      healthUrl: $interpolate`${api.url}/health`,
    };
  },
});
