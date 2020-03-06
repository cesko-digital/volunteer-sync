import Airtable from "airtable";
import { Volunteer } from "./slack";

type Field =
  | "Slack: Jméno"
  | "Slack: ID"
  | "Slack: Popis"
  | "Slack: Telefon"
  | "Slack: E-mail"
  | "Slack: Dostupnost"
  | "Slack: Avatar"
  | "Slack: Intro";

async function getVolunteerAirTableId(
  table: Airtable.Table<{}>,
  slackId: string
): Promise<string | null> {
  const filter = `SEARCH("${slackId}", {Slack: ID})`;
  const query = table.select({
    filterByFormula: filter,
    fields: ["Slack: ID"]
  });
  const matches = await query.firstPage();
  return matches.length > 0 ? matches[0].id : null;
}

function toRecord(v: Volunteer): Partial<Record<Field, string>> {
  return {
    "Slack: Jméno": v.name,
    "Slack: ID": v.slackId,
    "Slack: Popis": v.title,
    "Slack: Telefon": v.phone,
    "Slack: E-mail": v.email,
    "Slack: Dostupnost": v.weeklyAvailability,
    "Slack: Avatar": v.profilePictureUrl,
    "Slack: Intro": v.introPost
  };
}

export async function saveToAirTable(
  apiToken: string,
  volunteers: Volunteer[]
) {
  const table = new Airtable({ apiKey: apiToken }).base("apppZX1QC3fl1RTBM")(
    "Volunteers"
  );

  var count = 1;

  for (const volunteer of volunteers) {
    try {
      const slackId = volunteer.slackId;
      const existingId = await getVolunteerAirTableId(table, slackId);
      if (existingId != null) {
        console.log(
          `Updating existing user “${slackId}”, record ${count}/${volunteers.length}.`
        );
        await table.update(existingId, toRecord(volunteer));
      } else {
        if (volunteer.title != null) {
          console.log(
            `Inserting new user “${slackId}”, record ${count}/${volunteers.length}.`
          );
          await table.create(toRecord(volunteer));
        }
      }
    } catch (err) {
      console.error(err);
    }
    count++;
  }
}
