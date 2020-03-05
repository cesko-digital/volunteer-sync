import Airtable from "airtable";
import { Volunteer } from "./slack";

type Field =
  | "Name"
  | "Slack ID"
  | "Role"
  | "Slack telefon"
  | "Email Address"
  | "Dostupnost"
  | "Avatar"
  | "Intro";

async function getVolunteerAirTableId(
  table: Airtable.Table<{}>,
  slackId: string
): Promise<string | null> {
  const filter = `SEARCH("${slackId}", {Slack ID})`;
  const query = table.select({
    filterByFormula: filter,
    fields: ["Slack ID"]
  });
  const matches = await query.firstPage();
  return matches.length > 0 ? matches[0].id : null;
}

function toRecord(v: Volunteer): Partial<Record<Field, string>> {
  return {
    "Name": v.name,
    "Slack ID": v.slackId,
    "Role": v.title,
    "Slack telefon": v.phone,
    "Email Address": v.email,
    "Dostupnost": v.weeklyAvailability,
    "Avatar": v.profilePictureUrl,
    "Intro": v.introPost
  };
}

export async function saveToAirTable(
  apiToken: string,
  volunteers: Volunteer[]
) {
  const table = new Airtable({ apiKey: apiToken }).base("apppZX1QC3fl1RTBM")(
    "V2"
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
