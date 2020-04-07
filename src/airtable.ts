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

/**
 * Find the AirTable record ID by volunteer’s Slack ID
 *
 * Unfortunately AirTable doesn’t seem to support turning the Slack ID
 * into a regular primary key.
 */
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

/**
 * Turn a volunteer object to an AirTable record
 *
 * The only thing that’s needed is to rename the properties
 * to appropriate AirTable column labels.
 */
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

/**
 * Save a number of volunteers to AirTable
 *
 * Is a previous volunteer record with the same Slack ID is found, the record is
 * updated instead of adding a new one.
 */
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
        console.log(
          `Inserting new user “${slackId}”, record ${count}/${volunteers.length}.`
        );
        await table.create(toRecord(volunteer));
      }
    } catch (err) {
      console.error(err);
    }
    count++;
  }
}
