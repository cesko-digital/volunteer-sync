import {
  User,
  Message,
  getAllWorkspaceUsers,
  slackUserToVolunteer,
  getWeeklyAvailability,
  getCompleteChannelHistory
} from "./slack";
import { saveToAirTable } from "./airtable";
import { uploadSubscribers } from "./ecomail";
import { chunk } from "./utils";

/**
 * Is the user a regular one?
 *
 * We filter out deleted users and bots, including the Slackbot.
 */
const isRegularUser: (_: User) => boolean = user => {
  return !user.deleted && !user.is_bot && user.id !== "USLACKBOT";
};

/**
 * Pause the thread execution for a given number of ms.
 */
const sleep = (delayMs: number) =>
  new Promise(resolve => setTimeout(resolve, delayMs));

/**
 * Turn a channel history into a map of first posts indexed by user’s Slack ID.
 */
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

/**
 * Return a value from the environment and abort if the value is missing
 */
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
  const ecomailToken = envOrDie("ECOMAIL_API_TOKEN");

  console.log("Downloading #introductions.");

  const history = await getCompleteChannelHistory(slackToken, "CJVB0MVCM");
  const introMap = buildIntroPostMap(history);

  console.log("Downloading Slack users.");

  const allUsers = await getAllWorkspaceUsers(slackToken);
  const regularUsers = allUsers.filter(isRegularUser);
  const volunteers = regularUsers.map(slackUserToVolunteer);

  console.log(
    `Downloaded ${regularUsers.length} regular users (${allUsers.length} total).`
  );
  console.log(
    `Querying Slack API for volunteer weekly availability info. (This will take a while.)`
  );

  for (const volunteer of volunteers) {
    try {
      const availability = await getWeeklyAvailability(
        slackToken,
        volunteer.slackId
      );
      volunteer.weeklyAvailability = availability ?? undefined;
      volunteer.introPost = introMap.get(volunteer.slackId);
    } catch (error) {
      // TODO: This is most probably a rate limit kicking in (“ratelimited”), how do we make sure?
      console.error(error);
      await sleep(30 * 1000);
    }
  }

  try {
    console.log(`Saving ${volunteers.length} volunteers to AirTable.`);
    await saveToAirTable(airtableToken, volunteers);
    // Uploading in chunks to uphold Ecomail API limits
    for (const batch of chunk(volunteers, 500)) {
      console.log(`Uploading ${batch.length} volunteer e-mails to Ecomail.`);
      await uploadSubscribers(ecomailToken, batch);
    }
  } catch (e) {
    console.error(e);
  }
};

main().catch(e => console.error(e));
