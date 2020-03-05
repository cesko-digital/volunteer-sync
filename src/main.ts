import {
  User,
  Message,
  getAllWorkspaceUsers,
  slackUserToVolunteer,
  getWeeklyAvailability,
  getCompleteChannelHistory
} from "./slack";
import { saveToAirTable } from "./airtable";

const isRegularUser: (_: User) => boolean = user => {
  return !user.deleted && !user.is_bot && user.id !== "USLACKBOT";
};

const hasTitle: (_: User) => boolean = user => {
  return user.profile.title != null && user.profile.title !== "";
};

function buildIntroPostMap(channelHistory: Message[]): Map<string, string> {
  var map: Map<string, string> = new Map();
  for (const msg of channelHistory) {
    if (map.get(msg.user) != null) {
      // Not a first message in channel
      continue;
    }
    if (msg.type !== "message") {
      // Not an ordinary message
      continue;
    }
    if (msg.text.startsWith("<@")) {
      // User joining or setting the channel purpose
      continue;
    }
    map.set(msg.user, msg.text);
  }
  return map;
}

function envOrDie(key: string): string {
  const val = process.env[key];
  if (val == null) {
    throw `Please define the ${key} env variable.`;
  }
  return val;
}

const main = async () => {
  const slackToken = envOrDie("SLACK_API_TOKEN");
  const airtableToken = envOrDie("AIRTABLE_API_TOKEN");

  console.log("Downloading #introductions.");

  const history = await getCompleteChannelHistory(slackToken, "CJVB0MVCM");
  const introMap = buildIntroPostMap(history);

  console.log("Downloading Slack users.");

  const allUsers = await getAllWorkspaceUsers(slackToken);
  const regularUsers = allUsers.filter(isRegularUser);
  const volunteers = regularUsers.filter(hasTitle).map(slackUserToVolunteer);

  console.log(
    `Downloaded ${regularUsers.length} regular users (${allUsers.length} total).`
  );
  console.log(
    `Querying Slack API for volunteer weekly availability info. (This will take a while.)`
  );

  for (const volunteer of volunteers) {
    const availability = await getWeeklyAvailability(
      slackToken,
      volunteer.slackId
    );
    volunteer.weeklyAvalability = availability ?? undefined;
    volunteer.introPost = introMap.get(volunteer.slackId);
  }

  console.log(`Saving to AirTable.`);

  await saveToAirTable(airtableToken, volunteers);
};

main();
